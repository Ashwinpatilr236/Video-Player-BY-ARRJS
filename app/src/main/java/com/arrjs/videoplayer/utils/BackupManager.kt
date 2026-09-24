package com.arrjs.videoplayer.utils

import android.content.Context
import com.arrjs.videoplayer.data.local.AppDatabase
import com.arrjs.videoplayer.data.model.Playlist
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

object BackupManager {

    suspend fun createBackupJson(context: Context, database: AppDatabase): String = withContext(Dispatchers.IO) {
        val root = JSONObject()
        root.put("appVersion", AppUpdateManager.getAppVersionName(context))
        root.put("timestamp", System.currentTimeMillis())

        // 1. Playlists
        val playlists = database.playlistDao().getAllPlaylists().firstOrNull() ?: emptyList()
        val playlistArr = JSONArray()
        for (pl in playlists) {
            val plObj = JSONObject().apply {
                put("id", pl.id)
                put("name", pl.name)
                put("type", pl.type)
                put("url", pl.url)
                put("isActive", pl.isActive)
            }
            playlistArr.put(plObj)
        }
        root.put("playlists", playlistArr)

        // 2. Favorites
        val favorites = database.favoriteDao().getAllFavorites().firstOrNull() ?: emptyList()
        val favArr = JSONArray()
        for (fav in favorites) {
            val fObj = JSONObject().apply {
                put("channelId", fav.channelId)
                put("playlistId", fav.playlistId)
                put("name", fav.name)
                put("streamUrl", fav.streamUrl)
                put("categoryName", fav.categoryName)
            }
            favArr.put(fObj)
        }
        root.put("favorites", favArr)

        // 3. Settings
        val settingsObj = JSONObject().apply {
            put("autoPreview", AppSettings.isAutoPreviewOnScroll(context))
            put("autoPlayLast", AppSettings.isAutoPlayLastChannel(context))
            put("hwAccel", AppSettings.isHardwareAcceleration(context))
            put("surroundPassthrough", AppSettings.isSurroundPassthroughEnabled(context))
        }
        root.put("settings", settingsObj)

        root.toString(2)
    }

    suspend fun saveBackupToFile(context: Context, database: AppDatabase): File = withContext(Dispatchers.IO) {
        val json = createBackupJson(context, database)
        val backupFile = File(context.filesDir, "arrjs_tv_backup.json")
        backupFile.writeText(json)
        backupFile
    }

    suspend fun restoreBackupFromJson(context: Context, database: AppDatabase, jsonStr: String): Result<Int> = withContext(Dispatchers.IO) {
        try {
            val root = JSONObject(jsonStr)

            // Restore settings
            if (root.has("settings")) {
                val settings = root.getJSONObject("settings")
                AppSettings.setAutoPreviewOnScroll(context, settings.optBoolean("autoPreview", true))
                AppSettings.setAutoPlayLastChannel(context, settings.optBoolean("autoPlayLast", true))
                AppSettings.setHardwareAcceleration(context, settings.optBoolean("hwAccel", true))
                AppSettings.setSurroundPassthroughEnabled(context, settings.optBoolean("surroundPassthrough", false))
            }

            // Restore playlists
            var restoredCount = 0
            if (root.has("playlists")) {
                val arr = root.getJSONArray("playlists")
                for (i in 0 until arr.length()) {
                    val obj = arr.getJSONObject(i)
                    val playlist = Playlist(
                        name = obj.getString("name"),
                        type = obj.optString("type", "M3U"),
                        url = obj.getString("url"),
                        isActive = obj.optBoolean("isActive", false)
                    )
                    database.playlistDao().insertPlaylist(playlist)
                    restoredCount++
                }
            }

            Result.success(restoredCount)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
