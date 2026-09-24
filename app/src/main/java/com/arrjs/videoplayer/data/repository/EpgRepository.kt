package com.arrjs.videoplayer.data.repository

import android.content.Context
import android.util.Log
import com.arrjs.videoplayer.data.model.Channel
import com.arrjs.videoplayer.data.model.EpgProgram
import com.arrjs.videoplayer.data.parser.XmltvParser
import com.arrjs.videoplayer.utils.AppSettings
import com.arrjs.videoplayer.utils.NetworkUtils
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.BufferedInputStream
import java.io.BufferedOutputStream
import java.io.DataInputStream
import java.io.DataOutputStream
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.util.Locale
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit

class EpgRepository(private val context: Context? = null) {

    private val xmltvParser = XmltvParser()
    private val httpClient: OkHttpClient = run {
        val builder = OkHttpClient.Builder()
            .connectTimeout(25, TimeUnit.SECONDS)
            .readTimeout(90, TimeUnit.SECONDS)
            .followRedirects(true)
            .followSslRedirects(true)
        try {
            val trustAll = arrayOf<javax.net.ssl.TrustManager>(object : javax.net.ssl.X509TrustManager {
                override fun checkClientTrusted(chain: Array<java.security.cert.X509Certificate>?, authType: String?) {}
                override fun checkServerTrusted(chain: Array<java.security.cert.X509Certificate>?, authType: String?) {}
                override fun getAcceptedIssuers(): Array<java.security.cert.X509Certificate> = arrayOf()
            })
            val sslContext = javax.net.ssl.SSLContext.getInstance("TLS")
            sslContext.init(null, trustAll, java.security.SecureRandom())
            builder.sslSocketFactory(sslContext.socketFactory, trustAll[0] as javax.net.ssl.X509TrustManager)
            builder.hostnameVerifier { _, _ -> true }
        } catch (e: Exception) {
            Log.w("EpgRepository", "Could not set trust-all SSL; using defaults", e)
        }
        builder.build()
    }

    // Primary map: exact / lowercase channel IDs & display names
    private val channelProgramsMap = ConcurrentHashMap<String, List<EpgProgram>>()

    // Normalized map: stripped alphanumeric keys for fuzzy matches
    private val normalizedIndex = ConcurrentHashMap<String, List<EpgProgram>>()

    // Emits epoch timestamp whenever EPG is synced so UI updates instantly
    val epgSyncState = kotlinx.coroutines.flow.MutableStateFlow<Long>(0L)

    private val cacheFileName = "epg_cache.bin"

    init {
        // Load persisted EPG cache on initialization
        if (context != null) {
            CoroutineScope(Dispatchers.IO).launch {
                loadFromCache()
                val savedUrl = AppSettings.getEpgUrl(context)
                if (savedUrl.isNotBlank()) {
                    val freq = AppSettings.getEpgUpdateFrequency(context)
                    if (freq != AppSettings.EpgUpdateFrequency.NEVER) {
                        val lastSync = AppSettings.getLastEpgSyncTime(context)
                        val now = System.currentTimeMillis()
                        val diffDays = (now - lastSync) / (1000 * 60 * 60 * 24)
                        if (channelProgramsMap.isEmpty() || diffDays >= freq.days) {
                            Log.d("EpgRepository", "Auto-syncing EPG from URL: $savedUrl (diffDays=$diffDays, freq=${freq.days})")
                            syncEpgFromUrl(savedUrl)
                        }
                    }
                }
            }
        }
    }

    suspend fun syncEpgFromUrl(epgUrl: String): Result<Int> = withContext(Dispatchers.IO) {
        try {
            val cleanUrl = NetworkUtils.resolveUrl(epgUrl)
            val request = Request.Builder()
                .url(cleanUrl)
                .header("User-Agent", "Mozilla/5.0 (Linux; Android 12; BRAVIA 4K 2020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
                .build()

            httpClient.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    return@withContext Result.failure(Exception("HTTP ${response.code}: ${response.message}"))
                }
                val stream = response.body?.byteStream()
                    ?: return@withContext Result.failure(Exception("Empty EPG response body"))

                val parsed = xmltvParser.parse(stream)
                channelProgramsMap.clear()
                normalizedIndex.clear()

                parsed.programsMap.forEach { (chId, progs) ->
                    channelProgramsMap[chId] = progs
                    channelProgramsMap[chId.lowercase(Locale.US)] = progs
                    val norm = normalizeKey(chId)
                    if (norm.isNotEmpty()) {
                        normalizedIndex[norm] = progs
                    }

                    // Map all display-name aliases for this channel ID
                    parsed.channelAliases[chId]?.forEach { alias ->
                        channelProgramsMap[alias] = progs
                        channelProgramsMap[alias.lowercase(Locale.US)] = progs
                        val aliasNorm = normalizeKey(alias)
                        if (aliasNorm.isNotEmpty()) {
                            normalizedIndex[aliasNorm] = progs
                        }
                    }
                }

                if (context != null) {
                    AppSettings.setEpgUrl(context, cleanUrl)
                    AppSettings.setLastEpgSyncTime(context, System.currentTimeMillis())
                    saveToCache()
                }

                val totalPrograms = parsed.programsMap.values.sumOf { it.size }
                epgSyncState.value = System.currentTimeMillis()
                Log.d("EpgRepository", "EPG sync success: $totalPrograms programs mapped for ${channelProgramsMap.size} channels/aliases.")
                Result.success(totalPrograms)
            }
        } catch (e: Exception) {
            Log.e("EpgRepository", "EPG sync failed", e)
            Result.failure(e)
        }
    }

    fun getCurrentProgram(channel: Channel): EpgProgram? {
        val list = getProgramsForChannel(channel)
        if (list.isEmpty()) return null
        val now = System.currentTimeMillis() / 1000L
        return list.firstOrNull { now in it.startTimestamp..it.stopTimestamp } ?: list.firstOrNull()
    }

    fun getCurrentProgram(channelId: String): EpgProgram? {
        val list = getProgramsForChannel(channelId)
        if (list.isEmpty()) return null
        val now = System.currentTimeMillis() / 1000L
        return list.firstOrNull { now in it.startTimestamp..it.stopTimestamp } ?: list.firstOrNull()
    }

    fun getProgramsForChannel(channel: Channel): List<EpgProgram> {
        // 1. Direct epgChannelId match
        channel.epgChannelId?.let { id ->
            channelProgramsMap[id]?.let { return it }
            channelProgramsMap[id.lowercase(Locale.US)]?.let { return it }
            val normId = normalizeKey(id)
            normalizedIndex[normId]?.let { return it }
        }

        // 2. streamId match (often carries tvg-id)
        if (channel.streamId.isNotBlank()) {
            channelProgramsMap[channel.streamId]?.let { return it }
            channelProgramsMap[channel.streamId.lowercase(Locale.US)]?.let { return it }
            val normStream = normalizeKey(channel.streamId)
            normalizedIndex[normStream]?.let { return it }
        }

        // 3. Channel Name exact and lowercase match
        channelProgramsMap[channel.name]?.let { return it }
        channelProgramsMap[channel.name.lowercase(Locale.US)]?.let { return it }

        // 4. Normalized Channel Name match (strips resolution, country tags, symbols)
        val nameNorm = normalizeKey(channel.name)
        if (nameNorm.isNotEmpty()) {
            normalizedIndex[nameNorm]?.let { return it }
        }

        // 5. Partial / Contains match across normalized index
        if (nameNorm.length >= 4) {
            val partialMatch = normalizedIndex.entries.firstOrNull { (k, _) ->
                k.contains(nameNorm) || nameNorm.contains(k)
            }
            if (partialMatch != null) {
                return partialMatch.value
            }
        }

        return emptyList()
    }

    fun getProgramsForChannel(channelId: String): List<EpgProgram> {
        channelProgramsMap[channelId]?.let { return it }
        channelProgramsMap[channelId.lowercase(Locale.US)]?.let { return it }
        val norm = normalizeKey(channelId)
        if (norm.isNotEmpty()) {
            normalizedIndex[norm]?.let { return it }
        }
        return emptyList()
    }

    fun hasPrograms(): Boolean = channelProgramsMap.isNotEmpty()

    fun getLoadedProgramCount(): Int {
        return channelProgramsMap.values.sumOf { it.size }
    }

    fun clear() {
        channelProgramsMap.clear()
        normalizedIndex.clear()
        if (context != null) {
            try {
                File(context.cacheDir, cacheFileName).delete()
            } catch (_: Exception) {}
        }
    }

    private fun normalizeKey(raw: String?): String {
        if (raw.isNullOrBlank()) return ""
        return raw.lowercase(Locale.US)
            .replace(Regex("(?i)\\[[^\\]]*\\]|\\([^\\)]*\\)"), "") // remove [IN], (HD), (1080p), [Geo-blocked]
            .replace("&", "and")
            .replace(Regex("(?i)\\b(fhd|uhd|hd|sd|4k|hevc|h265|1080p|720p|576p)\\b"), "")
            .replace(Regex("[^a-z0-9]"), "") // retain only letters & digits
            .trim()
    }

    private fun writeSafeUtf(out: DataOutputStream, str: String?) {
        val safe = str.orEmpty()
        val bytes = safe.toByteArray(Charsets.UTF_8)
        val len = bytes.size.coerceAtMost(32767)
        out.writeShort(len)
        out.write(bytes, 0, len)
    }

    private fun readSafeUtf(input: DataInputStream): String {
        val len = input.readShort().toInt() and 0xFFFF
        if (len == 0) return ""
        val bytes = ByteArray(len)
        input.readFully(bytes)
        return String(bytes, Charsets.UTF_8)
    }

    private fun saveToCache() {
        val ctx = context ?: return
        try {
            val file = File(ctx.cacheDir, cacheFileName)
            DataOutputStream(BufferedOutputStream(FileOutputStream(file), 65536)).use { out ->
                val entries = channelProgramsMap.entries.toList()
                out.writeInt(entries.size)
                entries.forEach { (key, progs) ->
                    writeSafeUtf(out, key)
                    out.writeInt(progs.size)
                    progs.forEach { p ->
                        writeSafeUtf(out, p.id)
                        writeSafeUtf(out, p.channelId)
                        writeSafeUtf(out, p.title)
                        writeSafeUtf(out, p.description)
                        out.writeLong(p.startTimestamp)
                        out.writeLong(p.stopTimestamp)
                    }
                }
            }
            Log.d("EpgRepository", "Saved ${channelProgramsMap.size} EPG channels to disk cache.")
        } catch (e: Exception) {
            Log.e("EpgRepository", "Failed to save EPG disk cache", e)
        }
    }

    private fun loadFromCache() {
        val ctx = context ?: return
        val file = File(ctx.cacheDir, cacheFileName)
        if (!file.exists() || file.length() == 0L) return

        try {
            DataInputStream(BufferedInputStream(FileInputStream(file), 65536)).use { input ->
                val count = input.readInt()
                for (i in 0 until count) {
                    val key = readSafeUtf(input)
                    val progCount = input.readInt()
                    val list = ArrayList<EpgProgram>(progCount)
                    for (j in 0 until progCount) {
                        val id = readSafeUtf(input)
                        val chId = readSafeUtf(input)
                        val title = readSafeUtf(input)
                        val desc = readSafeUtf(input)
                        val start = input.readLong()
                        val stop = input.readLong()
                        list.add(EpgProgram(id, chId, title, desc, start, stop))
                    }
                    channelProgramsMap[key] = list
                    val norm = normalizeKey(key)
                    if (norm.isNotEmpty()) {
                        normalizedIndex[norm] = list
                    }
                }
            }
            if (channelProgramsMap.isNotEmpty()) {
                epgSyncState.value = System.currentTimeMillis()
            }
            Log.d("EpgRepository", "Restored ${channelProgramsMap.size} EPG channels from disk cache.")
        } catch (e: Exception) {
            Log.e("EpgRepository", "Failed to load EPG disk cache", e)
        }
    }
}
