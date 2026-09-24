package com.arrjs.videoplayer.data.repository

import com.arrjs.videoplayer.data.local.AppDatabase
import com.arrjs.videoplayer.data.model.Channel
import com.arrjs.videoplayer.data.model.WatchHistory
import kotlinx.coroutines.flow.Flow

class WatchHistoryRepository(private val database: AppDatabase) {

    private val historyDao = database.historyDao()

    fun getRecentHistory(limit: Int = 20): Flow<List<WatchHistory>> =
        historyDao.getRecentHistory(limit)

    suspend fun recordWatch(channel: Channel, positionMs: Long = 0, durationMs: Long = 0) {
        val entry = WatchHistory(
            channelId = channel.id,
            playlistId = channel.playlistId,
            name = channel.name,
            streamUrl = channel.streamUrl,
            logoUrl = channel.logoUrl,
            categoryName = channel.categoryName,
            watchedAt = System.currentTimeMillis(),
            playbackPositionMs = positionMs,
            durationMs = durationMs
        )
        historyDao.insertOrUpdate(entry)
    }

    suspend fun clearHistory() {
        historyDao.clearAllHistory()
    }
}
