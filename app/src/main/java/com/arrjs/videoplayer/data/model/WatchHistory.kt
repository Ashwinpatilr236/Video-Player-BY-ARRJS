package com.arrjs.videoplayer.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "watch_history")
data class WatchHistory(
    @PrimaryKey
    val channelId: Long,
    val playlistId: Long,
    val name: String,
    val streamUrl: String,
    val logoUrl: String? = null,
    val categoryName: String = "",
    val watchedAt: Long = System.currentTimeMillis(),
    val playbackPositionMs: Long = 0,
    val durationMs: Long = 0
)
