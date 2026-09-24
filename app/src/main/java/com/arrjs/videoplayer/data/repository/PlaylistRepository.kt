package com.arrjs.videoplayer.data.repository

import com.arrjs.videoplayer.data.local.AppDatabase
import com.arrjs.videoplayer.data.model.Playlist
import com.arrjs.videoplayer.data.parser.M3UParser
import com.arrjs.videoplayer.data.xtream.XtreamApiClient
import android.content.Context
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.InputStream
import java.util.concurrent.TimeUnit

class PlaylistRepository(
    private val database: AppDatabase,
    private val context: Context? = null
) {

    private val playlistDao = database.playlistDao()
    private val channelDao = database.channelDao()
    private val categoryDao = database.categoryDao()
    private val universalParser = com.arrjs.videoplayer.data.parser.UniversalPlaylistParser()

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(25, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .followRedirects(true)
        .followSslRedirects(true)
        .build()

    fun getAllPlaylists(): Flow<List<Playlist>> = playlistDao.getAllPlaylists()

    suspend fun getActivePlaylist(): Playlist? = playlistDao.getActivePlaylist()

    suspend fun setActivePlaylist(id: Long) = playlistDao.setActivePlaylist(id)

    suspend fun deletePlaylist(playlist: Playlist) = withContext(Dispatchers.IO) {
        channelDao.deleteChannelsByPlaylist(playlist.id)
        categoryDao.deleteCategoriesByPlaylist(playlist.id)
        playlistDao.deletePlaylist(playlist)
    }

    fun interface ImportProgressCallback {
        fun onProgress(stage: String, current: Long, total: Long, message: String)
    }

    suspend fun importM3UFromUrl(
        name: String,
        url: String,
        callback: ImportProgressCallback? = null
    ): Result<Playlist> = withContext(Dispatchers.IO) {
        try {
            callback?.onProgress("Connecting", 10, 100, "Connecting to stream server...")
            val cleanUrl = com.arrjs.videoplayer.utils.NetworkUtils.resolveUrl(url)

            val playlist = Playlist(
                name = name,
                type = "M3U",
                url = cleanUrl,
                isActive = true
            )
            val playlistId = playlistDao.insertPlaylist(playlist)
            playlistDao.setActivePlaylist(playlistId)

            val request = Request.Builder()
                .url(cleanUrl)
                .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
                .header("Accept", "*/*")
                .build()

            callback?.onProgress("Downloading", 35, 100, "Downloading playlist stream data...")

            httpClient.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    return@withContext Result.failure(Exception("HTTP error ${response.code}: ${response.message}"))
                }
                val stream = response.body?.byteStream() ?: return@withContext Result.failure(Exception("Empty playlist body returned by server"))
                callback?.onProgress("Parsing", 60, 100, "Parsing channel streams & metadata...")
                importM3UStream(playlistId, stream, callback)
            }

            callback?.onProgress("Indexing", 95, 100, "Saving channels to database...")
            val saved = playlistDao.getPlaylistById(playlistId) ?: playlist
            callback?.onProgress("Complete", 100, 100, "Playlist ready!")
            Result.success(saved)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun importM3UStream(
        playlistId: Long,
        inputStream: InputStream,
        callback: ImportProgressCallback? = null
    ): Int = withContext(Dispatchers.IO) {
        val result = universalParser.parse(inputStream, playlistId)
        callback?.onProgress("Parsed", 75, 100, "Parsed ${result.channels.size} channels, ${result.categories.size} categories")

        val epgToSync = if (!result.epgUrl.isNullOrBlank()) {
            result.epgUrl
        } else if (context != null) {
            com.arrjs.videoplayer.utils.AppSettings.getEpgUrl(context)
        } else {
            null
        }

        if (context != null && !epgToSync.isNullOrBlank()) {
            com.arrjs.videoplayer.utils.AppSettings.setEpgUrl(context, epgToSync)
            (context.applicationContext as? com.arrjs.videoplayer.TvPlayerApplication)?.let { app ->
                kotlinx.coroutines.CoroutineScope(Dispatchers.IO).launch {
                    try {
                        app.epgRepository.syncEpgFromUrl(epgToSync)
                    } catch (_: Exception) {}
                }
            }
        }

        channelDao.deleteChannelsByPlaylist(playlistId)
        categoryDao.deleteCategoriesByPlaylist(playlistId)

        categoryDao.insertCategories(result.categories)
        val batches = result.channels.chunked(500)
        batches.forEachIndexed { index, batch ->
            channelDao.insertChannels(batch)
            val pct = 75 + ((index + 1) * 20 / batches.size.coerceAtLeast(1))
            callback?.onProgress("Indexing", pct.toLong(), 100, "Indexing channels (${(index + 1) * 500.coerceAtMost(result.channels.size)} / ${result.channels.size})...")
        }

        playlistDao.updateChannelCount(playlistId, result.channels.size)
        result.channels.size
    }

    suspend fun importXtreamCodes(
        name: String,
        serverUrl: String,
        username: String,
        password: String
    ): Result<Playlist> = withContext(Dispatchers.IO) {
        try {
            val client = XtreamApiClient(serverUrl, username, password)
            val isAuthed = client.authenticate()
            if (!isAuthed) {
                return@withContext Result.failure(Exception("Xtream authentication failed. Please verify server URL, username, and password."))
            }

            val playlist = Playlist(
                name = name,
                type = "XTREAM",
                url = serverUrl,
                username = username,
                password = password,
                isActive = true
            )
            val playlistId = playlistDao.insertPlaylist(playlist)
            playlistDao.setActivePlaylist(playlistId)

            // Fetch Live, VOD, and Series categories and streams
            val liveCategories = client.fetchLiveCategories(playlistId)
            val vodCategories = client.fetchVodCategories(playlistId)
            val seriesCategories = client.fetchSeriesCategories(playlistId)

            val allCategories = ArrayList<com.arrjs.videoplayer.data.model.Category>().apply {
                addAll(liveCategories)
                addAll(vodCategories)
                addAll(seriesCategories)
            }

            val liveChannels = client.fetchLiveStreams(playlistId)
            val vodMovies = client.fetchVodStreams(playlistId)
            val series = client.fetchSeries(playlistId)

            val allChannels = ArrayList<com.arrjs.videoplayer.data.model.Channel>().apply {
                addAll(liveChannels)
                addAll(vodMovies)
                addAll(series)
            }

            channelDao.deleteChannelsByPlaylist(playlistId)
            categoryDao.deleteCategoriesByPlaylist(playlistId)

            categoryDao.insertCategories(allCategories)
            allChannels.chunked(500).forEach { batch ->
                channelDao.insertChannels(batch)
            }

            playlistDao.updateChannelCount(playlistId, allChannels.size)

            val xtreamEpgUrl = "${serverUrl.trimEnd('/')}/xmltv.php?username=$username&password=$password"
            if (context != null) {
                com.arrjs.videoplayer.utils.AppSettings.setEpgUrl(context, xtreamEpgUrl)
                (context.applicationContext as? com.arrjs.videoplayer.TvPlayerApplication)?.let { app ->
                    kotlinx.coroutines.CoroutineScope(Dispatchers.IO).launch {
                        try {
                            app.epgRepository.syncEpgFromUrl(xtreamEpgUrl)
                        } catch (_: Exception) {}
                    }
                }
            }

            val saved = playlistDao.getPlaylistById(playlistId) ?: playlist
            Result.success(saved)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun importStalkerPortal(
        name: String,
        portalUrl: String,
        macAddress: String
    ): Result<Playlist> = withContext(Dispatchers.IO) {
        try {
            val stalkerClient = com.arrjs.videoplayer.data.stalker.StalkerApiClient(portalUrl, macAddress)
            val isAuthed = stalkerClient.authenticate()
            if (!isAuthed) {
                return@withContext Result.failure(Exception("Stalker MAC handshake failed. Please verify portal URL and MAC address."))
            }

            val playlist = Playlist(
                name = name,
                type = "STALKER",
                url = portalUrl,
                username = macAddress,
                isActive = true
            )
            val playlistId = playlistDao.insertPlaylist(playlist)
            playlistDao.setActivePlaylist(playlistId)

            val channels = stalkerClient.fetchChannels(playlistId)
            channelDao.deleteChannelsByPlaylist(playlistId)
            categoryDao.deleteCategoriesByPlaylist(playlistId)

            val generalCategory = com.arrjs.videoplayer.data.model.Category(
                playlistId = playlistId,
                categoryId = "stalker_all",
                categoryName = "Live Channels",
                streamType = com.arrjs.videoplayer.data.model.StreamType.LIVE
            )
            categoryDao.insertCategories(listOf(generalCategory))

            channels.chunked(500).forEach { batch ->
                channelDao.insertChannels(batch)
            }

            playlistDao.updateChannelCount(playlistId, channels.size)
            val saved = playlistDao.getPlaylistById(playlistId) ?: playlist
            Result.success(saved)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
