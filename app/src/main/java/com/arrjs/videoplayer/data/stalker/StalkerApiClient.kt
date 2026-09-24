package com.arrjs.videoplayer.data.stalker

import com.arrjs.videoplayer.data.model.Category
import com.arrjs.videoplayer.data.model.Channel
import com.arrjs.videoplayer.data.model.StreamType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.util.concurrent.TimeUnit

/**
 * Stalker Middleware / MAG Portal (Ministra) API Client.
 * Communicates via the MAG STB protocol (handshake, token generation, profile check, and ITV channel listing).
 */
class StalkerApiClient(
    private val portalUrl: String,
    private val macAddress: String
) {
    private val client = OkHttpClient.Builder()
        .connectTimeout(20, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .followRedirects(true)
        .followSslRedirects(true)
        .build()

    private var token: String? = null

    private val endpointUrl: String
        get() {
            var url = com.arrjs.videoplayer.utils.NetworkUtils.resolveUrl(portalUrl)
            if (url.endsWith("/")) url = url.dropLast(1)
            return if (url.endsWith("/server/load.php")) {
                url
            } else if (url.endsWith("/c")) {
                url.replace("/c", "") + "/server/load.php"
            } else {
                "$url/server/load.php"
            }
        }

    private val cleanMac: String
        get() = macAddress.trim().uppercase()

    private fun buildRequest(url: String): Request {
        val reqBuilder = Request.Builder()
            .url(url)
            .header("User-Agent", "Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 2 rev: 250 Safari/533.3")
            .header("X-User-Agent", "Model: MAG250; Link: WiFi")
            .header("Cookie", "mac=$cleanMac${if (!token.isNullOrEmpty()) "; stb_lang=en; timezone=GMT; token=$token" else ""}")
            .header("Accept", "*/*")
        if (!token.isNullOrEmpty()) {
            reqBuilder.header("Authorization", "Bearer $token")
        }
        return reqBuilder.build()
    }

    suspend fun authenticate(): Boolean = withContext(Dispatchers.IO) {
        try {
            val handshakeUrl = "$endpointUrl?type=stb&action=handshake&token=&mac=$cleanMac"
            val request = buildRequest(handshakeUrl)
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@withContext false
                val body = response.body?.string() ?: return@withContext false
                val json = JSONObject(body)
                val js = json.optJSONObject("js")
                token = js?.optString("token")
                return@withContext !token.isNullOrBlank()
            }
        } catch (e: Exception) {
            false
        }
    }

    suspend fun fetchChannels(playlistId: Long): List<Channel> = withContext(Dispatchers.IO) {
        val channels = ArrayList<Channel>()
        try {
            val url = "$endpointUrl?type=itv&action=get_all_channels&mac=$cleanMac"
            val request = buildRequest(url)
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@withContext emptyList()
                val body = response.body?.string() ?: return@withContext emptyList()
                val json = JSONObject(body)
                val js = json.optJSONObject("js") ?: return@withContext emptyList()
                val data = js.optJSONArray("data") ?: return@withContext emptyList()

                for (i in 0 until data.length()) {
                    val item = data.getJSONObject(i)
                    val id = item.optString("id", "${i + 1}")
                    val name = item.optString("name", "Channel ${i + 1}")
                    val num = item.optInt("number", i + 1)
                    val logo = item.optString("logo")
                    var cmd = item.optString("cmd")

                    // Clean Stalker cmd: often "ffmpeg http://..." or "auto /media/..."
                    if (cmd.startsWith("ffmpeg ", ignoreCase = true)) {
                        cmd = cmd.substring(7).trim()
                    } else if (cmd.startsWith("auto ", ignoreCase = true)) {
                        cmd = cmd.substring(5).trim()
                    }

                    if (cmd.isNotBlank()) {
                        channels.add(
                            Channel(
                                playlistId = playlistId,
                                streamId = "stalker_$id",
                                name = name,
                                streamUrl = cmd,
                                logoUrl = if (logo.isNotBlank()) logo else null,
                                categoryName = "Live TV",
                                streamType = StreamType.LIVE,
                                num = num
                            )
                        )
                    }
                }
            }
        } catch (e: Exception) {
            // Return what we have
        }
        channels
    }
}
