package com.arrjs.videoplayer.data.parser

import com.arrjs.videoplayer.data.model.Category
import com.arrjs.videoplayer.data.model.Channel
import com.arrjs.videoplayer.data.model.StreamType
import java.io.BufferedReader
import java.io.InputStream
import java.io.InputStreamReader
import java.util.regex.Pattern

/**
 * Universal, high-performance, fault-tolerant M3U & M3U8 IPTV Playlist Parser.
 * Handles diverse provider quirks: quotes, unquoted attributes, multiline #EXTINF,
 * #EXTGRP tags, pipe parameters, and auto-classifies into LIVE, VOD (Movies), and SERIES.
 */
class UniversalPlaylistParser {

    data class ParseResult(
        val channels: List<Channel>,
        val categories: List<Category>,
        val epgUrl: String? = null
    )

    // Robust patterns matching both quoted ("...", '...') and unquoted values
    private val tvgNamePattern = Pattern.compile("tvg-name=[\"']?([^\"',]*)[\"']?", Pattern.CASE_INSENSITIVE)
    private val tvgIdPattern = Pattern.compile("tvg-id=[\"']?([^\"',]*)[\"']?", Pattern.CASE_INSENSITIVE)
    private val tvgLogoPattern = Pattern.compile("tvg-logo=[\"']?([^\"',\\s]*)[\"']?", Pattern.CASE_INSENSITIVE)
    private val groupTitlePattern = Pattern.compile("group-title=[\"']?([^\"']*)[\"']?", Pattern.CASE_INSENSITIVE)
    private val tvgChnoPattern = Pattern.compile("tvg-chno=[\"']?([0-9]+)[\"']?", Pattern.CASE_INSENSITIVE)
    private val urlTvgPattern = Pattern.compile("(?:url-tvg|x-tvg-url)=[\"']?([^\"',\\s]+)[\"']?", Pattern.CASE_INSENSITIVE)

    fun parse(inputStream: InputStream, playlistId: Long): ParseResult {
        val channels = ArrayList<Channel>()
        val categoriesMap = LinkedHashMap<String, Category>()
        var detectedEpgUrl: String? = null

        var currentTvgName = ""
        var currentTvgId = ""
        var currentTvgLogo = ""
        var currentGroupTitle = "General"
        var currentChannelName = ""
        var currentChNo = 0
        var hasPendingExtInf = false
        var channelIndex = 1

        BufferedReader(InputStreamReader(inputStream, Charsets.UTF_8)).use { reader ->
            var line: String? = reader.readLine()
            while (line != null) {
                // Strip UTF-8 BOM if present on first line
                var trimmed = line.trim()
                if (trimmed.startsWith("\uFEFF")) {
                    trimmed = trimmed.substring(1).trim()
                }

                if (trimmed.isEmpty()) {
                    line = reader.readLine()
                    continue
                }

                if (trimmed.startsWith("#EXTM3U", ignoreCase = true)) {
                    val foundEpg = extractAttribute(urlTvgPattern, trimmed)
                    if (foundEpg.isNotBlank()) {
                        detectedEpgUrl = foundEpg
                    }
                } else if (trimmed.startsWith("#EXTINF:", ignoreCase = true)) {
                    hasPendingExtInf = true
                    currentTvgName = extractAttribute(tvgNamePattern, trimmed)
                    currentTvgId = extractAttribute(tvgIdPattern, trimmed)
                    currentTvgLogo = extractAttribute(tvgLogoPattern, trimmed)
                    val group = extractAttribute(groupTitlePattern, trimmed)
                    if (group.isNotBlank()) {
                        currentGroupTitle = group
                    }

                    val chNoStr = extractAttribute(tvgChnoPattern, trimmed)
                    currentChNo = chNoStr.toIntOrNull() ?: 0

                    // Extract display title following the last comma
                    val commaIndex = trimmed.lastIndexOf(',')
                    currentChannelName = if (commaIndex != -1 && commaIndex < trimmed.length - 1) {
                        trimmed.substring(commaIndex + 1).trim()
                    } else if (currentTvgName.isNotBlank()) {
                        currentTvgName
                    } else {
                        "Channel $channelIndex"
                    }
                } else if (trimmed.startsWith("#EXTGRP:", ignoreCase = true)) {
                    val grp = trimmed.substring(8).trim()
                    if (grp.isNotBlank()) {
                        currentGroupTitle = grp
                    }
                } else if (!trimmed.startsWith("#") && isStreamUrl(trimmed)) {
                    val rawUrl = trimmed
                    // If stream URL has pipe parameters (e.g. url|User-Agent=foo), preserve clean URL or headers
                    val cleanUrl = if (rawUrl.contains("|")) rawUrl.substringBefore("|").trim() else rawUrl

                    val displayName = when {
                        currentChannelName.isNotBlank() -> currentChannelName
                        currentTvgName.isNotBlank() -> currentTvgName
                        else -> "Channel $channelIndex"
                    }

                    val categoryName = if (currentGroupTitle.isNotBlank()) currentGroupTitle else "General"
                    val streamType = classifyStreamType(cleanUrl, categoryName, displayName)
                    val channelNum = if (currentChNo > 0) currentChNo else channelIndex

                    val channel = Channel(
                        playlistId = playlistId,
                        streamId = if (currentTvgId.isNotBlank()) currentTvgId else "ch_${playlistId}_$channelIndex",
                        name = displayName,
                        streamUrl = cleanUrl,
                        logoUrl = if (currentTvgLogo.isNotBlank()) currentTvgLogo else null,
                        categoryName = categoryName,
                        epgChannelId = if (currentTvgId.isNotBlank()) currentTvgId else null,
                        streamType = streamType,
                        num = channelNum
                    )

                    channels.add(channel)

                    val catKey = "${streamType}_$categoryName"
                    if (!categoriesMap.containsKey(catKey)) {
                        categoriesMap[catKey] = Category(
                            playlistId = playlistId,
                            categoryId = categoryName.lowercase().replace("[^a-z0-9_]".toRegex(), "_"),
                            categoryName = categoryName,
                            streamType = streamType
                        )
                    }

                    // Reset state for next channel
                    currentTvgName = ""
                    currentTvgId = ""
                    currentTvgLogo = ""
                    currentGroupTitle = "General"
                    currentChannelName = ""
                    currentChNo = 0
                    hasPendingExtInf = false
                    channelIndex++
                }

                line = reader.readLine()
            }
        }

        return ParseResult(channels, categoriesMap.values.toList(), detectedEpgUrl)
    }

    private fun isStreamUrl(line: String): Boolean {
        val lower = line.lowercase()
        return lower.startsWith("http://") ||
                lower.startsWith("https://") ||
                lower.startsWith("rtmp://") ||
                lower.startsWith("rtmps://") ||
                lower.startsWith("rtsp://") ||
                lower.startsWith("udp://") ||
                lower.startsWith("mms://") ||
                lower.endsWith(".m3u8") ||
                lower.endsWith(".ts") ||
                lower.endsWith(".mp4") ||
                lower.endsWith(".mkv")
    }

    private fun extractAttribute(pattern: Pattern, line: String): String {
        val matcher = pattern.matcher(line)
        return if (matcher.find() && matcher.groupCount() >= 1) {
            matcher.group(1)?.trim() ?: ""
        } else {
            ""
        }
    }

    /**
     * Intelligent classifier:
     * Differentiates LIVE channels vs VOD (Movies) vs SERIES based on URL format,
     * category group keywords, and media filename extensions.
     */
    fun classifyStreamType(url: String, category: String, title: String): StreamType {
        val urlLower = url.lowercase()
        val catLower = category.lowercase()
        val titleLower = title.lowercase()

        // 1. Series detection
        if (catLower.contains("series") ||
            catLower.contains("tv show") ||
            catLower.contains("shows") ||
            catLower.contains("season") ||
            urlLower.contains("/series/") ||
            titleLower.contains(" s0") ||
            titleLower.contains(" e0") ||
            titleLower.contains(" season ") ||
            titleLower.contains(" episode ")) {
            return StreamType.SERIES
        }

        // 2. VOD / Movies detection
        if (catLower.contains("movie") ||
            catLower.contains("vod") ||
            catLower.contains("cinema") ||
            catLower.contains("film") ||
            catLower.contains("hollywood") ||
            catLower.contains("bollywood") ||
            urlLower.contains("/movie/") ||
            urlLower.endsWith(".mp4") ||
            urlLower.endsWith(".mkv") ||
            urlLower.endsWith(".avi")) {
            return StreamType.VOD
        }

        // 3. Default to LIVE
        return StreamType.LIVE
    }
}
