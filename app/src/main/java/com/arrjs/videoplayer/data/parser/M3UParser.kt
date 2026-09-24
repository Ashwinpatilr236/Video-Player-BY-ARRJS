package com.arrjs.videoplayer.data.parser

import com.arrjs.videoplayer.data.model.Category
import com.arrjs.videoplayer.data.model.Channel
import com.arrjs.videoplayer.data.model.StreamType
import java.io.BufferedReader
import java.io.InputStream
import java.io.InputStreamReader
import java.util.regex.Pattern

class M3UParser {

    data class ParseResult(
        val channels: List<Channel>,
        val categories: List<Category>
    )

    private val tvgNamePattern = Pattern.compile("tvg-name=\"([^\"]*)\"", Pattern.CASE_INSENSITIVE)
    private val tvgIdPattern = Pattern.compile("tvg-id=\"([^\"]*)\"", Pattern.CASE_INSENSITIVE)
    private val tvgLogoPattern = Pattern.compile("tvg-logo=\"([^\"]*)\"", Pattern.CASE_INSENSITIVE)
    private val groupTitlePattern = Pattern.compile("group-title=\"([^\"]*)\"", Pattern.CASE_INSENSITIVE)

    fun parse(inputStream: InputStream, playlistId: Long): ParseResult {
        val channels = ArrayList<Channel>()
        val categoriesMap = LinkedHashMap<String, Category>()

        var currentTvgName = ""
        var currentTvgId = ""
        var currentTvgLogo = ""
        var currentGroupTitle = "General"
        var currentChannelName = ""
        var hasPendingExtInf = false
        var channelIndex = 1

        BufferedReader(InputStreamReader(inputStream, Charsets.UTF_8)).use { reader ->
            var line: String? = reader.readLine()
            while (line != null) {
                val trimmed = line.trim()

                if (trimmed.isEmpty()) {
                    line = reader.readLine()
                    continue
                }

                if (trimmed.startsWith("#EXTINF:", ignoreCase = true)) {
                    hasPendingExtInf = true
                    currentTvgName = extractAttribute(tvgNamePattern, trimmed)
                    currentTvgId = extractAttribute(tvgIdPattern, trimmed)
                    currentTvgLogo = extractAttribute(tvgLogoPattern, trimmed)
                    val group = extractAttribute(groupTitlePattern, trimmed)
                    currentGroupTitle = if (group.isNotBlank()) group else "General"

                    // Extract display name following the last comma
                    val commaIndex = trimmed.lastIndexOf(',')
                    currentChannelName = if (commaIndex != -1 && commaIndex < trimmed.length - 1) {
                        trimmed.substring(commaIndex + 1).trim()
                    } else if (currentTvgName.isNotBlank()) {
                        currentTvgName
                    } else {
                        "Channel $channelIndex"
                    }
                } else if (!trimmed.startsWith("#") && (trimmed.startsWith("http://", ignoreCase = true) ||
                            trimmed.startsWith("https://", ignoreCase = true) ||
                            trimmed.startsWith("rtmp://", ignoreCase = true) ||
                            trimmed.startsWith("rtsp://", ignoreCase = true))) {

                    val displayName = if (currentChannelName.isNotBlank()) currentChannelName else "Channel $channelIndex"
                    val categoryName = if (currentGroupTitle.isNotBlank()) currentGroupTitle else "General"

                    val channel = Channel(
                        playlistId = playlistId,
                        streamId = if (currentTvgId.isNotBlank()) currentTvgId else "ch_$channelIndex",
                        name = displayName,
                        streamUrl = trimmed,
                        logoUrl = if (currentTvgLogo.isNotBlank()) currentTvgLogo else null,
                        categoryName = categoryName,
                        epgChannelId = if (currentTvgId.isNotBlank()) currentTvgId else null,
                        streamType = detectStreamType(trimmed),
                        num = channelIndex
                    )

                    channels.add(channel)

                    if (!categoriesMap.containsKey(categoryName)) {
                        categoriesMap[categoryName] = Category(
                            playlistId = playlistId,
                            categoryId = categoryName.lowercase().replace(" ", "_"),
                            categoryName = categoryName,
                            streamType = channel.streamType
                        )
                    }

                    // Reset state
                    currentTvgName = ""
                    currentTvgId = ""
                    currentTvgLogo = ""
                    currentGroupTitle = "General"
                    currentChannelName = ""
                    hasPendingExtInf = false
                    channelIndex++
                }

                line = reader.readLine()
            }
        }

        return ParseResult(channels, categoriesMap.values.toList())
    }

    private fun extractAttribute(pattern: Pattern, line: String): String {
        val matcher = pattern.matcher(line)
        return if (matcher.find() && matcher.groupCount() >= 1) {
            matcher.group(1)?.trim() ?: ""
        } else {
            ""
        }
    }

    private fun detectStreamType(url: String): StreamType {
        val lower = url.lowercase()
        return when {
            lower.contains("/movie/") || lower.endsWith(".mp4") || lower.endsWith(".mkv") -> StreamType.VOD
            lower.contains("/series/") -> StreamType.SERIES
            else -> StreamType.LIVE
        }
    }
}
