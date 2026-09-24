package com.arrjs.videoplayer.data.model

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "channels",
    indices = [
        Index(value = ["playlistId", "categoryName"]),
        Index(value = ["playlistId", "streamId"])
    ]
)
data class Channel(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val playlistId: Long,
    val streamId: String = "",
    val name: String,
    val streamUrl: String,
    val logoUrl: String? = null,
    val categoryName: String = "General",
    val epgChannelId: String? = null,
    val streamType: StreamType = StreamType.LIVE,
    val streamIcon: String? = null,
    val num: Int = 0,
    val isFavorite: Boolean = false
)
