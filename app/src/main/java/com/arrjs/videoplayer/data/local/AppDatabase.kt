package com.arrjs.videoplayer.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.arrjs.videoplayer.data.model.Category
import com.arrjs.videoplayer.data.model.Channel
import com.arrjs.videoplayer.data.model.Favorite
import com.arrjs.videoplayer.data.model.Playlist
import com.arrjs.videoplayer.data.model.WatchHistory

@Database(
    entities = [
        Playlist::class,
        Category::class,
        Channel::class,
        Favorite::class,
        WatchHistory::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun playlistDao(): PlaylistDao
    abstract fun categoryDao(): CategoryDao
    abstract fun channelDao(): ChannelDao
    abstract fun favoriteDao(): FavoriteDao
    abstract fun historyDao(): HistoryDao

    companion object {
        @Volatile
        private var instance: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "arrjs_tv_player.db"
                )
                    .fallbackToDestructiveMigration()
                    .build()
                    .also { instance = it }
            }
        }
    }
}
