package com.arrjs.videoplayer.data.xtream

import com.arrjs.videoplayer.data.model.Category
import com.arrjs.videoplayer.data.model.Channel
import com.arrjs.videoplayer.data.model.EpgProgram
import com.arrjs.videoplayer.data.model.StreamType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class XtreamApiClient(
    private val serverUrl: String,
    private val username: String,
    private val password: String
) {
    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .followRedirects(true)
        .build()

    private val cleanBaseUrl: String
        get() {
            val url = com.arrjs.videoplayer.utils.NetworkUtils.resolveUrl(serverUrl)
            return if (url.endsWith("/")) url.dropLast(1) else url
        }

    suspend fun authenticate(): Boolean = withContext(Dispatchers.IO) {
        try {
            val url = "$cleanBaseUrl/player_api.php?username=$username&password=$password"
            val request = Request.Builder().url(url).build()
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@withContext false
                val body = response.body?.string() ?: return@withContext false
                val json = JSONObject(body)
                val userInfo = json.optJSONObject("user_info")
                userInfo?.optString("status") == "Active"
            }
        } catch (e: Exception) {
            false
        }
    }

    suspend fun fetchLiveCategories(playlistId: Long): List<Category> = withContext(Dispatchers.IO) {
        val categories = ArrayList<Category>()
        try {
            val url = "$cleanBaseUrl/player_api.php?username=$username&password=$password&action=get_live_categories"
            val request = Request.Builder().url(url).build()
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@withContext emptyList()
                val body = response.body?.string() ?: return@withContext emptyList()
                val array = JSONArray(body)
                for (i in 0 until array.length()) {
                    val obj = array.getJSONObject(i)
                    val catId = obj.optString("category_id")
                    val catName = obj.optString("category_name")
                    if (catName.isNotBlank()) {
                        categories.add(
                            Category(
                                playlistId = playlistId,
                                categoryId = catId,
                                categoryName = catName,
                                streamType = StreamType.LIVE
                            )
                        )
                    }
                }
            }
        } catch (e: Exception) {
            // Return whatever was parsed safely
        }
        categories
    }

    suspend fun fetchLiveStreams(playlistId: Long, categoryId: String? = null): List<Channel> = withContext(Dispatchers.IO) {
        val channels = ArrayList<Channel>()
        try {
            val endpoint = if (categoryId.isNullOrBlank()) {
                "$cleanBaseUrl/player_api.php?username=$username&password=$password&action=get_live_streams"
            } else {
                "$cleanBaseUrl/player_api.php?username=$username&password=$password&action=get_live_streams&category_id=$categoryId"
            }

            val request = Request.Builder().url(endpoint).build()
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@withContext emptyList()
                val body = response.body?.string() ?: return@withContext emptyList()
                val array = JSONArray(body)
                for (i in 0 until array.length()) {
                    val obj = array.getJSONObject(i)
                    val streamId = obj.optString("stream_id")
                    val name = obj.optString("name")
                    val streamIcon = obj.optString("stream_icon")
                    val catId = obj.optString("category_id")
                    val epgId = obj.optString("epg_channel_id")
                    val num = obj.optInt("num", i + 1)

                    val streamUrl = "$cleanBaseUrl/live/$username/$password/$streamId.ts"

                    channels.add(
                        Channel(
                            playlistId = playlistId,
                            streamId = streamId,
                            name = name,
                            streamUrl = streamUrl,
                            logoUrl = if (streamIcon.isNotBlank()) streamIcon else null,
                            categoryName = catId,
                            epgChannelId = if (epgId.isNotBlank()) epgId else null,
                            streamType = StreamType.LIVE,
                            num = num
                        )
                    )
                }
            }
        } catch (e: Exception) {
            // Return partial on failure
        }
        channels
    }

    suspend fun fetchShortEpg(streamId: String): List<EpgProgram> = withContext(Dispatchers.IO) {
        val programs = ArrayList<EpgProgram>()
        try {
            val url = "$cleanBaseUrl/player_api.php?username=$username&password=$password&action=get_short_epg&stream_id=$streamId"
            val request = Request.Builder().url(url).header("User-Agent", "IPTVSmarters/2.2.1 (Linux; Android 10)").build()
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@withContext emptyList()
                val body = response.body?.string() ?: return@withContext emptyList()
                val json = JSONObject(body)
                val listings = json.optJSONArray("epg_listings") ?: return@withContext emptyList()

                for (i in 0 until listings.length()) {
                    val item = listings.getJSONObject(i)
                    val id = item.optString("id", "$streamId-$i")
                    val title = item.optString("title")
                    val desc = item.optString("description")
                    val start = item.optLong("start_timestamp")
                    val stop = item.optLong("stop_timestamp")

                    programs.add(
                        EpgProgram(
                            id = id,
                            channelId = streamId,
                            title = title,
                            description = desc,
                            startTimestamp = start,
                            stopTimestamp = stop
                        )
                    )
                }
            }
        } catch (e: Exception) {
            // Return empty
        }
        programs
    }

    suspend fun fetchVodCategories(playlistId: Long): List<Category> = withContext(Dispatchers.IO) {
        val categories = ArrayList<Category>()
        try {
            val url = "$cleanBaseUrl/player_api.php?username=$username&password=$password&action=get_vod_categories"
            val request = Request.Builder().url(url).header("User-Agent", "IPTVSmarters/2.2.1 (Linux; Android 10)").build()
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@withContext emptyList()
                val body = response.body?.string() ?: return@withContext emptyList()
                val array = JSONArray(body)
                for (i in 0 until array.length()) {
                    val obj = array.getJSONObject(i)
                    val catId = obj.optString("category_id")
                    val catName = obj.optString("category_name")
                    if (catName.isNotBlank()) {
                        categories.add(
                            Category(
                                playlistId = playlistId,
                                categoryId = catId,
                                categoryName = catName,
                                streamType = StreamType.VOD
                            )
                        )
                    }
                }
            }
        } catch (e: Exception) {}
        categories
    }

    suspend fun fetchVodStreams(playlistId: Long, categoryId: String? = null): List<Channel> = withContext(Dispatchers.IO) {
        val movies = ArrayList<Channel>()
        try {
            val endpoint = if (categoryId.isNullOrBlank()) {
                "$cleanBaseUrl/player_api.php?username=$username&password=$password&action=get_vod_streams"
            } else {
                "$cleanBaseUrl/player_api.php?username=$username&password=$password&action=get_vod_streams&category_id=$categoryId"
            }
            val request = Request.Builder().url(endpoint).header("User-Agent", "IPTVSmarters/2.2.1 (Linux; Android 10)").build()
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@withContext emptyList()
                val body = response.body?.string() ?: return@withContext emptyList()
                val array = JSONArray(body)
                for (i in 0 until array.length()) {
                    val obj = array.getJSONObject(i)
                    val streamId = obj.optString("stream_id")
                    val name = obj.optString("name")
                    val streamIcon = obj.optString("stream_icon")
                    val ext = obj.optString("container_extension", "mp4")
                    val catId = obj.optString("category_id")
                    val num = obj.optInt("num", i + 1)
                    val streamUrl = "$cleanBaseUrl/movie/$username/$password/$streamId.$ext"

                    movies.add(
                        Channel(
                            playlistId = playlistId,
                            streamId = streamId,
                            name = name,
                            streamUrl = streamUrl,
                            logoUrl = if (streamIcon.isNotBlank()) streamIcon else null,
                            categoryName = catId,
                            streamType = StreamType.VOD,
                            num = num
                        )
                    )
                }
            }
        } catch (e: Exception) {}
        movies
    }

    suspend fun fetchSeriesCategories(playlistId: Long): List<Category> = withContext(Dispatchers.IO) {
        val categories = ArrayList<Category>()
        try {
            val url = "$cleanBaseUrl/player_api.php?username=$username&password=$password&action=get_series_categories"
            val request = Request.Builder().url(url).header("User-Agent", "IPTVSmarters/2.2.1 (Linux; Android 10)").build()
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@withContext emptyList()
                val body = response.body?.string() ?: return@withContext emptyList()
                val array = JSONArray(body)
                for (i in 0 until array.length()) {
                    val obj = array.getJSONObject(i)
                    val catId = obj.optString("category_id")
                    val catName = obj.optString("category_name")
                    if (catName.isNotBlank()) {
                        categories.add(
                            Category(
                                playlistId = playlistId,
                                categoryId = catId,
                                categoryName = catName,
                                streamType = StreamType.SERIES
                            )
                        )
                    }
                }
            }
        } catch (e: Exception) {}
        categories
    }

    suspend fun fetchSeries(playlistId: Long, categoryId: String? = null): List<Channel> = withContext(Dispatchers.IO) {
        val seriesList = ArrayList<Channel>()
        try {
            val endpoint = if (categoryId.isNullOrBlank()) {
                "$cleanBaseUrl/player_api.php?username=$username&password=$password&action=get_series"
            } else {
                "$cleanBaseUrl/player_api.php?username=$username&password=$password&action=get_series&category_id=$categoryId"
            }
            val request = Request.Builder().url(endpoint).header("User-Agent", "IPTVSmarters/2.2.1 (Linux; Android 10)").build()
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@withContext emptyList()
                val body = response.body?.string() ?: return@withContext emptyList()
                val array = JSONArray(body)
                for (i in 0 until array.length()) {
                    val obj = array.getJSONObject(i)
                    val seriesId = obj.optString("series_id")
                    val name = obj.optString("name")
                    val cover = obj.optString("cover")
                    val catId = obj.optString("category_id")
                    val num = obj.optInt("num", i + 1)
                    val streamUrl = "$cleanBaseUrl/series/$username/$password/$seriesId.mp4"

                    seriesList.add(
                        Channel(
                            playlistId = playlistId,
                            streamId = seriesId,
                            name = name,
                            streamUrl = streamUrl,
                            logoUrl = if (cover.isNotBlank()) cover else null,
                            categoryName = catId,
                            streamType = StreamType.SERIES,
                            num = num
                        )
                    )
                }
            }
        } catch (e: Exception) {}
        seriesList
    }
}
