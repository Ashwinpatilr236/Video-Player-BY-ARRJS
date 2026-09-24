package com.arrjs.videoplayer.data.repository

import com.arrjs.videoplayer.data.local.AppDatabase
import com.arrjs.videoplayer.data.model.Category
import com.arrjs.videoplayer.data.model.Channel
import com.arrjs.videoplayer.data.model.Favorite
import kotlinx.coroutines.flow.Flow

class ChannelRepository(private val database: AppDatabase) {

    private val channelDao = database.channelDao()
    private val categoryDao = database.categoryDao()
    private val favoriteDao = database.favoriteDao()

    fun getChannelsByPlaylist(playlistId: Long): Flow<List<Channel>> =
        channelDao.getChannelsByPlaylist(playlistId)

    fun getChannelsByCategory(playlistId: Long, categoryName: String): Flow<List<Channel>> =
        channelDao.getChannelsByCategory(playlistId, categoryName)

    fun getCategoriesByPlaylist(playlistId: Long): Flow<List<Category>> =
        categoryDao.getCategoriesByPlaylist(playlistId)

    fun searchChannels(playlistId: Long, query: String): Flow<List<Channel>> =
        channelDao.searchChannels(playlistId, query)

    suspend fun getChannelById(id: Long): Channel? = channelDao.getChannelById(id)

    fun getAllFavorites(): Flow<List<Favorite>> = favoriteDao.getAllFavorites()

    suspend fun isFavorite(channelId: Long): Boolean = favoriteDao.isFavorite(channelId)

    suspend fun toggleFavorite(channel: Channel) {
        val exists = favoriteDao.isFavorite(channel.id)
        if (exists) {
            favoriteDao.removeFavorite(channel.id)
            channelDao.updateFavoriteStatus(channel.id, false)
        } else {
            val fav = Favorite(
                channelId = channel.id,
                playlistId = channel.playlistId,
                name = channel.name,
                streamUrl = channel.streamUrl,
                logoUrl = channel.logoUrl,
                categoryName = channel.categoryName
            )
            favoriteDao.addFavorite(fav)
            channelDao.updateFavoriteStatus(channel.id, true)
        }
    }

    suspend fun getChannelCountByPlaylist(playlistId: Long): Int =
        channelDao.getChannelCountByPlaylist(playlistId)

    fun getFavoriteChannels(playlistId: Long): Flow<List<Channel>> =
        channelDao.getFavoriteChannels(playlistId)
}
