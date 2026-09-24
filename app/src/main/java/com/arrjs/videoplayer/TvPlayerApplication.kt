package com.arrjs.videoplayer

import android.app.Application
import com.arrjs.videoplayer.data.local.AppDatabase
import com.arrjs.videoplayer.data.repository.ChannelRepository
import com.arrjs.videoplayer.data.repository.PlaylistRepository
import com.arrjs.videoplayer.data.repository.WatchHistoryRepository
import com.arrjs.videoplayer.utils.SampleDataGenerator
import com.arrjs.videoplayer.utils.SecureStorage
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class TvPlayerApplication : Application() {

    private val applicationScope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    val database by lazy { AppDatabase.getInstance(this) }
    val playlistRepository by lazy { PlaylistRepository(database, this) }
    val channelRepository by lazy { ChannelRepository(database) }
    val watchHistoryRepository by lazy { WatchHistoryRepository(database) }
    val epgRepository by lazy { com.arrjs.videoplayer.data.repository.EpgRepository(this) }
    val secureStorage by lazy { SecureStorage(this) }

    override fun onCreate() {
        super.onCreate()
        // Do not auto-populate demo streams on startup.
        // User can add their own playlist via Settings / M3U importer or load demo explicitly.
    }
}
