package com.arrjs.videoplayer.utils

import com.arrjs.videoplayer.data.local.AppDatabase
import com.arrjs.videoplayer.data.model.Category
import com.arrjs.videoplayer.data.model.Channel
import com.arrjs.videoplayer.data.model.Playlist
import com.arrjs.videoplayer.data.model.StreamType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

object SampleDataGenerator {

    suspend fun populateDemoPlaylistIfEmpty(database: AppDatabase, force: Boolean = false) = withContext(Dispatchers.IO) {
        val playlistDao = database.playlistDao()
        val channelDao = database.channelDao()
        val categoryDao = database.categoryDao()

        val active = playlistDao.getActivePlaylist()
        if (active != null && !force) return@withContext

        val demoPlaylist = Playlist(
            name = "ARRJS Demo Streams",
            type = "M3U",
            url = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
            isActive = true,
            channelCount = 6
        )
        val playlistId = playlistDao.insertPlaylist(demoPlaylist)
        playlistDao.setActivePlaylist(playlistId)

        val categories = listOf(
            Category(playlistId = playlistId, categoryId = "featured", categoryName = "Featured Test Streams", streamType = StreamType.LIVE),
            Category(playlistId = playlistId, categoryId = "hls_demo", categoryName = "HLS Benchmarks", streamType = StreamType.LIVE),
            Category(playlistId = playlistId, categoryId = "open_movies", categoryName = "Creative Commons 4K/HD", streamType = StreamType.VOD)
        )
        categoryDao.insertCategories(categories)

        val demoChannels = listOf(
            Channel(
                playlistId = playlistId,
                streamId = "demo_1",
                name = "Big Buck Bunny (HLS Adaptive)",
                streamUrl = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
                logoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg",
                categoryName = "Featured Test Streams",
                streamType = StreamType.LIVE,
                num = 101
            ),
            Channel(
                playlistId = playlistId,
                streamId = "demo_2",
                name = "Tears of Steel (Sci-Fi 1080p HLS)",
                streamUrl = "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
                logoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/TearsOfSteel.jpg",
                categoryName = "Featured Test Streams",
                streamType = StreamType.LIVE,
                num = 102
            ),
            Channel(
                playlistId = playlistId,
                streamId = "demo_3",
                name = "Sintel Open Animation (HLS Stream)",
                streamUrl = "https://bitmovin-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
                logoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg",
                categoryName = "Open Movies",
                streamType = StreamType.VOD,
                num = 103
            ),
            Channel(
                playlistId = playlistId,
                streamId = "demo_4",
                name = "Akamai Live HLS Multi-bitrate",
                streamUrl = "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8",
                logoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg",
                categoryName = "HLS Benchmarks",
                streamType = StreamType.LIVE,
                num = 104
            ),
            Channel(
                playlistId = playlistId,
                streamId = "demo_5",
                name = "Elephant's Dream (HLS Open Cinema)",
                streamUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
                logoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg",
                categoryName = "Open Movies",
                streamType = StreamType.VOD,
                num = 105
            ),
            Channel(
                playlistId = playlistId,
                streamId = "demo_6",
                name = "For Bigger Blazes (HLS Test)",
                streamUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                logoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg",
                categoryName = "HLS Benchmarks",
                streamType = StreamType.LIVE,
                num = 106
            )
        )
        channelDao.insertChannels(demoChannels)
        playlistDao.updateChannelCount(playlistId, demoChannels.size)
    }
}
