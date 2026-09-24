package com.arrjs.videoplayer.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.arrjs.videoplayer.data.model.Channel
import com.arrjs.videoplayer.data.model.StreamType
import kotlinx.coroutines.flow.Flow

@Dao
interface ChannelDao {
    @Query("SELECT * FROM channels WHERE playlistId = :playlistId ORDER BY num ASC, name ASC")
    fun getChannelsByPlaylist(playlistId: Long): Flow<List<Channel>>

    @Query("SELECT * FROM channels WHERE playlistId = :playlistId AND categoryName = :categoryName ORDER BY num ASC, name ASC")
    fun getChannelsByCategory(playlistId: Long, categoryName: String): Flow<List<Channel>>

    @Query("SELECT * FROM channels WHERE playlistId = :playlistId AND name LIKE '%' || :query || '%' ORDER BY name ASC")
    fun searchChannels(playlistId: Long, query: String): Flow<List<Channel>>

    @Query("SELECT * FROM channels WHERE id = :id LIMIT 1")
    suspend fun getChannelById(id: Long): Channel?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertChannels(channels: List<Channel>)

    @Query("DELETE FROM channels WHERE playlistId = :playlistId")
    suspend fun deleteChannelsByPlaylist(playlistId: Long)

    @Query("SELECT COUNT(*) FROM channels WHERE playlistId = :playlistId")
    suspend fun getChannelCountByPlaylist(playlistId: Long): Int

    @Query("UPDATE channels SET isFavorite = :isFavorite WHERE id = :channelId")
    suspend fun updateFavoriteStatus(channelId: Long, isFavorite: Boolean)

    @Query("SELECT * FROM channels WHERE playlistId = :playlistId AND streamType = :streamType ORDER BY num ASC, name ASC")
    fun getChannelsByStreamType(playlistId: Long, streamType: StreamType): Flow<List<Channel>>

    @Query("SELECT * FROM channels WHERE playlistId = :playlistId AND streamType = :streamType AND categoryName = :categoryName ORDER BY num ASC, name ASC")
    fun getChannelsByStreamTypeAndCategory(playlistId: Long, streamType: StreamType, categoryName: String): Flow<List<Channel>>

    @Query("SELECT DISTINCT categoryName FROM channels WHERE playlistId = :playlistId AND streamType = :streamType ORDER BY categoryName ASC")
    fun getCategoriesByStreamType(playlistId: Long, streamType: StreamType): Flow<List<String>>

    @Query("SELECT * FROM channels WHERE playlistId = :playlistId AND isFavorite = 1 ORDER BY num ASC, name ASC")
    fun getFavoriteChannels(playlistId: Long): Flow<List<Channel>>
}
