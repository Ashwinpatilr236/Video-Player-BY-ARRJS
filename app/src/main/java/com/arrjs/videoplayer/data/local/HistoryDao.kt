package com.arrjs.videoplayer.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.arrjs.videoplayer.data.model.WatchHistory
import kotlinx.coroutines.flow.Flow

@Dao
interface HistoryDao {
    @Query("SELECT * FROM watch_history ORDER BY watchedAt DESC LIMIT :limit")
    fun getRecentHistory(limit: Int = 30): Flow<List<WatchHistory>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdate(history: WatchHistory)

    @Query("DELETE FROM watch_history WHERE channelId = :channelId")
    suspend fun deleteHistory(channelId: Long)

    @Query("DELETE FROM watch_history")
    suspend fun clearAllHistory()
}
