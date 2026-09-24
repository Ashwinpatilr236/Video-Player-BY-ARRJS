package com.arrjs.videoplayer.utils

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.core.content.FileProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.TimeUnit

object AppUpdateManager {

    data class UpdateInfo(
        val versionCode: Int,
        val versionName: String,
        val downloadUrl: String,
        val changelog: String,
        val isMandatory: Boolean
    )

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .build()

    // Default remote update check endpoint (configured to GitHub repo raw file)
    const val DEFAULT_UPDATE_URL = "https://raw.githubusercontent.com/Ashwinpatilr236/Video-Player-by-ARRJS/main/update.json"

    suspend fun checkForUpdate(context: Context, updateUrl: String = DEFAULT_UPDATE_URL): Result<UpdateInfo?> = withContext(Dispatchers.IO) {
        try {
            val cleanUrl = NetworkUtils.resolveUrl(updateUrl)
            val request = Request.Builder()
                .url(cleanUrl)
                .header("User-Agent", "ARRJS-TV-Updater/1.0")
                .build()

            httpClient.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    return@withContext Result.failure(Exception("HTTP ${response.code}: ${response.message}"))
                }
                val body = response.body?.string() ?: return@withContext Result.failure(Exception("Empty update response"))
                val json = JSONObject(body)

                val serverVersionCode = json.optInt("versionCode", 0)
                val serverVersionName = json.optString("versionName", "1.0.0")
                val downloadUrl = json.optString("downloadUrl", "")
                val changelog = json.optString("changelog", "Bug fixes and performance improvements.")
                val isMandatory = json.optBoolean("isMandatory", false)

                val currentVersionCode = getAppVersionCode(context)

                if (serverVersionCode > currentVersionCode && downloadUrl.isNotBlank()) {
                    Result.success(
                        UpdateInfo(
                            versionCode = serverVersionCode,
                            versionName = serverVersionName,
                            downloadUrl = NetworkUtils.resolveUrl(downloadUrl),
                            changelog = changelog,
                            isMandatory = isMandatory
                        )
                    )
                } else {
                    Result.success(null) // App is already up to date
                }
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun downloadApk(
        context: Context,
        downloadUrl: String,
        onProgress: (Int) -> Unit
    ): Result<File> = withContext(Dispatchers.IO) {
        try {
            val cleanUrl = NetworkUtils.resolveUrl(downloadUrl)
            val request = Request.Builder().url(cleanUrl).build()

            httpClient.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    return@withContext Result.failure(Exception("Download failed: HTTP ${response.code}"))
                }
                val body = response.body ?: return@withContext Result.failure(Exception("Empty download body"))
                val contentLength = body.contentLength()

                val destinationFile = File(context.cacheDir, "arrjs_update.apk")
                if (destinationFile.exists()) destinationFile.delete()

                body.byteStream().use { input ->
                    FileOutputStream(destinationFile).use { output ->
                        val buffer = ByteArray(8192)
                        var bytesRead: Int
                        var totalBytesRead = 0L

                        while (input.read(buffer).also { bytesRead = it } != -1) {
                            output.write(buffer, 0, bytesRead)
                            totalBytesRead += bytesRead
                            if (contentLength > 0) {
                                val progress = ((totalBytesRead * 100) / contentLength).toInt()
                                onProgress(progress)
                            }
                        }
                        output.flush()
                    }
                }
                Result.success(destinationFile)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun promptInstallApk(context: Context, apkFile: File) {
        val authority = "${context.packageName}.fileprovider"
        val apkUri: Uri = FileProvider.getUriForFile(context, authority, apkFile)

        val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(apkUri, "application/vnd.android.package-archive")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }

    fun getAppVersionCode(context: Context): Long {
        return try {
            val pInfo = context.packageManager.getPackageInfo(context.packageName, 0)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                pInfo.longVersionCode
            } else {
                @Suppress("DEPRECATION")
                pInfo.versionCode.toLong()
            }
        } catch (e: Exception) {
            1L
        }
    }

    fun getAppVersionName(context: Context): String {
        return try {
            val pInfo = context.packageManager.getPackageInfo(context.packageName, 0)
            pInfo.versionName ?: "1.0.0"
        } catch (e: Exception) {
            "1.0.0"
        }
    }
}
