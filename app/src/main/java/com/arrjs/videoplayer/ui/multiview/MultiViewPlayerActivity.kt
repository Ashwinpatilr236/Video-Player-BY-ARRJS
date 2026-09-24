package com.arrjs.videoplayer.ui.multiview

import android.os.Bundle
import android.view.KeyEvent
import android.widget.FrameLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import com.arrjs.videoplayer.R
import com.arrjs.videoplayer.TvPlayerApplication
import com.arrjs.videoplayer.data.model.Channel
import com.arrjs.videoplayer.utils.NetworkUtils
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch

class MultiViewPlayerActivity : AppCompatActivity() {

    private lateinit var frameScreen1: FrameLayout
    private lateinit var frameScreen2: FrameLayout
    private lateinit var playerView1: PlayerView
    private lateinit var playerView2: PlayerView
    private lateinit var tvScreen1Title: TextView
    private lateinit var tvScreen2Title: TextView
    private lateinit var tvActiveScreenIndicator: TextView

    private var player1: ExoPlayer? = null
    private var player2: ExoPlayer? = null

    private var allChannels: List<Channel> = emptyList()
    private var index1: Int = 0
    private var index2: Int = 1
    private var activeScreen: Int = 1 // 1 for Left, 2 for Right

    private val app by lazy { application as TvPlayerApplication }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_multiview_player)

        initViews()
        initPlayers()
        loadChannels()
    }

    private fun initViews() {
        frameScreen1 = findViewById(R.id.frameScreen1)
        frameScreen2 = findViewById(R.id.frameScreen2)
        playerView1 = findViewById(R.id.playerView1)
        playerView2 = findViewById(R.id.playerView2)
        tvScreen1Title = findViewById(R.id.tvScreen1Title)
        tvScreen2Title = findViewById(R.id.tvScreen2Title)
        tvActiveScreenIndicator = findViewById(R.id.tvActiveScreenIndicator)

        frameScreen1.setOnClickListener { selectScreen(1) }
        frameScreen2.setOnClickListener { selectScreen(2) }
    }

    private fun initPlayers() {
        player1 = ExoPlayer.Builder(this).build().apply {
            volume = 1f
            playWhenReady = true
        }
        playerView1.player = player1

        player2 = ExoPlayer.Builder(this).build().apply {
            volume = 0f
            playWhenReady = true
        }
        playerView2.player = player2

        selectScreen(1)
    }

    private fun selectScreen(screenNumber: Int) {
        activeScreen = screenNumber
        if (screenNumber == 1) {
            frameScreen1.isSelected = true
            frameScreen2.isSelected = false
            player1?.volume = 1f
            player2?.volume = 0f
            tvActiveScreenIndicator.text = "Active Audio: Screen 1 (Left)"
            frameScreen1.requestFocus()
        } else {
            frameScreen1.isSelected = false
            frameScreen2.isSelected = true
            player1?.volume = 0f
            player2?.volume = 1f
            tvActiveScreenIndicator.text = "Active Audio: Screen 2 (Right)"
            frameScreen2.requestFocus()
        }
    }

    private fun loadChannels() {
        lifecycleScope.launch {
            val activePlaylist = app.playlistRepository.getActivePlaylist() ?: return@launch
            allChannels = app.channelRepository.getChannelsByPlaylist(activePlaylist.id).firstOrNull() ?: emptyList()

            if (allChannels.isNotEmpty()) {
                index1 = 0
                index2 = if (allChannels.size > 1) 1 else 0
                playStream(1, allChannels[index1])
                playStream(2, allChannels[index2])
            }
        }
    }

    private fun playStream(screenNumber: Int, channel: Channel) {
        val player = if (screenNumber == 1) player1 else player2
        val titleView = if (screenNumber == 1) tvScreen1Title else tvScreen2Title

        titleView.text = "Screen $screenNumber: ${channel.name}"

        try {
            val cleanUrl = NetworkUtils.resolveUrl(channel.streamUrl)
            val mediaItem = MediaItem.fromUri(cleanUrl)
            player?.setMediaItem(mediaItem)
            player?.prepare()
        } catch (e: Exception) {
            // fallback
        }
    }

    private fun nextChannelOnActiveScreen() {
        if (allChannels.isEmpty()) return
        if (activeScreen == 1) {
            index1 = (index1 + 1) % allChannels.size
            playStream(1, allChannels[index1])
        } else {
            index2 = (index2 + 1) % allChannels.size
            playStream(2, allChannels[index2])
        }
    }

    private fun prevChannelOnActiveScreen() {
        if (allChannels.isEmpty()) return
        if (activeScreen == 1) {
            index1 = if (index1 - 1 < 0) allChannels.size - 1 else index1 - 1
            playStream(1, allChannels[index1])
        } else {
            index2 = if (index2 - 1 < 0) allChannels.size - 1 else index2 - 1
            playStream(2, allChannels[index2])
        }
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        when (keyCode) {
            KeyEvent.KEYCODE_DPAD_LEFT -> {
                selectScreen(1)
                return true
            }
            KeyEvent.KEYCODE_DPAD_RIGHT -> {
                selectScreen(2)
                return true
            }
            KeyEvent.KEYCODE_DPAD_UP,
            KeyEvent.KEYCODE_CHANNEL_UP -> {
                nextChannelOnActiveScreen()
                return true
            }
            KeyEvent.KEYCODE_DPAD_DOWN,
            KeyEvent.KEYCODE_CHANNEL_DOWN -> {
                prevChannelOnActiveScreen()
                return true
            }
            KeyEvent.KEYCODE_BACK -> {
                finish()
                return true
            }
        }
        return super.onKeyDown(keyCode, event)
    }

    override fun onStop() {
        super.onStop()
        player1?.pause()
        player2?.pause()
    }

    override fun onDestroy() {
        super.onDestroy()
        player1?.release()
        player2?.release()
        player1 = null
        player2 = null
    }
}
