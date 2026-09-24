package com.arrjs.videoplayer.data.model

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "categories",
    indices = [Index(value = ["playlistId", "categoryId"], unique = true)]
)
data class Category(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val playlistId: Long,
    val categoryId: String,
    val categoryName: String,
    val streamType: StreamType = StreamType.LIVE
)
