package com.arrjs.videoplayer.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "playlists")
data class Playlist(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val name: String,
    val type: String, // "M3U" or "XTREAM"
    val url: String, // URL for M3U or Server URL for Xtream
    val username: String? = null,
    val password: String? = null,
    val isActive: Boolean = true,
    val channelCount: Int = 0,
    val lastUpdated: Long = System.currentTimeMillis()
)
