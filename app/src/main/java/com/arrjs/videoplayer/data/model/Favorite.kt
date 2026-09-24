package com.arrjs.videoplayer.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "favorites")
data class Favorite(
    @PrimaryKey
    val channelId: Long,
    val playlistId: Long,
    val name: String,
    val streamUrl: String,
    val logoUrl: String? = null,
    val categoryName: String = "",
    val addedAt: Long = System.currentTimeMillis()
)
