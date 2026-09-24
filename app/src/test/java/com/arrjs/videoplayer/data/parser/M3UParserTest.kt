package com.arrjs.videoplayer.data.parser

import com.arrjs.videoplayer.data.model.StreamType
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.ByteArrayInputStream

class M3UParserTest {

    private val parser = M3UParser()

    @Test
    fun testParseStandardM3uPlaylist() {
        val m3uContent = """
            #EXTM3U
            #EXTINF:-1 tvg-id="cnn.us" tvg-name="CNN HD" tvg-logo="http://example.com/cnn.png" group-title="News",CNN News Live
            https://stream.example.com/cnn/live.m3u8
            #EXTINF:-1 tvg-id="espn.us" tvg-name="ESPN" tvg-logo="http://example.com/espn.png" group-title="Sports",ESPN HD
            https://stream.example.com/espn/live.m3u8
        """.trimIndent()

        val result = parser.parse(ByteArrayInputStream(m3uContent.toByteArray()), playlistId = 1L)

        assertEquals(2, result.channels.size)
        assertEquals(2, result.categories.size)

        val ch1 = result.channels[0]
        assertEquals("CNN News Live", ch1.name)
        assertEquals("https://stream.example.com/cnn/live.m3u8", ch1.streamUrl)
        assertEquals("http://example.com/cnn.png", ch1.logoUrl)
        assertEquals("News", ch1.categoryName)
        assertEquals(StreamType.LIVE, ch1.streamType)

        val ch2 = result.channels[1]
        assertEquals("ESPN HD", ch2.name)
        assertEquals("Sports", ch2.categoryName)
    }

    @Test
    fun testParseMalformedLinesDoesNotCrash() {
        val malformedM3u = """
            #EXTM3U
            Some random corrupted header line
            #EXTINF: invalid attributes without comma
            http://example.com/corrupt1.ts
            #EXTINF:-1,Valid Channel But No Metadata
            http://example.com/valid.m3u8
            
            # Empty lines and random text
            #EXTINF:-1 tvg-name="Movie",Action Movie 2024
            https://stream.example.com/movie/action.mp4
        """.trimIndent()

        val result = parser.parse(ByteArrayInputStream(malformedM3u.toByteArray()), playlistId = 2L)

        assertTrue(result.channels.isNotEmpty())
        val movie = result.channels.firstOrNull { it.name == "Action Movie 2024" }
        assertNotNull(movie)
        assertEquals(StreamType.VOD, movie?.streamType)
    }
}
