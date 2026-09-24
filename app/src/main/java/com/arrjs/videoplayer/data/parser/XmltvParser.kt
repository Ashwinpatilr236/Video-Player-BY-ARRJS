package com.arrjs.videoplayer.data.parser

import android.util.Xml
import com.arrjs.videoplayer.data.model.EpgProgram
import org.xmlpull.v1.XmlPullParser
import java.io.BufferedInputStream
import java.io.InputStream
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone
import java.util.zip.GZIPInputStream

/**
 * High-performance streaming XMLTV EPG parser with .xml and .xml.gz gzip support.
 * Maps both <channel id="..."> <display-name>...</display-name> and <programme> tags.
 * Optimized for low memory footprint and high resilience on Android TV & Fire TV.
 */
class XmltvParser {

    data class XmltvResult(
        val programsMap: Map<String, List<EpgProgram>>,
        val channelAliases: Map<String, List<String>> // channelId -> list of display-names
    )

    fun parse(inputStream: InputStream): XmltvResult {
        val programsMap = HashMap<String, ArrayList<EpgProgram>>()
        val channelAliases = HashMap<String, ArrayList<String>>()
        val decompressedStream = getDecompressedStream(inputStream)

        val parser = Xml.newPullParser()
        // Passing null lets the parser detect UTF-8, ISO-8859-1, Windows-1252 from XML declaration
        parser.setInput(decompressedStream, null)

        val nowSec = System.currentTimeMillis() / 1000L
        val minKeepTime = nowSec - (24 * 3600L) // Keep programs from last 24 hours
        val maxKeepTime = nowSec + (7 * 86400L) // Keep programs up to 7 days ahead

        var eventType = parser.eventType
        var currentChannelDefId: String? = null

        var currentProgChannel: String? = null
        var currentStart: Long = 0L
        var currentStop: Long = 0L
        var currentTitle: String = ""
        var currentDesc: String = ""

        while (eventType != XmlPullParser.END_DOCUMENT) {
            try {
                when (eventType) {
                    XmlPullParser.START_TAG -> {
                        when (parser.name.lowercase(Locale.US)) {
                            "channel" -> {
                                currentChannelDefId = parser.getAttributeValue(null, "id")?.trim()
                            }
                            "display-name" -> {
                                val name = safeReadText(parser)
                                if (name.isNotBlank() && !currentChannelDefId.isNullOrBlank()) {
                                    val list = channelAliases.getOrPut(currentChannelDefId!!) { ArrayList() }
                                    if (!list.contains(name)) {
                                        list.add(name)
                                    }
                                }
                            }
                            "programme" -> {
                                currentProgChannel = parser.getAttributeValue(null, "channel")?.trim()
                                val startStr = parser.getAttributeValue(null, "start")
                                val stopStr = parser.getAttributeValue(null, "stop")
                                currentStart = parseXmltvTimestamp(startStr)
                                currentStop = parseXmltvTimestamp(stopStr)
                                if (currentStop == 0L && currentStart > 0L) {
                                    currentStop = currentStart + 1800L // 30 min default duration
                                }
                                currentTitle = ""
                                currentDesc = ""
                            }
                            "title" -> {
                                currentTitle = safeReadText(parser)
                            }
                            "desc" -> {
                                currentDesc = safeReadText(parser)
                            }
                        }
                    }
                    XmlPullParser.END_TAG -> {
                        val tagName = parser.name.lowercase(Locale.US)
                        if (tagName == "channel") {
                            currentChannelDefId = null
                        } else if (tagName == "programme" && !currentProgChannel.isNullOrBlank()) {
                            val isRelevant = if (currentStop > 0L) {
                                currentStop >= minKeepTime && currentStart <= maxKeepTime
                            } else {
                                true
                            }

                            if (isRelevant) {
                                val progId = "${currentProgChannel}_$currentStart"
                                val program = EpgProgram(
                                    id = progId,
                                    channelId = currentProgChannel!!,
                                    title = if (currentTitle.isNotBlank()) currentTitle else "Live Program",
                                    description = currentDesc,
                                    startTimestamp = currentStart,
                                    stopTimestamp = currentStop
                                )

                                val list = programsMap.getOrPut(currentProgChannel!!) { ArrayList() }
                                list.add(program)
                            }
                            currentProgChannel = null
                        }
                    }
                }
            } catch (_: Exception) {
                // Recover from isolated malformed tags without breaking the entire stream
            }

            try {
                eventType = parser.next()
            } catch (_: Exception) {
                break
            }
        }

        // Sort program lists by start timestamp
        programsMap.values.forEach { list ->
            list.sortBy { it.startTimestamp }
        }

        return XmltvResult(programsMap, channelAliases)
    }

    private fun safeReadText(parser: XmlPullParser): String {
        return try {
            parser.nextText()?.trim().orEmpty()
        } catch (_: Exception) {
            parser.text?.trim().orEmpty()
        }
    }

    private fun getDecompressedStream(input: InputStream): InputStream {
        val buffered = if (input.markSupported()) input else BufferedInputStream(input, 65536)
        buffered.mark(4)
        val b1 = buffered.read()
        val b2 = buffered.read()
        buffered.reset()

        // GZIP magic number: 0x1F, 0x8B
        return if (b1 == 0x1f && b2 == 0x8b) {
            GZIPInputStream(buffered, 65536)
        } else {
            buffered
        }
    }

    companion object {
        /**
         * Fast, thread-safe, timezone-offset-aware XMLTV timestamp parser.
         * Handles: "20260923050000 +0000", "20260923050000 +05:30", "20260923050000 +0530",
         * "-0400", or timestamps with no timezone. Converts directly to UTC epoch seconds.
         */
        fun parseXmltvTimestamp(rawDate: String?): Long {
            if (rawDate.isNullOrBlank()) return 0L
            val clean = rawDate.trim()
            try {
                if (clean.length >= 14 && clean[0].isDigit()) {
                    val year = clean.substring(0, 4).toInt()
                    val month = clean.substring(4, 6).toInt()
                    val day = clean.substring(6, 8).toInt()
                    val hour = clean.substring(8, 10).toInt()
                    val min = clean.substring(10, 12).toInt()
                    val sec = clean.substring(12, 14).toInt()

                    var offsetSec = 0L
                    for (i in 14 until clean.length) {
                        val c = clean[i]
                        if (c == '+' || c == '-') {
                            val sign = if (c == '-') -1 else 1
                            val tzPart = clean.substring(i + 1).replace(":", "").trim()
                            if (tzPart.length >= 4) {
                                val tzH = tzPart.substring(0, 2).toLongOrNull() ?: 0L
                                val tzM = tzPart.substring(2, 4).toLongOrNull() ?: 0L
                                offsetSec = sign * ((tzH * 3600L) + (tzM * 60L))
                            }
                            break
                        }
                    }

                    val cal = Calendar.getInstance(TimeZone.getTimeZone("UTC"))
                    cal.set(year, month - 1, day, hour, min, sec)
                    cal.set(Calendar.MILLISECOND, 0)
                    val epochUtc = cal.timeInMillis / 1000L
                    return epochUtc - offsetSec
                }
            } catch (_: Exception) {}
            return 0L
        }
    }
}
