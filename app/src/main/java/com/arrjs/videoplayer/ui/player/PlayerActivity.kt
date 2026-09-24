package com.arrjs.videoplayer.ui.player

import android.app.AlertDialog
import android.content.Intent
import android.os.Bundle
import android.os.CountDownTimer
import android.os.Handler
import android.os.Looper
import android.view.KeyEvent
import android.view.View
import android.view.animation.AnimationUtils
import android.widget.Button
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.SeekBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.lifecycle.lifecycleScope
import androidx.media3.ui.PlayerView
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import coil.load
import com.arrjs.videoplayer.R
import com.arrjs.videoplayer.TvPlayerApplication
import com.arrjs.videoplayer.data.model.Channel
import com.arrjs.videoplayer.player.TvPlayerManager
import com.arrjs.videoplayer.ui.livetv.ChannelVerticalAdapter
import com.arrjs.videoplayer.ui.livetv.LiveTvActivity
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch
import java.util.Locale

class PlayerActivity : AppCompatActivity(), TvPlayerManager.PlayerEventListener {

    companion object {
        const val EXTRA_CHANNEL_ID = "extra_channel_id"
        const val EXTRA_CATEGORY_NAME = "extra_category_name"
        private const val OSD_TIMEOUT_MS = 4000L
        private const val QUICK_BANNER_TIMEOUT_MS = 2500L
    }

    private lateinit var playerView: PlayerView
    private lateinit var layoutOsd: ConstraintLayout
    private lateinit var layoutBuffering: LinearLayout
    private lateinit var layoutError: LinearLayout
    private lateinit var tvErrorMessage: TextView
    private lateinit var btnRetry: Button
    private lateinit var btnBackToGuide: Button

    // Quick Channel Banner (DTH Style)
    private lateinit var layoutQuickBanner: LinearLayout
    private lateinit var tvQuickChannelNumber: TextView
    private lateinit var imgQuickLogo: ImageView
    private lateinit var tvQuickChannelName: TextView
    private lateinit var tvQuickCategory: TextView
    private lateinit var tvQuickProgram: TextView

    // OSD controls
    private lateinit var imgOsdLogo: ImageView
    private lateinit var tvOsdChannelName: TextView
    private lateinit var tvOsdCategory: TextView
    private lateinit var btnPlayPause: ImageButton
    private lateinit var btnPrevChannel: ImageButton
    private lateinit var btnNextChannel: ImageButton
    private lateinit var btnAspectRatio: ImageButton
    private lateinit var btnVideoQuality: ImageButton
    private lateinit var btnAudioBoost: ImageButton
    private lateinit var btnAudioTracks: ImageButton
    private lateinit var btnSubtitles: ImageButton
    private lateinit var btnSleepTimer: ImageButton
    private lateinit var playerSeekBar: SeekBar
    private lateinit var tvTimeDisplay: TextView
    private lateinit var layoutBottomBar: LinearLayout

    // Clean Glassmorphic EPG Card Controls
    private lateinit var layoutBottomEpgCard: LinearLayout
    private lateinit var tvPlayerEpgNumber: TextView
    private lateinit var imgPlayerEpgLogo: ImageView
    private lateinit var tvPlayerEpgChannelName: TextView
    private lateinit var tvPlayerEpgCategory: TextView
    private lateinit var tvPlayerEpgProgramTitle: TextView
    private lateinit var tvPlayerEpgTime: TextView
    private lateinit var pbPlayerEpgProgress: android.widget.ProgressBar
    private lateinit var tvPlayerEpgNext: TextView

    // DTH Number Dialing Overlay
    private lateinit var layoutNumberDial: LinearLayout
    private lateinit var tvDialedNumber: TextView
    private val dialBuilder = StringBuilder()
    private val dialHandler = Handler(Looper.getMainLooper())
    private val dialCommitRunnable = Runnable { commitDialedChannel() }

    // Stats for Nerds HUD
    private lateinit var layoutStatsHud: LinearLayout
    private lateinit var tvStatsResolution: TextView
    private lateinit var tvStatsCodecs: TextView
    private lateinit var tvStatsBitrate: TextView
    private lateinit var tvStatsDropped: TextView
    private var isStatsHudVisible = false
    private val statsUpdateRunnable = object : Runnable {
        override fun run() {
            if (isStatsHudVisible) {
                updateStatsHud()
                osdHandler.postDelayed(this, 1000)
            }
        }
    }

    // Quick Favorite Pill
    private lateinit var layoutFavBadge: LinearLayout
    private lateinit var imgFavBadgeIcon: ImageView
    private lateinit var tvFavBadgeText: TextView
    private val hideFavBadgeRunnable = Runnable { layoutFavBadge.visibility = View.GONE }

    // Live Mini-Guide Drawer
    private lateinit var layoutMiniGuide: LinearLayout
    private lateinit var rvMiniGuide: RecyclerView
    private lateinit var tvMiniGuideTitle: TextView
    private lateinit var tvMiniGuideCount: TextView
    private lateinit var btnMiniGuideFullGuide: View
    private lateinit var miniGuideAdapter: ChannelVerticalAdapter
    private var isMiniGuideVisible = false
    private var activeCategoryName: String? = null

    // Netflix-Style Next Episode Auto-Play
    private lateinit var layoutNextEpisodeCard: LinearLayout
    private lateinit var tvNextEpisodeCountdown: TextView
    private lateinit var tvNextEpisodeTitle: TextView
    private lateinit var btnCancelNextEpisode: Button
    private lateinit var btnPlayNextEpisodeNow: Button
    private var isNextEpisodeDismissed = false
    private var isNextEpisodeShowing = false

    // State Tracking
    private var playerManager: TvPlayerManager? = null
    private var allChannels: List<Channel> = emptyList()
    private var currentChannelIndex = 0
    private var previousChannelIndex: Int = -1
    private var sleepTimer: CountDownTimer? = null

    private val osdHandler = Handler(Looper.getMainLooper())
    private val hideOsdRunnable = Runnable { hideOsd() }
    private val hideQuickBannerRunnable = Runnable { hideQuickBanner() }
    private val updateProgressRunnable = object : Runnable {
        override fun run() {
            updateProgress()
            osdHandler.postDelayed(this, 1000)
        }
    }

    private val app by lazy { application as TvPlayerApplication }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_player)

        initViews()
        setupListeners()
        setupMiniGuide()
        initPlayer()
        loadChannelAndPlaylist()
        observeEpgUpdates()
    }

    private fun initViews() {
        playerView = findViewById(R.id.playerView)
        layoutOsd = findViewById(R.id.layoutOsd)
        layoutBuffering = findViewById(R.id.layoutBuffering)
        layoutError = findViewById(R.id.layoutError)
        tvErrorMessage = findViewById(R.id.tvErrorMessage)
        btnRetry = findViewById(R.id.btnRetry)
        btnBackToGuide = findViewById(R.id.btnBackToGuide)

        layoutQuickBanner = findViewById(R.id.layoutQuickBanner)
        tvQuickChannelNumber = findViewById(R.id.tvQuickChannelNumber)
        imgQuickLogo = findViewById(R.id.imgQuickLogo)
        tvQuickChannelName = findViewById(R.id.tvQuickChannelName)
        tvQuickCategory = findViewById(R.id.tvQuickCategory)
        tvQuickProgram = findViewById(R.id.tvQuickProgram)

        imgOsdLogo = findViewById(R.id.imgOsdLogo)
        tvOsdChannelName = findViewById(R.id.tvOsdChannelName)
        tvOsdCategory = findViewById(R.id.tvOsdCategory)
        btnPlayPause = findViewById(R.id.btnPlayPause)
        btnPrevChannel = findViewById(R.id.btnPrevChannel)
        btnNextChannel = findViewById(R.id.btnNextChannel)
        btnAspectRatio = findViewById(R.id.btnAspectRatio)
        btnVideoQuality = findViewById(R.id.btnVideoQuality)
        btnAudioBoost = findViewById(R.id.btnAudioBoost)
        btnAudioTracks = findViewById(R.id.btnAudioTracks)
        btnSubtitles = findViewById(R.id.btnSubtitles)
        btnSleepTimer = findViewById(R.id.btnSleepTimer)
        playerSeekBar = findViewById(R.id.playerSeekBar)
        tvTimeDisplay = findViewById(R.id.tvTimeDisplay)
        layoutBottomBar = findViewById(R.id.layoutBottomBar)

        layoutBottomEpgCard = findViewById(R.id.layoutBottomEpgCard)
        tvPlayerEpgNumber = findViewById(R.id.tvPlayerEpgNumber)
        imgPlayerEpgLogo = findViewById(R.id.imgPlayerEpgLogo)
        tvPlayerEpgChannelName = findViewById(R.id.tvPlayerEpgChannelName)
        tvPlayerEpgCategory = findViewById(R.id.tvPlayerEpgCategory)
        tvPlayerEpgProgramTitle = findViewById(R.id.tvPlayerEpgProgramTitle)
        tvPlayerEpgTime = findViewById(R.id.tvPlayerEpgTime)
        pbPlayerEpgProgress = findViewById(R.id.pbPlayerEpgProgress)
        tvPlayerEpgNext = findViewById(R.id.tvPlayerEpgNext)

        layoutNumberDial = findViewById(R.id.layoutNumberDial)
        tvDialedNumber = findViewById(R.id.tvDialedNumber)

        layoutStatsHud = findViewById(R.id.layoutStatsHud)
        tvStatsResolution = findViewById(R.id.tvStatsResolution)
        tvStatsCodecs = findViewById(R.id.tvStatsCodecs)
        tvStatsBitrate = findViewById(R.id.tvStatsBitrate)
        tvStatsDropped = findViewById(R.id.tvStatsDropped)

        layoutFavBadge = findViewById(R.id.layoutFavBadge)
        imgFavBadgeIcon = findViewById(R.id.imgFavBadgeIcon)
        tvFavBadgeText = findViewById(R.id.tvFavBadgeText)

        layoutMiniGuide = findViewById(R.id.layoutMiniGuide)
        rvMiniGuide = findViewById(R.id.rvMiniGuide)
        tvMiniGuideTitle = findViewById(R.id.tvMiniGuideTitle)
        tvMiniGuideCount = findViewById(R.id.tvMiniGuideCount)
        btnMiniGuideFullGuide = findViewById(R.id.btnMiniGuideFullGuide)

        layoutNextEpisodeCard = findViewById(R.id.layoutNextEpisodeCard)
        tvNextEpisodeCountdown = findViewById(R.id.tvNextEpisodeCountdown)
        tvNextEpisodeTitle = findViewById(R.id.tvNextEpisodeTitle)
        btnCancelNextEpisode = findViewById(R.id.btnCancelNextEpisode)
        btnPlayNextEpisodeNow = findViewById(R.id.btnPlayNextEpisodeNow)
    }

    private fun setupMiniGuide() {
        btnMiniGuideFullGuide.setOnClickListener {
            openFullGuide()
        }

        miniGuideAdapter = ChannelVerticalAdapter(
            onChannelFocused = {},
            onChannelClicked = { selectedChannel ->
                val newIndex = allChannels.indexOfFirst { it.id == selectedChannel.id }
                if (newIndex != -1) {
                    previousChannelIndex = currentChannelIndex
                    currentChannelIndex = newIndex
                    playCurrentChannel(showFullOsd = false)
                    hideMiniGuide()
                }
            },
            onFavoriteToggled = { ch ->
                val newFav = !ch.isFavorite
                val idx = allChannels.indexOfFirst { it.id == ch.id }
                if (idx != -1) {
                    val updated = ch.copy(isFavorite = newFav)
                    allChannels = allChannels.toMutableList().also { list ->
                        list[idx] = updated
                    }
                    miniGuideAdapter.submitList(allChannels)
                }
                lifecycleScope.launch {
                    app.database.channelDao().updateFavoriteStatus(ch.id, newFav)
                }
            },
            epgProgramProvider = { ch -> app.epgRepository.getCurrentProgram(ch)?.title }
        )
        rvMiniGuide.layoutManager = LinearLayoutManager(this)
        rvMiniGuide.adapter = miniGuideAdapter

        rvMiniGuide.setOnKeyListener { _, keyCode, event ->
            if (event.action == KeyEvent.ACTION_DOWN && keyCode == KeyEvent.KEYCODE_DPAD_LEFT) {
                openFullGuide()
                true
            } else {
                false
            }
        }
    }

    private fun setupListeners() {
        btnPlayPause.setOnClickListener {
            playerManager?.togglePlayPause()
            resetOsdTimer()
        }

        btnPrevChannel.setOnClickListener {
            switchToPrevChannel()
            resetOsdTimer()
        }

        btnNextChannel.setOnClickListener {
            switchToNextChannel()
            resetOsdTimer()
        }

        btnAspectRatio.setOnClickListener {
            val newMode = playerManager?.cycleResizeMode()
            if (newMode != null) {
                Toast.makeText(this, "Aspect Ratio: ${newMode.displayName}", Toast.LENGTH_SHORT).show()
            }
            resetOsdTimer()
        }

        btnVideoQuality.setOnClickListener {
            showVideoQualityDialog()
            resetOsdTimer()
        }

        btnAudioBoost.setOnClickListener {
            showAudioBoostDialog()
            resetOsdTimer()
        }

        btnAudioTracks.setOnClickListener {
            showAudioTracksDialog()
            resetOsdTimer()
        }

        btnSubtitles.setOnClickListener {
            showSubtitlesDialog()
            resetOsdTimer()
        }

        btnSleepTimer.setOnClickListener {
            showSleepTimerDialog()
            resetOsdTimer()
        }

        btnRetry.setOnClickListener {
            layoutError.visibility = View.GONE
            playerManager?.retry()
        }

        btnBackToGuide.setOnClickListener {
            finish()
        }

        playerSeekBar.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                if (fromUser) {
                    playerManager?.seekTo(progress.toLong())
                    resetOsdTimer()
                }
            }
            override fun onStartTrackingTouch(seekBar: SeekBar?) {}
            override fun onStopTrackingTouch(seekBar: SeekBar?) {}
        })

        btnCancelNextEpisode.setOnClickListener {
            isNextEpisodeDismissed = true
            isNextEpisodeShowing = false
            layoutNextEpisodeCard.visibility = View.GONE
        }

        btnPlayNextEpisodeNow.setOnClickListener {
            isNextEpisodeShowing = false
            layoutNextEpisodeCard.visibility = View.GONE
            switchToNextChannel()
        }
    }

    private fun initPlayer() {
        playerManager = TvPlayerManager(this, playerView, this)
        val surroundEnabled = com.arrjs.videoplayer.utils.AppSettings.isSurroundPassthroughEnabled(this)
        playerManager?.setSurroundPassthrough(surroundEnabled)
        osdHandler.post(updateProgressRunnable)
    }

    private fun loadChannelAndPlaylist() {
        val channelId = intent.getLongExtra(EXTRA_CHANNEL_ID, -1L)
        activeCategoryName = intent.getStringExtra(EXTRA_CATEGORY_NAME)

        lifecycleScope.launch {
            val activePlaylist = app.playlistRepository.getActivePlaylist() ?: return@launch

            val initialChannel = if (channelId != -1L) {
                app.channelRepository.getChannelById(channelId)
            } else null

            val targetCategory = if (!activeCategoryName.isNullOrBlank() && activeCategoryName != "ALL") {
                activeCategoryName
            } else {
                initialChannel?.categoryName
            }

            val categoryChannels = if (!targetCategory.isNullOrBlank() && targetCategory != "ALL") {
                app.channelRepository.getChannelsByCategory(activePlaylist.id, targetCategory).firstOrNull() ?: emptyList()
            } else {
                emptyList()
            }

            allChannels = if (categoryChannels.isNotEmpty()) {
                activeCategoryName = targetCategory
                categoryChannels
            } else {
                app.channelRepository.getChannelsByPlaylist(activePlaylist.id).firstOrNull() ?: emptyList()
            }

            if (allChannels.isEmpty()) {
                onError("No channels in active playlist.")
                return@launch
            }

            miniGuideAdapter.submitList(allChannels)
            tvMiniGuideTitle.text = if (!activeCategoryName.isNullOrBlank() && activeCategoryName != "ALL") {
                activeCategoryName
            } else {
                "Quick Channels"
            }
            tvMiniGuideCount.text = "${allChannels.size} ch"

            val targetIndex = allChannels.indexOfFirst { it.id == channelId }
            currentChannelIndex = if (targetIndex != -1) targetIndex else 0

            playCurrentChannel(showFullOsd = true)
        }
    }

    private fun playCurrentChannel(showFullOsd: Boolean) {
        if (allChannels.isEmpty()) return
        val channel = allChannels[currentChannelIndex]

        isNextEpisodeDismissed = false
        isNextEpisodeShowing = false
        layoutNextEpisodeCard.visibility = View.GONE

        layoutError.visibility = View.GONE
        tvOsdChannelName.text = channel.name
        tvOsdCategory.text = channel.categoryName
        val chNum = if (channel.num > 0) channel.num else (101 + currentChannelIndex)
        tvQuickChannelNumber.text = "$chNum"
        tvQuickChannelName.text = channel.name
        tvQuickCategory.text = channel.categoryName

        val currentProg = app.epgRepository.getCurrentProgram(channel)
        tvQuickProgram.text = currentProg?.title ?: "Live Stream Broadcast (ExoPlayer Engine)"

        val logoLoader: (ImageView) -> Unit = { iv ->
            if (!channel.logoUrl.isNullOrBlank()) {
                iv.load(channel.logoUrl) {
                    crossfade(true)
                    placeholder(R.drawable.ic_tv_logo)
                    error(R.drawable.ic_tv_logo)
                }
            } else {
                iv.setImageResource(R.drawable.ic_tv_logo)
            }
        }

        logoLoader(imgOsdLogo)
        logoLoader(imgQuickLogo)
        logoLoader(imgPlayerEpgLogo)

        // Bind Clean EPG Bottom Card
        tvPlayerEpgNumber.text = "$chNum"
        tvPlayerEpgChannelName.text = channel.name
        tvPlayerEpgCategory.text = channel.categoryName

        if (currentProg != null) {
            tvPlayerEpgProgramTitle.text = currentProg.title
            pbPlayerEpgProgress.progress = currentProg.progressPercent.coerceIn(0, 100)
            val sdf = java.text.SimpleDateFormat("hh:mm a", Locale.getDefault())
            val sTime = sdf.format(java.util.Date(currentProg.startTimestamp * 1000L))
            val eTime = sdf.format(java.util.Date(currentProg.stopTimestamp * 1000L))
            tvPlayerEpgTime.text = "$sTime – $eTime"
        } else {
            tvPlayerEpgProgramTitle.text = "Live Stream Broadcast"
            pbPlayerEpgProgress.progress = 50
            tvPlayerEpgTime.text = "LIVE"
        }

        val allProgs = app.epgRepository.getProgramsForChannel(channel)
        val nextProg = allProgs.firstOrNull { it.startTimestamp > (System.currentTimeMillis() / 1000L) }
        if (nextProg != null) {
            val sdf = java.text.SimpleDateFormat("hh:mm a", Locale.getDefault())
            val nTime = sdf.format(java.util.Date(nextProg.startTimestamp * 1000L))
            tvPlayerEpgNext.text = "${nextProg.title} ($nTime)"
        } else {
            tvPlayerEpgNext.text = "Upcoming Stream Broadcast"
        }

        // Always show the clean, enhanced EPG Card on channel tuning
        showOsd(forceToolsBar = false)

        playerManager?.playChannel(channel)

        lifecycleScope.launch {
            app.watchHistoryRepository.recordWatch(channel)
        }
    }

    private fun switchToNextChannel() {
        if (allChannels.isEmpty()) return
        playerView.startAnimation(AnimationUtils.loadAnimation(this, R.anim.dth_channel_cut_flash))
        previousChannelIndex = currentChannelIndex
        currentChannelIndex = (currentChannelIndex + 1) % allChannels.size
        playCurrentChannel(showFullOsd = true)
    }

    private fun switchToPrevChannel() {
        if (allChannels.isEmpty()) return
        playerView.startAnimation(AnimationUtils.loadAnimation(this, R.anim.dth_channel_cut_flash))
        previousChannelIndex = currentChannelIndex
        currentChannelIndex = if (currentChannelIndex - 1 < 0) allChannels.size - 1 else currentChannelIndex - 1
        playCurrentChannel(showFullOsd = true)
    }

    // ==========================================
    // DTH Remote Number Dialing (0-9)
    // ==========================================

    private fun handleDigitInput(digit: Int) {
        dialHandler.removeCallbacks(dialCommitRunnable)
        if (dialBuilder.length >= 4) dialBuilder.clear()
        dialBuilder.append(digit)

        tvDialedNumber.text = dialBuilder.toString()
        layoutNumberDial.visibility = View.VISIBLE
        dialHandler.postDelayed(dialCommitRunnable, 1500)
    }

    private fun commitDialedChannel() {
        layoutNumberDial.visibility = View.GONE
        val dialedStr = dialBuilder.toString()
        dialBuilder.clear()
        if (dialedStr.isBlank()) return

        val dialedNum = dialedStr.toIntOrNull() ?: return
        val targetIndex = allChannels.indexOfFirst { it.num == dialedNum }
        val finalIndex = when {
            targetIndex != -1 -> targetIndex
            dialedNum in 1..allChannels.size -> dialedNum - 1
            else -> {
                Toast.makeText(this, "Channel #$dialedNum not found", Toast.LENGTH_SHORT).show()
                return
            }
        }

        previousChannelIndex = currentChannelIndex
        currentChannelIndex = finalIndex
        playCurrentChannel(showFullOsd = false)
    }

    // ==========================================
    // Last Channel "Recall"
    // ==========================================

    private fun recallLastChannel() {
        if (previousChannelIndex in allChannels.indices && previousChannelIndex != currentChannelIndex) {
            val temp = currentChannelIndex
            currentChannelIndex = previousChannelIndex
            previousChannelIndex = temp
            playCurrentChannel(showFullOsd = false)
            Toast.makeText(this, "Recalled: ${allChannels[currentChannelIndex].name}", Toast.LENGTH_SHORT).show()
        } else {
            Toast.makeText(this, "No previous channel in history", Toast.LENGTH_SHORT).show()
        }
    }

    // ==========================================
    // 1-Click Quick Favorite (Green Key / F)
    // ==========================================

    private fun toggleQuickFavorite() {
        if (allChannels.isEmpty() || currentChannelIndex !in allChannels.indices) return
        val channel = allChannels[currentChannelIndex]
        val newFav = !channel.isFavorite
        val updatedChannel = channel.copy(isFavorite = newFav)
        allChannels = allChannels.toMutableList().also { list ->
            list[currentChannelIndex] = updatedChannel
        }
        miniGuideAdapter.submitList(allChannels)

        lifecycleScope.launch {
            app.database.channelDao().updateFavoriteStatus(channel.id, newFav)
        }

        imgFavBadgeIcon.setImageResource(
            if (newFav) R.drawable.ic_favorite_filled else R.drawable.ic_favorite_border
        )
        tvFavBadgeText.text = if (newFav) "Added to Favorites" else "Removed from Favorites"
        layoutFavBadge.visibility = View.VISIBLE
        osdHandler.removeCallbacks(hideFavBadgeRunnable)
        osdHandler.postDelayed(hideFavBadgeRunnable, 2000)
    }

    // ==========================================
    // Live Mini-Guide Drawer
    // ==========================================

    private fun toggleMiniGuide() {
        if (isMiniGuideVisible) {
            hideMiniGuide()
        } else {
            showMiniGuide()
        }
    }

    private fun showMiniGuide() {
        hideOsd()
        isMiniGuideVisible = true
        layoutMiniGuide.visibility = View.VISIBLE
        layoutMiniGuide.bringToFront()
        val pos = currentChannelIndex.coerceIn(0, (allChannels.size - 1).coerceAtLeast(0))
        rvMiniGuide.scrollToPosition(pos)
        rvMiniGuide.post {
            rvMiniGuide.requestFocus()
        }
    }

    private fun hideMiniGuide() {
        isMiniGuideVisible = false
        layoutMiniGuide.visibility = View.GONE
    }

    private fun openFullGuide() {
        hideMiniGuide()
        val currentChannel = allChannels.getOrNull(currentChannelIndex)
        val intent = Intent(this, LiveTvActivity::class.java).apply {
            val cat = activeCategoryName ?: currentChannel?.categoryName
            if (!cat.isNullOrBlank() && cat != "ALL") {
                putExtra(LiveTvActivity.EXTRA_CATEGORY_NAME, cat)
            }
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        startActivity(intent)
        finish()
    }

    private fun observeEpgUpdates() {
        lifecycleScope.launch {
            app.epgRepository.epgSyncState.collect { timestamp ->
                if (timestamp > 0L) {
                    miniGuideAdapter.notifyDataSetChanged()
                    updateCurrentEpgDisplay()
                }
            }
        }
    }

    private fun updateCurrentEpgDisplay() {
        if (allChannels.isEmpty() || currentChannelIndex !in allChannels.indices) return
        val channel = allChannels[currentChannelIndex]
        val currentProg = app.epgRepository.getCurrentProgram(channel)
        if (currentProg != null) {
            tvPlayerEpgProgramTitle.text = currentProg.title
            pbPlayerEpgProgress.progress = currentProg.progressPercent.coerceIn(0, 100)
            val sdf = java.text.SimpleDateFormat("hh:mm a", Locale.getDefault())
            val sTime = sdf.format(java.util.Date(currentProg.startTimestamp * 1000L))
            val eTime = sdf.format(java.util.Date(currentProg.stopTimestamp * 1000L))
            tvPlayerEpgTime.text = "$sTime – $eTime"
            tvQuickProgram.text = currentProg.title
        }

        val allProgs = app.epgRepository.getProgramsForChannel(channel)
        val nextProg = allProgs.firstOrNull { it.startTimestamp > (System.currentTimeMillis() / 1000L) }
        if (nextProg != null) {
            val sdf = java.text.SimpleDateFormat("hh:mm a", Locale.getDefault())
            val nTime = sdf.format(java.util.Date(nextProg.startTimestamp * 1000L))
            tvPlayerEpgNext.text = "${nextProg.title} ($nTime)"
        }
    }

    // ==========================================
    // Stats for Nerds Floating HUD
    // ==========================================

    private fun toggleStatsHud() {
        isStatsHudVisible = !isStatsHudVisible
        layoutStatsHud.visibility = if (isStatsHudVisible) View.VISIBLE else View.GONE
        if (isStatsHudVisible) {
            updateStatsHud()
            osdHandler.post(statsUpdateRunnable)
        } else {
            osdHandler.removeCallbacks(statsUpdateRunnable)
        }
    }

    private fun updateStatsHud() {
        val stats = playerManager?.getStreamStats() ?: return
        tvStatsResolution.text = "Resolution: ${stats.resolution} @ ${stats.frameRate}"
        tvStatsCodecs.text = "Codecs: ${stats.videoCodec} / ${stats.audioCodec}"
        tvStatsBitrate.text = "Bitrate: ${stats.currentBitrate}"
        tvStatsDropped.text = "Dropped: ${stats.droppedFrames} frames"
    }

    // ==========================================
    // Dialogs: Audio Boost & Sleep Timer
    // ==========================================

    private fun showAudioBoostDialog() {
        val isSurroundOn = playerManager?.isSurroundPassthroughEnabled() == true
        val options = arrayOf(
            "Normal Audio (100%)",
            "Dialogue Clarity (+6dB / 150%)",
            "Super Voice Boost (+12dB / 200%)",
            "Surround 5.1 Passthrough (HDMI / Optical): " + if (isSurroundOn) "ON (Enabled)" else "OFF (Stereo)"
        )
        val currentBoost = if (playerManager?.isAudioBoostEnabled() == true) 2 else 0

        AlertDialog.Builder(this)
            .setTitle("Audio & Surround Settings")
            .setItems(options) { dialog, which ->
                when (which) {
                    0 -> {
                        playerManager?.setAudioBoost(false, 0)
                        Toast.makeText(this, "Audio: Normal (100%)", Toast.LENGTH_SHORT).show()
                    }
                    1 -> {
                        playerManager?.setAudioBoost(true, 600)
                        Toast.makeText(this, "Audio: Dialogue Clarity (+6dB)", Toast.LENGTH_SHORT).show()
                    }
                    2 -> {
                        playerManager?.setAudioBoost(true, 1200)
                        Toast.makeText(this, "Audio: Super Voice Boost (+12dB)", Toast.LENGTH_SHORT).show()
                    }
                    3 -> {
                        val newSurround = !isSurroundOn
                        playerManager?.setSurroundPassthrough(newSurround)
                        com.arrjs.videoplayer.utils.AppSettings.setSurroundPassthroughEnabled(this, newSurround)
                        Toast.makeText(this, "5.1 Surround Passthrough: " + if (newSurround) "ENABLED (Dolby / DTS)" else "DISABLED", Toast.LENGTH_SHORT).show()
                    }
                }
                dialog.dismiss()
            }
            .setNegativeButton(R.string.dialog_cancel, null)
            .show()
    }

    private fun showSleepTimerDialog() {
        val options = arrayOf(
            "Off",
            "15 Minutes",
            "30 Minutes",
            "45 Minutes",
            "60 Minutes",
            "90 Minutes",
            "120 Minutes"
        )
        val minutesMap = listOf(0, 15, 30, 45, 60, 90, 120)

        AlertDialog.Builder(this)
            .setTitle(R.string.player_sleep_timer)
            .setItems(options) { dialog, which ->
                val minutes = minutesMap[which]
                sleepTimer?.cancel()
                if (minutes == 0) {
                    Toast.makeText(this, "Sleep Timer turned Off", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(this, "Sleep Timer active: $minutes min", Toast.LENGTH_SHORT).show()
                    sleepTimer = object : CountDownTimer(minutes * 60 * 1000L, 1000L) {
                        override fun onTick(millisUntilFinished: Long) {}
                        override fun onFinish() {
                            playerManager?.pause()
                            Toast.makeText(this@PlayerActivity, "Sleep timer expired. Goodnight!", Toast.LENGTH_LONG).show()
                            finish()
                        }
                    }.start()
                }
                dialog.dismiss()
            }
            .setNegativeButton(R.string.dialog_cancel, null)
            .show()
    }

    private fun showOsd(forceToolsBar: Boolean = false) {
        hideQuickBanner()
        hideMiniGuide()
        layoutOsd.visibility = View.VISIBLE

        val showTools = forceToolsBar || com.arrjs.videoplayer.utils.AppSettings.isShowPlayerToolsBar(this)
        if (showTools) {
            layoutBottomBar.visibility = View.VISIBLE
            layoutBottomEpgCard.visibility = View.GONE
            btnPlayPause.requestFocus()
        } else {
            layoutBottomBar.visibility = View.GONE
            layoutBottomEpgCard.visibility = View.VISIBLE
        }
        resetOsdTimer()
    }

    private fun hideOsd() {
        layoutOsd.visibility = View.GONE
    }

    private fun showQuickBanner() {
        if (layoutOsd.visibility == View.VISIBLE || isMiniGuideVisible) return
        layoutQuickBanner.clearAnimation()
        layoutQuickBanner.visibility = View.VISIBLE
        layoutQuickBanner.startAnimation(AnimationUtils.loadAnimation(this, R.anim.dth_banner_slide_up))
        osdHandler.removeCallbacks(hideQuickBannerRunnable)
        osdHandler.postDelayed(hideQuickBannerRunnable, QUICK_BANNER_TIMEOUT_MS)
    }

    private fun hideQuickBanner() {
        layoutQuickBanner.visibility = View.GONE
    }

    private fun resetOsdTimer() {
        osdHandler.removeCallbacks(hideOsdRunnable)
        if (layoutOsd.visibility == View.VISIBLE) {
            osdHandler.postDelayed(hideOsdRunnable, OSD_TIMEOUT_MS)
        }
    }

    private fun updateProgress() {
        val manager = playerManager ?: return
        val pos = manager.currentPosition
        val dur = manager.duration

        if (dur > 0) {
            playerSeekBar.visibility = View.VISIBLE
            playerSeekBar.max = dur.toInt()
            playerSeekBar.progress = pos.toInt()
            tvTimeDisplay.text = String.format(Locale.getDefault(), "%s / %s", formatTime(pos), formatTime(dur))
        } else {
            playerSeekBar.visibility = View.INVISIBLE
            tvTimeDisplay.text = "LIVE"
        }
        if (isNextEpisodeShowing) {
            isNextEpisodeShowing = false
            layoutNextEpisodeCard.visibility = View.GONE
        }
    }

    private fun formatTime(ms: Long): String {
        val totalSecs = (ms / 1000).coerceAtLeast(0)
        val hours = totalSecs / 3600
        val mins = (totalSecs % 3600) / 60
        val secs = totalSecs % 60
        return if (hours > 0) {
            String.format(Locale.getDefault(), "%d:%02d:%02d", hours, mins, secs)
        } else {
            String.format(Locale.getDefault(), "%02d:%02d", mins, secs)
        }
    }

    private fun showAudioTracksDialog() {
        val tracks = playerManager?.getAudioTracks() ?: return
        val names = tracks.map { it.name }.toTypedArray()
        val selectedIndex = tracks.indexOfFirst { it.isSelected }

        AlertDialog.Builder(this)
            .setTitle(R.string.player_audio_tracks)
            .setSingleChoiceItems(names, selectedIndex) { dialog, which ->
                val track = tracks[which]
                playerManager?.selectAudioTrack(track.groupIndex, track.trackIndex)
                dialog.dismiss()
            }
            .setNegativeButton(R.string.dialog_cancel, null)
            .show()
    }

    private fun showSubtitlesDialog() {
        val tracks = playerManager?.getSubtitleTracks() ?: return
        val names = ArrayList<String>()
        names.add("Off")
        names.addAll(tracks.map { it.name })

        val selectedIndex = tracks.indexOfFirst { it.isSelected } + 1

        AlertDialog.Builder(this)
            .setTitle(R.string.player_subtitles)
            .setSingleChoiceItems(names.toTypedArray(), selectedIndex) { dialog, which ->
                if (which == 0) {
                    playerManager?.disableSubtitles()
                } else {
                    val track = tracks[which - 1]
                    playerManager?.selectSubtitleTrack(track.groupIndex, track.trackIndex)
                }
                dialog.dismiss()
            }
            .setNegativeButton(R.string.dialog_cancel, null)
            .show()
    }

    private fun showVideoQualityDialog() {
        val tracks = playerManager?.getVideoTracks() ?: return
        if (tracks.isEmpty()) {
            Toast.makeText(this, "Single video stream available (Auto)", Toast.LENGTH_SHORT).show()
            return
        }

        val names = ArrayList<String>()
        names.add("Auto (Adaptive Quality)")
        names.addAll(tracks.map { it.name })

        val isAnySelected = tracks.any { it.isSelected }
        val selectedIndex = if (isAnySelected) {
            tracks.indexOfFirst { it.isSelected } + 1
        } else {
            0
        }

        AlertDialog.Builder(this)
            .setTitle(R.string.player_video_quality)
            .setSingleChoiceItems(names.toTypedArray(), selectedIndex) { dialog, which ->
                if (which == 0) {
                    playerManager?.setAutoVideoTrack()
                    Toast.makeText(this, "Video Quality: Auto (Adaptive)", Toast.LENGTH_SHORT).show()
                } else {
                    val track = tracks[which - 1]
                    playerManager?.selectVideoTrack(track.groupIndex, track.trackIndex)
                    Toast.makeText(this, "Video Quality: ${track.name}", Toast.LENGTH_SHORT).show()
                }
                dialog.dismiss()
            }
            .setNegativeButton(R.string.dialog_cancel, null)
            .show()
    }

    override fun onBuffering(isBuffering: Boolean) {
        layoutBuffering.visibility = if (isBuffering) View.VISIBLE else View.GONE
    }

    override fun onAutoReconnecting(attempt: Int, maxAttempts: Int) {
        layoutBuffering.visibility = View.VISIBLE
        Toast.makeText(this, "Reconnecting stream ($attempt/$maxAttempts)...", Toast.LENGTH_SHORT).show()
    }

    override fun onPlayingStateChanged(isPlaying: Boolean) {
        btnPlayPause.setImageResource(if (isPlaying) R.drawable.ic_pause else R.drawable.ic_play)
    }

    override fun onError(errorMessage: String) {
        layoutBuffering.visibility = View.GONE
        tvErrorMessage.text = errorMessage
        layoutError.visibility = View.VISIBLE
        btnRetry.requestFocus()
    }

    override fun onPositionDiscontinuity(positionMs: Long, durationMs: Long) {
        updateProgress()
    }

    override fun onTracksAvailable() {
        // Tracks ready for audio/subtitle/video selection
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (event.action == KeyEvent.ACTION_DOWN) {
            when (event.keyCode) {
                KeyEvent.KEYCODE_DPAD_LEFT -> {
                    if (isMiniGuideVisible) {
                        openFullGuide()
                        return true
                    } else if (layoutBottomBar.visibility != View.VISIBLE) {
                        showMiniGuide()
                        return true
                    }
                }
                KeyEvent.KEYCODE_BACK, KeyEvent.KEYCODE_DPAD_RIGHT -> {
                    if (isMiniGuideVisible) {
                        hideMiniGuide()
                        return true
                    }
                }
            }
        }
        return super.dispatchKeyEvent(event)
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        resetOsdTimer()

        // 1. Direct Number Dialing (0-9)
        if (keyCode in KeyEvent.KEYCODE_0..KeyEvent.KEYCODE_9) {
            handleDigitInput(keyCode - KeyEvent.KEYCODE_0)
            return true
        }
        if (keyCode in KeyEvent.KEYCODE_NUMPAD_0..KeyEvent.KEYCODE_NUMPAD_9) {
            handleDigitInput(keyCode - KeyEvent.KEYCODE_NUMPAD_0)
            return true
        }

        // 2. Mini-Guide Drawer Open/Close
        if (isMiniGuideVisible) {
            if (keyCode == KeyEvent.KEYCODE_BACK || keyCode == KeyEvent.KEYCODE_DPAD_RIGHT) {
                hideMiniGuide()
                return true
            }
            if (keyCode == KeyEvent.KEYCODE_DPAD_LEFT) {
                openFullGuide()
                return true
            }
            return super.onKeyDown(keyCode, event)
        }

        when (keyCode) {
            KeyEvent.KEYCODE_DPAD_CENTER,
            KeyEvent.KEYCODE_ENTER,
            KeyEvent.KEYCODE_BUTTON_A -> {
                if (layoutOsd.visibility != View.VISIBLE || layoutBottomEpgCard.visibility == View.VISIBLE) {
                    // Open playback tools bar
                    showOsd(forceToolsBar = true)
                    return true
                } else {
                    playerManager?.togglePlayPause()
                    return true
                }
            }
            KeyEvent.KEYCODE_DPAD_LEFT -> {
                if (layoutBottomBar.visibility != View.VISIBLE) {
                    showMiniGuide()
                    return true
                }
            }
            KeyEvent.KEYCODE_DPAD_UP,
            KeyEvent.KEYCODE_CHANNEL_UP -> {
                switchToNextChannel()
                return true
            }
            KeyEvent.KEYCODE_DPAD_DOWN,
            KeyEvent.KEYCODE_CHANNEL_DOWN -> {
                switchToPrevChannel()
                return true
            }
            KeyEvent.KEYCODE_DPAD_RIGHT -> {
                if (layoutOsd.visibility != View.VISIBLE) {
                    playerManager?.seekForward(15000)
                    showQuickBanner()
                    return true
                }
            }
            KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE -> {
                playerManager?.togglePlayPause()
                return true
            }
            // Yellow Button / Y: Aspect Ratio Cycler
            KeyEvent.KEYCODE_PROG_YELLOW,
            KeyEvent.KEYCODE_Y -> {
                val mode = playerManager?.cycleResizeMode()
                if (mode != null) {
                    Toast.makeText(this, "Aspect Ratio: ${mode.displayName}", Toast.LENGTH_SHORT).show()
                }
                return true
            }
            // Blue Button / B: Voice Boost Dialog
            KeyEvent.KEYCODE_PROG_BLUE,
            KeyEvent.KEYCODE_B -> {
                showAudioBoostDialog()
                return true
            }
            // Green Button / F: 1-Click Quick Favorite Toggle
            KeyEvent.KEYCODE_PROG_GREEN,
            KeyEvent.KEYCODE_F -> {
                toggleQuickFavorite()
                return true
            }
            // Recall / R / Last Channel: Instant Previous Channel Recall
            KeyEvent.KEYCODE_LAST_CHANNEL,
            KeyEvent.KEYCODE_R -> {
                recallLastChannel()
                return true
            }
            // Info / I: Stats for Nerds Floating HUD
            KeyEvent.KEYCODE_INFO,
            KeyEvent.KEYCODE_I -> {
                toggleStatsHud()
                return true
            }
            KeyEvent.KEYCODE_BACK -> {
                if (isNextEpisodeShowing) {
                    btnCancelNextEpisode.performClick()
                    return true
                }
                if (isStatsHudVisible) {
                    toggleStatsHud()
                    return true
                }
                if (layoutOsd.visibility == View.VISIBLE) {
                    hideOsd()
                    return true
                }
            }
        }
        return super.onKeyDown(keyCode, event)
    }

    override fun onPause() {
        super.onPause()
        playerManager?.pause()
    }

    override fun onResume() {
        super.onResume()
        playerManager?.resume()
    }

    override fun onDestroy() {
        super.onDestroy()
        sleepTimer?.cancel()
        osdHandler.removeCallbacksAndMessages(null)
        dialHandler.removeCallbacksAndMessages(null)
        playerManager?.release()
        playerManager = null
    }
}
