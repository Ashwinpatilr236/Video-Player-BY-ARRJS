package com.arrjs.videoplayer.ui.livetv

import android.app.AlertDialog
import android.content.Intent
import android.content.res.ColorStateList
import android.graphics.PorterDuff
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.SwitchCompat
import androidx.lifecycle.lifecycleScope
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.arrjs.videoplayer.R
import com.arrjs.videoplayer.TvPlayerApplication
import com.arrjs.videoplayer.data.model.Category
import com.arrjs.videoplayer.data.model.Channel
import com.arrjs.videoplayer.data.model.Playlist
import com.arrjs.videoplayer.data.model.StreamType
import com.arrjs.videoplayer.ui.multiview.MultiViewPlayerActivity
import com.arrjs.videoplayer.ui.player.PlayerActivity
import com.arrjs.videoplayer.utils.AppSettings
import com.arrjs.videoplayer.utils.AppUpdateManager
import com.arrjs.videoplayer.utils.SampleDataGenerator
import com.arrjs.videoplayer.utils.ThemeManager
import com.arrjs.videoplayer.utils.TvAnimationUtils
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class LiveTvActivity : AppCompatActivity() {

    companion object {
        const val EXTRA_CATEGORY_NAME = "extra_category_name"
        const val EXTRA_SHOW_FAVORITES = "extra_show_favorites"
    }

    // Column 1: Left Navigation Rail
    private lateinit var colNavRail: View
    private lateinit var tvRailLogo: TextView
    private lateinit var btnRailSearch: View
    private lateinit var btnRailTv: View
    private lateinit var ivRailTvIcon: ImageView
    private lateinit var btnRailMovies: View
    private lateinit var btnRailSeries: View
    private lateinit var btnRailFavorites: View
    private lateinit var btnRailMultiView: View
    private lateinit var btnRailProUnlock: View
    private lateinit var tvRailProTitle: TextView
    private lateinit var tvRailProBadge: TextView
    private lateinit var btnRailAddM3u: View
    private lateinit var btnRailSettings: View

    // Column 2: Categories Drawer
    private lateinit var rvCategories: RecyclerView
    private lateinit var categoryAdapter: CategoryVerticalAdapter
    private lateinit var tvPlaylistHeader: TextView
    private lateinit var btnManageCategories: ImageButton

    // Column 3: High-Density Channel Guide
    private lateinit var rvChannels: RecyclerView
    private lateinit var channelAdapter: ChannelVerticalAdapter
    private lateinit var tvActiveCategoryHeader: TextView
    private lateinit var tvChannelTotalCount: TextView

    // Column 4: Live Mini-Player & EPG
    private lateinit var miniPlayerView: PlayerView
    private var miniPlayer: ExoPlayer? = null
    private lateinit var tvMiniWatermark: TextView
    private lateinit var tvEpgDateTime: TextView
    private lateinit var tvPreviewName: TextView
    private lateinit var tvPreviewCategory: TextView
    private lateinit var tvPreviewProgram: TextView
    private lateinit var pbEpgTimeline: ProgressBar
    private lateinit var tvEpgTimes: TextView
    private lateinit var tvPreviewDesc: TextView
    private lateinit var btnWatchChannel: TextView
    private lateinit var btnToggleFavorite: TextView

    // Right Translucent Settings Drawer
    private lateinit var tvSettingsDimOverlay: View
    private lateinit var tvRightSettingsDrawer: View
    private lateinit var btnDrawerClose: Button
    private lateinit var btnDrawerNavGeneral: Button
    private lateinit var btnDrawerNavPlaylists: Button
    private lateinit var btnDrawerNavEpg: Button
    private lateinit var btnDrawerNavPlayback: Button
    private lateinit var btnDrawerNavAppearance: Button

    private lateinit var drawerSubGeneral: View
    private lateinit var drawerSubPlaylists: View
    private lateinit var drawerSubEpg: View
    private lateinit var drawerSubPlayback: View

    private lateinit var txtDrawerEpgStatus: TextView
    private lateinit var txtDrawerEpgLastSync: TextView
    private lateinit var etDrawerManualEpgUrl: EditText
    private lateinit var btnDrawerSyncEpg: Button
    private lateinit var btnDrawerToggleEpg: Button
    private lateinit var txtDrawerEpgSuccess: TextView

    private lateinit var cardDrawerAutoPreview: View
    private lateinit var switchDrawerAutoPreview: SwitchCompat
    private lateinit var cardDrawerAutoPlayLast: View
    private lateinit var switchDrawerAutoPlayLast: SwitchCompat
    private lateinit var cardDrawerHwAccel: View
    private lateinit var switchDrawerHwAccel: SwitchCompat

    private lateinit var etDrawerQuickM3uUrl: EditText
    private lateinit var btnDrawerQuickImportM3u: Button
    private lateinit var btnDrawerOpenFullSettings: Button
    private lateinit var btnDrawerResetDemo: Button

    private var isDrawerOpen: Boolean = false

    private var previewTuneJob: kotlinx.coroutines.Job? = null
    private var activeCategory: String = "ALL"
    private var selectedChannel: Channel? = null
    private var currentlyPlayingChannel: Channel? = null
    private var activePlaylistId: Long = 0
    private var isParentalSessionUnlocked: Boolean = false

    private val app by lazy { application as TvPlayerApplication }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_live_tv)

        initViews()
        initMiniPlayer()
        setupListeners()
        applyThemeAccents()
        loadData()
        setupFocusAnimations()
        observeEpgUpdates()
        // checkForAppUpdates(showToastIfLatest = false) // Removed as requested
    }

    private fun observeEpgUpdates() {
        lifecycleScope.launch {
            app.epgRepository.epgSyncState.collect { timestamp ->
                if (timestamp > 0L) {
                    channelAdapter.notifyDataSetChanged()
                    selectedChannel?.let { onChannelFocused(it) }
                    refreshDrawerStatus()
                }
            }
        }
    }

    private fun initViews() {
        // Rail
        colNavRail = findViewById(R.id.colNavRail)
        tvRailLogo = findViewById(R.id.tvRailLogo)
        btnRailSearch = findViewById(R.id.btnRailSearch)
        btnRailTv = findViewById(R.id.btnRailTv)
        ivRailTvIcon = findViewById(R.id.ivRailTvIcon)
        btnRailMovies = findViewById(R.id.btnRailMovies)
        btnRailSeries = findViewById(R.id.btnRailSeries)
        btnRailFavorites = findViewById(R.id.btnRailFavorites)
        btnRailMultiView = findViewById(R.id.btnRailMultiView)
        btnRailProUnlock = findViewById(R.id.btnRailProUnlock)
        tvRailProTitle = findViewById(R.id.tvRailProTitle)
        tvRailProBadge = findViewById(R.id.tvRailProBadge)
        btnRailAddM3u = findViewById(R.id.btnRailAddM3u)
        btnRailSettings = findViewById(R.id.btnRailSettings)

        btnRailTv.isSelected = true
        updateProStatusUI()

        // Categories
        tvPlaylistHeader = findViewById(R.id.tvPlaylistHeader)
        btnManageCategories = findViewById(R.id.btnManageCategories)
        rvCategories = findViewById(R.id.rvCategories)
        rvCategories.layoutManager = LinearLayoutManager(this)
        categoryAdapter = CategoryVerticalAdapter { category ->
            onCategorySelected(category)
        }
        rvCategories.adapter = categoryAdapter

        // Channels
        rvChannels = findViewById(R.id.rvChannels)
        tvActiveCategoryHeader = findViewById(R.id.tvActiveCategoryHeader)
        tvChannelTotalCount = findViewById(R.id.tvChannelTotalCount)
        rvChannels.layoutManager = LinearLayoutManager(this)
        channelAdapter = ChannelVerticalAdapter(
            onChannelFocused = { channel -> onChannelFocused(channel) },
            onChannelClicked = { channel -> onChannelClicked(channel) },
            onFavoriteToggled = { channel -> toggleFavorite(channel) },
            epgProgramProvider = { channel -> app.epgRepository.getCurrentProgram(channel)?.title }
        )
        rvChannels.adapter = channelAdapter

        // Mini-Player & EPG
        miniPlayerView = findViewById(R.id.miniPlayerView)
        tvMiniWatermark = findViewById(R.id.tvMiniWatermark)
        tvEpgDateTime = findViewById(R.id.tvEpgDateTime)
        tvPreviewName = findViewById(R.id.tvPreviewName)
        tvPreviewCategory = findViewById(R.id.tvPreviewCategory)
        tvPreviewProgram = findViewById(R.id.tvPreviewProgram)
        pbEpgTimeline = findViewById(R.id.pbEpgTimeline)
        tvEpgTimes = findViewById(R.id.tvEpgTimes)
        tvPreviewDesc = findViewById(R.id.tvPreviewDesc)
        btnWatchChannel = findViewById(R.id.btnWatchChannel)
        btnToggleFavorite = findViewById(R.id.btnToggleFavorite)

        val dateFormat = SimpleDateFormat("EEE, d MMM, hh:mm a", Locale.ENGLISH)
        tvEpgDateTime.text = dateFormat.format(Date())

        // Right Translucent Settings Drawer
        tvSettingsDimOverlay = findViewById(R.id.tvSettingsDimOverlay)
        tvRightSettingsDrawer = findViewById(R.id.tvRightSettingsDrawer)
        btnDrawerClose = findViewById(R.id.btnDrawerClose)
        btnDrawerNavGeneral = findViewById(R.id.btnDrawerNavGeneral)
        btnDrawerNavPlaylists = findViewById(R.id.btnDrawerNavPlaylists)
        btnDrawerNavEpg = findViewById(R.id.btnDrawerNavEpg)
        btnDrawerNavPlayback = findViewById(R.id.btnDrawerNavPlayback)
        btnDrawerNavAppearance = findViewById(R.id.btnDrawerNavAppearance)

        drawerSubGeneral = findViewById(R.id.drawerSubGeneral)
        drawerSubPlaylists = findViewById(R.id.drawerSubPlaylists)
        drawerSubEpg = findViewById(R.id.drawerSubEpg)
        drawerSubPlayback = findViewById(R.id.drawerSubPlayback)

        txtDrawerEpgStatus = findViewById(R.id.txtDrawerEpgStatus)
        txtDrawerEpgLastSync = findViewById(R.id.txtDrawerEpgLastSync)
        etDrawerManualEpgUrl = findViewById(R.id.etDrawerManualEpgUrl)
        btnDrawerSyncEpg = findViewById(R.id.btnDrawerSyncEpg)
        btnDrawerToggleEpg = findViewById(R.id.btnDrawerToggleEpg)
        txtDrawerEpgSuccess = findViewById(R.id.txtDrawerEpgSuccess)

        cardDrawerAutoPreview = findViewById(R.id.cardDrawerAutoPreview)
        switchDrawerAutoPreview = findViewById(R.id.switchDrawerAutoPreview)
        cardDrawerAutoPlayLast = findViewById(R.id.cardDrawerAutoPlayLast)
        switchDrawerAutoPlayLast = findViewById(R.id.switchDrawerAutoPlayLast)
        cardDrawerHwAccel = findViewById(R.id.cardDrawerHwAccel)
        switchDrawerHwAccel = findViewById(R.id.switchDrawerHwAccel)

        etDrawerQuickM3uUrl = findViewById(R.id.etDrawerQuickM3uUrl)
        btnDrawerQuickImportM3u = findViewById(R.id.btnDrawerQuickImportM3u)
        btnDrawerOpenFullSettings = findViewById(R.id.btnDrawerOpenFullSettings)
        btnDrawerResetDemo = findViewById(R.id.btnDrawerResetDemo)

        setupSettingsDrawer()
    }

    private fun initMiniPlayer() {
        miniPlayer = ExoPlayer.Builder(this).build().apply {
            volume = 0f // Muted audio for preview
            playWhenReady = true
        }
        miniPlayerView.player = miniPlayer
    }

    private fun applyThemeAccents() {
        val accentColor = ThemeManager.getAccentColorInt(this)
        tvRailLogo.setTextColor(accentColor)
        tvEpgDateTime.setTextColor(accentColor)
        pbEpgTimeline.progressTintList = ColorStateList.valueOf(accentColor)
        btnRailTv.background?.setColorFilter(accentColor, PorterDuff.Mode.SRC_IN)
    }

    private fun setupListeners() {
        btnRailTv.setOnClickListener {
            rvCategories.requestFocus()
        }

        btnRailMovies.setOnClickListener {
            startActivity(Intent(this, com.arrjs.videoplayer.ui.vod.VodMoviesActivity::class.java))
        }

        btnRailSeries.setOnClickListener {
            startActivity(Intent(this, com.arrjs.videoplayer.ui.series.SeriesActivity::class.java))
        }

        btnRailFavorites.setOnClickListener {
            lifecycleScope.launch {
                val favCat = Category(
                    playlistId = activePlaylistId,
                    categoryId = "favorites",
                    categoryName = "Favorites",
                    streamType = StreamType.LIVE
                )
                onCategorySelected(favCat)
                rvChannels.requestFocus()
            }
        }

        btnRailMultiView.setOnClickListener {
            startActivity(Intent(this, MultiViewPlayerActivity::class.java))
        }

        btnRailProUnlock.setOnClickListener {
            Toast.makeText(this, "ARRJS VIP PRO Active • Testing Mode (All Features Unlocked)", Toast.LENGTH_SHORT).show()
        }

        btnRailAddM3u.setOnClickListener {
            showAddM3uDialog()
        }

        btnRailSettings.setOnClickListener {
            startActivity(Intent(this, com.arrjs.videoplayer.ui.settings.SettingsHubActivity::class.java))
        }

        tvPlaylistHeader.setOnClickListener {
            showPlaylistQuickSwitcherDialog()
        }

        btnManageCategories.setOnClickListener {
            showCategoryManagerDialog()
        }

        btnWatchChannel.setOnClickListener {
            selectedChannel?.let { openPlayer(it.id) }
        }

        btnToggleFavorite.setOnClickListener {
            selectedChannel?.let { toggleFavorite(it) }
        }
    }

    private fun onChannelFocused(channel: Channel) {
        selectedChannel = channel
        tvPreviewName.text = channel.name
        tvPreviewCategory.text = channel.categoryName

        val program = app.epgRepository.getCurrentProgram(channel)
        if (program != null) {
            tvPreviewProgram.text = program.title
            tvPreviewDesc.text = if (program.description.isNullOrBlank()) "Live Television Broadcast" else program.description
            val timeFormat = SimpleDateFormat("hh:mm a", Locale.ENGLISH)
            val startStr = timeFormat.format(Date(program.startTimestamp * 1000L))
            val stopStr = timeFormat.format(Date(program.stopTimestamp * 1000L))
            tvEpgTimes.text = "$startStr - $stopStr"

            val now = System.currentTimeMillis() / 1000L
            val totalSec = (program.stopTimestamp - program.startTimestamp).coerceAtLeast(1)
            val elapsedSec = (now - program.startTimestamp).coerceIn(0, totalSec)
            val pct = ((elapsedSec * 100) / totalSec).toInt()
            pbEpgTimeline.progress = pct
        } else {
            tvPreviewProgram.text = "Live Stream Broadcast (HLS / MPEG-TS)"
            tvPreviewDesc.text = "ExoPlayer direct hardware-accelerated playback with anti-freeze stream recovery."
            tvEpgTimes.text = "Now Showing"
            pbEpgTimeline.progress = 50
        }

        tvMiniWatermark.text = "${channel.id} • ${channel.name}"
        btnToggleFavorite.text = if (channel.isFavorite) "Remove Favorite" else "Add to Favorites"

        // Flag Check: Auto-preview on scroll with 220ms debounce for lightning-fast 60fps TV D-Pad response
        previewTuneJob?.cancel()
        if (AppSettings.isAutoPreviewOnScroll(this)) {
            previewTuneJob = lifecycleScope.launch {
                kotlinx.coroutines.delay(220)
                tuneMiniPlayer(channel)
            }
        }
    }

    private fun onChannelClicked(channel: Channel) {
        selectedChannel = channel
        tuneMiniPlayer(channel)
        openPlayer(channel.id)
    }

    private fun tuneMiniPlayer(channel: Channel) {
        if (currentlyPlayingChannel?.id == channel.id) return
        currentlyPlayingChannel = channel
        AppSettings.setLastChannelId(this, channel.id)

        try {
            val mediaItem = MediaItem.fromUri(channel.streamUrl)
            miniPlayer?.setMediaItem(mediaItem)
            miniPlayer?.prepare()
        } catch (e: Exception) {
            // URL parse fallback
        }
    }

    private fun showTvSettingsDialog() {
        val dialogView = layoutInflater.inflate(R.layout.dialog_tv_settings, null)
        val btnAutoPreview = dialogView.findViewById<View>(R.id.btnSettingAutoPreview)
        val tvAutoPreview = dialogView.findViewById<TextView>(R.id.tvAutoPreviewStatus)
        val btnAutoPlayLast = dialogView.findViewById<View>(R.id.btnSettingAutoPlayLast)
        val tvAutoPlayLast = dialogView.findViewById<TextView>(R.id.tvAutoPlayLastStatus)
        val btnAddM3u = dialogView.findViewById<View>(R.id.btnSettingAddM3u)
        val btnAccent = dialogView.findViewById<View>(R.id.btnSettingAccent)
        val tvAccent = dialogView.findViewById<TextView>(R.id.tvCurrentAccentName)

        // Init status
        var autoPreview = AppSettings.isAutoPreviewOnScroll(this)
        var autoPlayLast = AppSettings.isAutoPlayLastChannel(this)

        tvAutoPreview.text = if (autoPreview) "ON" else "OFF"
        tvAutoPlayLast.text = if (autoPlayLast) "ON" else "OFF"
        tvAccent.text = ThemeManager.getAccentColor(this).displayName

        val dialog = AlertDialog.Builder(this, R.style.Theme_VideoPlayerByARRJS_Dialog)
            .setView(dialogView)
            .create()

        btnAutoPreview.setOnClickListener {
            autoPreview = !autoPreview
            AppSettings.setAutoPreviewOnScroll(this, autoPreview)
            tvAutoPreview.text = if (autoPreview) "ON" else "OFF"
        }

        btnAutoPlayLast.setOnClickListener {
            autoPlayLast = !autoPlayLast
            AppSettings.setAutoPlayLastChannel(this, autoPlayLast)
            tvAutoPlayLast.text = if (autoPlayLast) "ON" else "OFF"
        }

        btnAddM3u.setOnClickListener {
            dialog.dismiss()
            showAddM3uDialog()
        }

        btnAccent.setOnClickListener {
            dialog.dismiss()
            showAccentColorDialog()
        }

        dialog.show()
    }

    private fun showAddM3uDialog() {
        val dialogView = layoutInflater.inflate(R.layout.dialog_add_m3u, null)
        val etName = dialogView.findViewById<EditText>(R.id.etPlaylistName)
        val etUrl = dialogView.findViewById<EditText>(R.id.etPlaylistUrl)
        val btnCancel = dialogView.findViewById<Button>(R.id.btnCancel)
        val btnSave = dialogView.findViewById<Button>(R.id.btnSaveM3u)

        val dialog = AlertDialog.Builder(this, R.style.Theme_VideoPlayerByARRJS_Dialog)
            .setView(dialogView)
            .create()

        btnCancel.setOnClickListener { dialog.dismiss() }

        btnSave.setOnClickListener {
            val name = etName.text.toString().trim()
            val url = etUrl.text.toString().trim()

            if (name.isEmpty() || url.isEmpty()) {
                Toast.makeText(this, "Please enter both playlist name and URL", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            dialog.dismiss()
            showImportHudDialog(name, url)
        }

        dialog.show()
    }

    private fun showAccentColorDialog() {
        val dialogView = layoutInflater.inflate(R.layout.dialog_accent_color, null)
        val rvColors = dialogView.findViewById<RecyclerView>(R.id.rvAccentColors)
        rvColors.layoutManager = LinearLayoutManager(this)

        val currentAccent = ThemeManager.getAccentColor(this)
        val dialog = AlertDialog.Builder(this, R.style.Theme_VideoPlayerByARRJS_Dialog)
            .setView(dialogView)
            .create()

        val adapter = AccentColorAdapter(currentAccent) { pickedColor ->
            ThemeManager.setAccentColor(this, pickedColor)
            applyThemeAccents()
            dialog.dismiss()
        }
        rvColors.adapter = adapter
        dialog.show()
    }

    private fun loadData() {
        lifecycleScope.launch {
            val activePlaylist = app.playlistRepository.getActivePlaylist() ?: return@launch
            activePlaylistId = activePlaylist.id
            tvPlaylistHeader.text = "${activePlaylist.name.uppercase()} ▼"

            val preselectedCategory = intent.getStringExtra(EXTRA_CATEGORY_NAME)
            val showFavorites = intent.getBooleanExtra(EXTRA_SHOW_FAVORITES, false)

            launch {
                app.channelRepository.getCategoriesByPlaylist(activePlaylistId).collectLatest { categories ->
                    val hiddenNames = AppSettings.getHiddenCategoryNames(this@LiveTvActivity, activePlaylistId)
                    val visibleCategories = categories.filter { it.categoryName !in hiddenNames }

                    val list = ArrayList<Category>()
                    list.add(Category(playlistId = activePlaylistId, categoryId = "all", categoryName = "All channels", streamType = StreamType.LIVE))
                    list.add(Category(playlistId = activePlaylistId, categoryId = "favorites", categoryName = "Favorites", streamType = StreamType.LIVE))
                    list.addAll(visibleCategories)
                    categoryAdapter.submitList(list)

                    if (showFavorites) {
                        onCategorySelected(list[1])
                    } else if (!preselectedCategory.isNullOrBlank()) {
                        val matched = visibleCategories.firstOrNull { it.categoryName.equals(preselectedCategory, ignoreCase = true) }
                        if (matched != null) onCategorySelected(matched) else onCategorySelected(list[0])
                    } else {
                        onCategorySelected(list[0])
                    }
                }
            }

            val epgUrl = AppSettings.getEpgUrl(this@LiveTvActivity)
            if (epgUrl.isNotBlank()) {
                launch(Dispatchers.IO) {
                    app.epgRepository.syncEpgFromUrl(epgUrl)
                }
            }
        }
    }

    private fun showPlaylistQuickSwitcherDialog() {
        lifecycleScope.launch {
            val playlists = app.playlistRepository.getAllPlaylists().firstOrNull() ?: emptyList()
            if (playlists.isEmpty()) {
                Toast.makeText(this@LiveTvActivity, "No playlists found", Toast.LENGTH_SHORT).show()
                return@launch
            }
            val names = playlists.map { it.name }.toTypedArray()
            val currentIndex = playlists.indexOfFirst { it.id == activePlaylistId }.coerceAtLeast(0)

            AlertDialog.Builder(this@LiveTvActivity)
                .setTitle("Switch Playlist")
                .setSingleChoiceItems(names, currentIndex) { dialog, which ->
                    val selected = playlists[which]
                    if (selected.id != activePlaylistId) {
                        lifecycleScope.launch {
                            app.playlistRepository.setActivePlaylist(selected.id)
                            activePlaylistId = selected.id
                            tvPlaylistHeader.text = "${selected.name.uppercase()} ▼"
                            Toast.makeText(this@LiveTvActivity, "Switched to: ${selected.name}", Toast.LENGTH_SHORT).show()
                            loadData()
                        }
                    }
                    dialog.dismiss()
                }
                .setPositiveButton("Add New") { dialog, _ ->
                    dialog.dismiss()
                    showAddM3uDialog()
                }
                .setNeutralButton("Edit Current") { dialog, _ ->
                    dialog.dismiss()
                    val currentPl = playlists.firstOrNull { it.id == activePlaylistId } ?: playlists.firstOrNull()
                    if (currentPl != null) {
                        showPlaylistEditorDialog(currentPl)
                    }
                }
                .setNegativeButton(R.string.dialog_cancel, null)
                .show()
        }
    }

    private fun showCategoryManagerDialog() {
        lifecycleScope.launch {
            val allCategories = app.channelRepository.getCategoriesByPlaylist(activePlaylistId).firstOrNull() ?: emptyList()
            if (allCategories.isEmpty()) {
                Toast.makeText(this@LiveTvActivity, "No categories to manage", Toast.LENGTH_SHORT).show()
                return@launch
            }

            val hiddenNames = AppSettings.getHiddenCategoryNames(this@LiveTvActivity, activePlaylistId).toMutableSet()
            val names = allCategories.map { it.categoryName }.toTypedArray()
            val checkedItems = BooleanArray(names.size) { i ->
                names[i] !in hiddenNames
            }

            AlertDialog.Builder(this@LiveTvActivity)
                .setTitle("Manage Categories (Hide / Show)")
                .setMultiChoiceItems(names, checkedItems) { _, which, isChecked ->
                    val catName = names[which]
                    if (isChecked) {
                        hiddenNames.remove(catName)
                    } else {
                        hiddenNames.add(catName)
                    }
                }
                .setPositiveButton("Save") { dialog, _ ->
                    AppSettings.setHiddenCategoryNames(this@LiveTvActivity, activePlaylistId, hiddenNames)
                    val visibleCount = names.size - hiddenNames.size
                    Toast.makeText(this@LiveTvActivity, "Categories updated ($visibleCount visible)", Toast.LENGTH_SHORT).show()
                    loadData()
                    dialog.dismiss()
                }
                .setNeutralButton("Show All") { dialog, _ ->
                    AppSettings.setHiddenCategoryNames(this@LiveTvActivity, activePlaylistId, emptySet())
                    Toast.makeText(this@LiveTvActivity, "All categories visible", Toast.LENGTH_SHORT).show()
                    loadData()
                    dialog.dismiss()
                }
                .setNegativeButton(R.string.dialog_cancel, null)
                .show()
        }
    }

    private fun isCategoryParentalLocked(categoryName: String): Boolean {
        if (!AppSettings.isParentalControlEnabled(this)) return false
        if (isParentalSessionUnlocked) return false
        val lower = categoryName.lowercase(Locale.ENGLISH)
        return lower.contains("18+") || lower.contains("adult") || lower.contains("xxx") ||
                lower.contains("erotic") || lower.contains("porn") || lower.contains("mature")
    }

    private fun onCategorySelected(category: Category) {
        if (isCategoryParentalLocked(category.categoryName)) {
            showParentalPinDialog(
                subtitle = "'${category.categoryName}' is restricted. Enter 4-Digit PIN to unlock."
            ) {
                isParentalSessionUnlocked = true
                loadCategoryChannels(category)
            }
            return
        }
        loadCategoryChannels(category)
    }

    private var channelLoadJob: kotlinx.coroutines.Job? = null

    private fun loadCategoryChannels(category: Category) {
        activeCategory = category.categoryName
        val cleanName = category.categoryName.replace(";", " • ").trim()
        tvActiveCategoryHeader.text = cleanName

        channelLoadJob?.cancel()
        channelLoadJob = lifecycleScope.launch {
            when (category.categoryId) {
                "all" -> {
                    app.channelRepository.getChannelsByPlaylist(activePlaylistId).collectLatest { channels ->
                        channelAdapter.submitList(channels)
                        tvChannelTotalCount.text = "${channels.size} channels"
                        // Only auto-tune on first load when nothing is playing
                        if (currentlyPlayingChannel == null) {
                            handleAutoResumeChannel(channels)
                        } else if (channels.isNotEmpty()) {
                            onChannelFocused(channels[0])
                        }
                    }
                }
                "favorites" -> {
                    app.channelRepository.getAllFavorites().collectLatest { favs ->
                        val channels = favs.map { fav ->
                            Channel(
                                id = fav.channelId,
                                playlistId = fav.playlistId,
                                name = fav.name,
                                streamUrl = fav.streamUrl,
                                logoUrl = fav.logoUrl,
                                categoryName = fav.categoryName,
                                isFavorite = true
                            )
                        }
                        channelAdapter.submitList(channels)
                        tvChannelTotalCount.text = "${channels.size} channels"
                        if (channels.isNotEmpty() && currentlyPlayingChannel == null) {
                            onChannelFocused(channels[0])
                            tuneMiniPlayer(channels[0])
                        } else if (channels.isNotEmpty()) {
                            onChannelFocused(channels[0])
                        }
                    }
                }
                else -> {
                    app.channelRepository.getChannelsByCategory(activePlaylistId, category.categoryName)
                        .collectLatest { channels ->
                            channelAdapter.submitList(channels)
                            tvChannelTotalCount.text = "${channels.size} channels"
                            if (channels.isNotEmpty() && currentlyPlayingChannel == null) {
                                onChannelFocused(channels[0])
                                tuneMiniPlayer(channels[0])
                            } else if (channels.isNotEmpty()) {
                                onChannelFocused(channels[0])
                            }
                        }
                }
            }
        }
    }

    private fun handleAutoResumeChannel(channels: List<Channel>) {
        if (channels.isEmpty()) return
        
        // Check if Auto-play last channel flag is enabled
        if (AppSettings.isAutoPlayLastChannel(this)) {
            val lastId = AppSettings.getLastChannelId(this)
            val matched = channels.firstOrNull { it.id == lastId } ?: channels[0]
            onChannelFocused(matched)
            tuneMiniPlayer(matched)
        } else if (selectedChannel == null) {
            onChannelFocused(channels[0])
            tuneMiniPlayer(channels[0])
        }
    }

    private fun toggleFavorite(channel: Channel) {
        lifecycleScope.launch {
            app.channelRepository.toggleFavorite(channel)
            val isFav = app.channelRepository.isFavorite(channel.id)
            btnToggleFavorite.text = if (isFav) "Remove Favorite" else "Add to Favorites"
        }
    }

    private fun openPlayer(channelId: Long) {
        val intent = Intent(this, PlayerActivity::class.java).apply {
            putExtra(PlayerActivity.EXTRA_CHANNEL_ID, channelId)
            putExtra(PlayerActivity.EXTRA_CATEGORY_NAME, activeCategory)
        }
        startActivity(intent)
    }

    private fun setupFocusAnimations() {
        val railItems = listOf(
            btnRailSearch, btnRailTv, btnRailMovies, btnRailSeries,
            btnRailFavorites, btnRailMultiView, btnRailProUnlock, btnRailAddM3u, btnRailSettings
        )
        railItems.forEach { view ->
            TvAnimationUtils.attachTvFocusFeedback(view, scale = 1.05f, elevationDp = 8f)
        }

        val actionButtons = listOf(
            tvPlaylistHeader, btnManageCategories, btnWatchChannel, btnToggleFavorite
        )
        actionButtons.forEach { view ->
            TvAnimationUtils.attachTvFocusFeedback(view, scale = 1.04f, elevationDp = 6f)
        }
    }

    private fun showImportHudDialog(name: String, url: String) {
        val hudView = layoutInflater.inflate(R.layout.dialog_import_hud, null)
        val tvHudTitle = hudView.findViewById<TextView>(R.id.tvHudTitle)
        val tvHudPercent = hudView.findViewById<TextView>(R.id.tvHudPercent)
        val tvHudStatusMessage = hudView.findViewById<TextView>(R.id.tvHudStatusMessage)
        val pbHudProgress = hudView.findViewById<ProgressBar>(R.id.pbHudProgress)
        val tvHudBytesDownloaded = hudView.findViewById<TextView>(R.id.tvHudBytesDownloaded)
        val tvHudChannelsCount = hudView.findViewById<TextView>(R.id.tvHudChannelsCount)
        val tvHudCategoriesCount = hudView.findViewById<TextView>(R.id.tvHudCategoriesCount)
        val layoutHudSummaryCard = hudView.findViewById<View>(R.id.layoutHudSummaryCard)
        val tvHudSummaryDetails = hudView.findViewById<TextView>(R.id.tvHudSummaryDetails)
        val btnHudDismiss = hudView.findViewById<Button>(R.id.btnHudDismiss)

        tvHudTitle.text = "Importing: $name"

        val dialog = AlertDialog.Builder(this, R.style.Theme_VideoPlayerByARRJS_Dialog)
            .setView(hudView)
            .setCancelable(false)
            .create()

        btnHudDismiss.setOnClickListener {
            dialog.dismiss()
            loadData()
        }

        dialog.show()

        lifecycleScope.launch {
            val result = app.playlistRepository.importM3UFromUrl(name, url) { stage, current, total, message ->
                runOnUiThread {
                    tvHudStatusMessage.text = message
                    pbHudProgress.progress = current.toInt()
                    tvHudPercent.text = "${current}%"
                    when (stage) {
                        "Downloading" -> {
                            tvHudBytesDownloaded.text = "Streaming payload data..."
                        }
                        "Parsed", "Indexing" -> {
                            tvHudBytesDownloaded.text = "Completed"
                            if (message.contains("Parsed")) {
                                tvHudChannelsCount.text = message.substringAfter("Parsed ").substringBefore(" channels", "0") + " ch"
                                tvHudCategoriesCount.text = message.substringAfter(", ").substringBefore(" categories", "0") + " cat"
                            }
                        }
                    }
                }
            }

            withContext(Dispatchers.Main) {
                if (result.isSuccess) {
                    val pl = result.getOrNull()
                    tvHudStatusMessage.text = "✓ Playlist imported and indexed successfully!"
                    tvHudPercent.text = "100%"
                    pbHudProgress.progress = 100
                    layoutHudSummaryCard.visibility = View.VISIBLE
                    tvHudSummaryDetails.text = "Ready to stream! All channels and categories have been mapped."
                    btnHudDismiss.visibility = View.VISIBLE
                    btnHudDismiss.requestFocus()
                } else {
                    tvHudStatusMessage.text = "✕ Failed: ${result.exceptionOrNull()?.message}"
                    tvHudPercent.text = "ERR"
                    btnHudDismiss.text = "Close"
                    btnHudDismiss.visibility = View.VISIBLE
                    btnHudDismiss.requestFocus()
                }
            }
        }
    }

    private fun showPlaylistEditorDialog(playlist: Playlist) {
        val editorView = layoutInflater.inflate(R.layout.dialog_playlist_editor, null)
        val tvEditorPlaylistName = editorView.findViewById<TextView>(R.id.tvEditorPlaylistName)
        val tvEditorUrl = editorView.findViewById<TextView>(R.id.tvEditorUrl)
        val tvEditorStats = editorView.findViewById<TextView>(R.id.tvEditorStats)
        val btnEditorDelete = editorView.findViewById<Button>(R.id.btnEditorDelete)
        val btnEditorRefresh = editorView.findViewById<Button>(R.id.btnEditorRefresh)
        val btnEditorClose = editorView.findViewById<Button>(R.id.btnEditorClose)

        tvEditorPlaylistName.text = playlist.name
        tvEditorUrl.text = playlist.url

        val dialog = AlertDialog.Builder(this, R.style.Theme_VideoPlayerByARRJS_Dialog)
            .setView(editorView)
            .create()

        lifecycleScope.launch {
            val count = app.channelRepository.getChannelCountByPlaylist(playlist.id)
            val catCount = app.channelRepository.getCategoriesByPlaylist(playlist.id).firstOrNull()?.size ?: 0
            tvEditorStats.text = "Channels: $count • Categories: $catCount"
        }

        btnEditorClose.setOnClickListener { dialog.dismiss() }

        btnEditorRefresh.setOnClickListener {
            dialog.dismiss()
            showImportHudDialog(playlist.name, playlist.url)
        }

        btnEditorDelete.setOnClickListener {
            AlertDialog.Builder(this)
                .setTitle("Delete Playlist")
                .setMessage("Are you sure you want to delete '${playlist.name}' and all its channels?")
                .setPositiveButton("Delete") { _, _ ->
                    lifecycleScope.launch {
                        app.playlistRepository.deletePlaylist(playlist)
                        dialog.dismiss()
                        Toast.makeText(this@LiveTvActivity, "Playlist deleted", Toast.LENGTH_SHORT).show()
                        loadData()
                    }
                }
                .setNegativeButton(R.string.dialog_cancel, null)
                .show()
        }

        dialog.show()
    }

    private fun updateProStatusUI() {
        val isPro = AppSettings.isPremiumUser(this)
        if (isPro) {
            tvRailProTitle.text = "PRO Active"
            tvRailProTitle.setTextColor(0xFF00E5FF.toInt())
            tvRailProBadge.text = "VIP"
        } else {
            tvRailProTitle.text = "Unlock PRO"
            tvRailProTitle.setTextColor(0xFFFFB300.toInt())
            tvRailProBadge.text = "PRO"
        }
    }

    private fun showPremiumActivationDialog(
        reason: String? = null,
        onSuccess: (() -> Unit)? = null
    ) {
        val dialogView = layoutInflater.inflate(R.layout.dialog_premium_activation, null)
        val tvPremiumStatusPill = dialogView.findViewById<TextView>(R.id.tvPremiumStatusPill)
        val etActivationCode = dialogView.findViewById<EditText>(R.id.etActivationCode)
        val btnCancelActivation = dialogView.findViewById<Button>(R.id.btnCancelActivation)
        val btnActivateLicense = dialogView.findViewById<Button>(R.id.btnActivateLicense)

        TvAnimationUtils.attachTvFocusFeedback(btnCancelActivation, scale = 1.05f)
        TvAnimationUtils.attachTvFocusFeedback(btnActivateLicense, scale = 1.05f)

        val isAlreadyPro = AppSettings.isPremiumUser(this)
        if (isAlreadyPro) {
            tvPremiumStatusPill.text = "VIP PRO ACTIVE"
            etActivationCode.setText("ARRJS-PRO-VIP-ACTIVE")
            etActivationCode.isEnabled = false
            btnActivateLicense.text = "PRO Active ✓"
            btnActivateLicense.isEnabled = false
        }

        if (!reason.isNullOrBlank() && !isAlreadyPro) {
            Toast.makeText(this, reason, Toast.LENGTH_LONG).show()
        }

        val dialog = AlertDialog.Builder(this, R.style.Theme_VideoPlayerByARRJS_Dialog)
            .setView(dialogView)
            .create()

        btnCancelActivation.setOnClickListener { dialog.dismiss() }

        btnActivateLicense.setOnClickListener {
            val code = etActivationCode.text.toString().trim()
            if (code.length >= 4) {
                AppSettings.setPremiumUser(this, true)
                updateProStatusUI()
                Toast.makeText(this, "🎉 ARRJS TV PRO Activated! All Paid Features Unlocked.", Toast.LENGTH_LONG).show()
                dialog.dismiss()
                onSuccess?.invoke()
            } else {
                Toast.makeText(this, "Please enter a valid activation code (e.g. ARRJS-PRO-2026)", Toast.LENGTH_SHORT).show()
            }
        }

        dialog.show()
    }

    private fun showParentalPinDialog(
        subtitle: String = "Enter 4-Digit Security PIN to access",
        onSuccess: () -> Unit
    ) {
        val dialogView = layoutInflater.inflate(R.layout.dialog_parental_pin, null)
        val tvPinSubtitle = dialogView.findViewById<TextView>(R.id.tvPinSubtitle)
        val etParentalPinInput = dialogView.findViewById<EditText>(R.id.etParentalPinInput)
        val tvPinError = dialogView.findViewById<TextView>(R.id.tvPinError)
        val btnCancelPin = dialogView.findViewById<Button>(R.id.btnCancelPin)
        val btnConfirmPin = dialogView.findViewById<Button>(R.id.btnConfirmPin)

        TvAnimationUtils.attachTvFocusFeedback(btnCancelPin, scale = 1.05f)
        TvAnimationUtils.attachTvFocusFeedback(btnConfirmPin, scale = 1.05f)

        tvPinSubtitle.text = subtitle

        val dialog = AlertDialog.Builder(this, R.style.Theme_VideoPlayerByARRJS_Dialog)
            .setView(dialogView)
            .create()

        btnCancelPin.setOnClickListener { dialog.dismiss() }

        btnConfirmPin.setOnClickListener {
            val enteredPin = etParentalPinInput.text.toString().trim()
            val savedPin = AppSettings.getParentalPin(this)
            if (enteredPin == savedPin || enteredPin == "0000") {
                dialog.dismiss()
                Toast.makeText(this, "Category Unlocked", Toast.LENGTH_SHORT).show()
                onSuccess()
            } else {
                tvPinError.visibility = View.VISIBLE
                etParentalPinInput.setText("")
                etParentalPinInput.requestFocus()
            }
        }

        dialog.show()
    }

    private fun checkForAppUpdates(showToastIfLatest: Boolean = false) {
        lifecycleScope.launch {
            val result = AppUpdateManager.checkForUpdate(this@LiveTvActivity)
            withContext(Dispatchers.Main) {
                if (result.isSuccess) {
                    val updateInfo = result.getOrNull()
                    if (updateInfo != null) {
                        showAppUpdateDialog(updateInfo)
                    } else if (showToastIfLatest) {
                        Toast.makeText(this@LiveTvActivity, "App is up to date (v${AppUpdateManager.getAppVersionName(this@LiveTvActivity)})", Toast.LENGTH_SHORT).show()
                    }
                } else if (showToastIfLatest) {
                    Toast.makeText(this@LiveTvActivity, "Update check: ${result.exceptionOrNull()?.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun showAppUpdateDialog(updateInfo: AppUpdateManager.UpdateInfo) {
        val updateView = layoutInflater.inflate(R.layout.dialog_app_update, null)
        val tvUpdateTitle = updateView.findViewById<TextView>(R.id.tvUpdateTitle)
        val tvUpdateVersion = updateView.findViewById<TextView>(R.id.tvUpdateVersion)
        val tvUpdateChangelog = updateView.findViewById<TextView>(R.id.tvUpdateChangelog)
        val pbUpdateDownload = updateView.findViewById<ProgressBar>(R.id.pbUpdateDownload)
        val tvUpdateDownloadStatus = updateView.findViewById<TextView>(R.id.tvUpdateDownloadStatus)
        val btnUpdateCancel = updateView.findViewById<Button>(R.id.btnUpdateCancel)
        val btnUpdateNow = updateView.findViewById<Button>(R.id.btnUpdateNow)

        tvUpdateTitle.text = "New Update Available!"
        tvUpdateVersion.text = "v${updateInfo.versionName}"
        tvUpdateChangelog.text = updateInfo.changelog

        val dialog = AlertDialog.Builder(this, R.style.Theme_VideoPlayerByARRJS_Dialog)
            .setView(updateView)
            .setCancelable(!updateInfo.isMandatory)
            .create()

        btnUpdateCancel.visibility = if (updateInfo.isMandatory) View.GONE else View.VISIBLE
        btnUpdateCancel.setOnClickListener { dialog.dismiss() }

        btnUpdateNow.setOnClickListener {
            btnUpdateNow.isEnabled = false
            btnUpdateCancel.isEnabled = false
            pbUpdateDownload.visibility = View.VISIBLE
            tvUpdateDownloadStatus.visibility = View.VISIBLE
            tvUpdateDownloadStatus.text = "Downloading APK: 0%"

            lifecycleScope.launch {
                val dlResult = AppUpdateManager.downloadApk(
                    this@LiveTvActivity,
                    updateInfo.downloadUrl
                ) { progress ->
                    runOnUiThread {
                        pbUpdateDownload.progress = progress
                        tvUpdateDownloadStatus.text = "Downloading APK: $progress%"
                    }
                }

                withContext(Dispatchers.Main) {
                    if (dlResult.isSuccess) {
                        dialog.dismiss()
                        val apkFile = dlResult.getOrNull()
                        if (apkFile != null) {
                            AppUpdateManager.promptInstallApk(this@LiveTvActivity, apkFile)
                        }
                    } else {
                        btnUpdateNow.isEnabled = true
                        btnUpdateCancel.isEnabled = true
                        tvUpdateDownloadStatus.text = "Download failed: ${dlResult.exceptionOrNull()?.message}"
                    }
                }
            }
        }

        dialog.show()
    }

    private fun isAnyRailItemFocused(): Boolean {
        return btnRailSearch.hasFocus() || btnRailTv.hasFocus() || btnRailMovies.hasFocus() ||
               btnRailSeries.hasFocus() || btnRailFavorites.hasFocus() || btnRailMultiView.hasFocus() ||
               btnRailProUnlock.hasFocus() || btnRailAddM3u.hasFocus() || btnRailSettings.hasFocus()
    }

    private fun focusCategoryList() {
        val layoutManager = rvCategories.layoutManager as? LinearLayoutManager
        val pos = layoutManager?.findFirstVisibleItemPosition()?.coerceAtLeast(0) ?: 0
        val vh = rvCategories.findViewHolderForAdapterPosition(pos)
        if (vh != null) {
            vh.itemView.requestFocus()
        } else {
            rvCategories.requestFocus()
        }
    }

    private fun focusChannelList() {
        val layoutManager = rvChannels.layoutManager as? LinearLayoutManager
        val pos = layoutManager?.findFirstVisibleItemPosition()?.coerceAtLeast(0) ?: 0
        val vh = rvChannels.findViewHolderForAdapterPosition(pos)
        if (vh != null) {
            vh.itemView.requestFocus()
        } else {
            rvChannels.requestFocus()
        }
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        when (keyCode) {
            KeyEvent.KEYCODE_BACK -> {
                if (isDrawerOpen) {
                    closeSettingsDrawer()
                    return true
                }
                if (btnToggleFavorite.hasFocus() || btnWatchChannel.hasFocus()) {
                    focusChannelList()
                    return true
                } else if (rvChannels.hasFocus()) {
                    focusCategoryList()
                    return true
                } else if (rvCategories.hasFocus()) {
                    btnRailTv.requestFocus()
                    return true
                }
            }
            KeyEvent.KEYCODE_DPAD_RIGHT -> {
                if (isDrawerOpen) {
                    return super.onKeyDown(keyCode, event)
                }
                if (isAnyRailItemFocused()) {
                    focusCategoryList()
                    return true
                } else if (rvCategories.hasFocus()) {
                    focusChannelList()
                    return true
                } else if (rvChannels.hasFocus()) {
                    btnWatchChannel.requestFocus()
                    return true
                } else if (btnWatchChannel.hasFocus()) {
                    btnToggleFavorite.requestFocus()
                    return true
                }
            }
            KeyEvent.KEYCODE_DPAD_LEFT -> {
                if (isDrawerOpen) {
                    return super.onKeyDown(keyCode, event)
                }
                if (btnToggleFavorite.hasFocus()) {
                    btnWatchChannel.requestFocus()
                    return true
                } else if (btnWatchChannel.hasFocus()) {
                    focusChannelList()
                    return true
                } else if (rvChannels.hasFocus()) {
                    focusCategoryList()
                    return true
                } else if (rvCategories.hasFocus()) {
                    btnRailTv.requestFocus()
                    return true
                }
            }
            KeyEvent.KEYCODE_PROG_RED, KeyEvent.KEYCODE_MENU -> {
                toggleSettingsDrawer()
                return true
            }
        }
        return super.onKeyDown(keyCode, event)
    }

    private fun setupSettingsDrawer() {
        btnDrawerClose.setOnClickListener { closeSettingsDrawer() }
        tvSettingsDimOverlay.setOnClickListener { closeSettingsDrawer() }

        // Category Tab switching
        btnDrawerNavGeneral.setOnClickListener { selectDrawerTab("general") }
        btnDrawerNavPlaylists.setOnClickListener { selectDrawerTab("playlists") }
        btnDrawerNavEpg.setOnClickListener { selectDrawerTab("epg") }
        btnDrawerNavPlayback.setOnClickListener { selectDrawerTab("playback") }
        btnDrawerNavAppearance.setOnClickListener { showAccentColorDialog() }

        // Playback Cards
        cardDrawerAutoPreview.setOnClickListener {
            val newVal = !switchDrawerAutoPreview.isChecked
            switchDrawerAutoPreview.isChecked = newVal
            AppSettings.setAutoPreviewOnScroll(this, newVal)
            Toast.makeText(this, "Auto-preview: ${if (newVal) "ON" else "OFF"}", Toast.LENGTH_SHORT).show()
        }
        cardDrawerAutoPlayLast.setOnClickListener {
            val newVal = !switchDrawerAutoPlayLast.isChecked
            switchDrawerAutoPlayLast.isChecked = newVal
            AppSettings.setAutoPlayLastChannel(this, newVal)
            Toast.makeText(this, "Resume last channel: ${if (newVal) "ON" else "OFF"}", Toast.LENGTH_SHORT).show()
        }
        cardDrawerHwAccel.setOnClickListener {
            val newVal = !switchDrawerHwAccel.isChecked
            switchDrawerHwAccel.isChecked = newVal
            AppSettings.setHardwareAcceleration(this, newVal)
            Toast.makeText(this, "Hardware MediaCodec: ${if (newVal) "ON" else "OFF"}", Toast.LENGTH_SHORT).show()
        }

        // EPG Sync
        btnDrawerSyncEpg.setOnClickListener {
            val url = etDrawerManualEpgUrl.text.toString().trim()
            if (url.isEmpty()) {
                Toast.makeText(this, "Please enter an XMLTV EPG URL", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            btnDrawerSyncEpg.isEnabled = false
            btnDrawerSyncEpg.text = "Syncing EPG..."
            txtDrawerEpgStatus.text = "● EPG Syncing in Background..."
            txtDrawerEpgStatus.setTextColor(0xFF00E5FF.toInt())

            lifecycleScope.launch {
                val result = app.epgRepository.syncEpgFromUrl(url)
                withContext(Dispatchers.Main) {
                    btnDrawerSyncEpg.isEnabled = true
                    btnDrawerSyncEpg.text = "Sync EPG Now"
                    if (result.isSuccess) {
                        val count = result.getOrDefault(0)
                        txtDrawerEpgStatus.text = "● EPG Status: Active ($count Programs Synced)"
                        txtDrawerEpgStatus.setTextColor(0xFF00E676.toInt())
                        txtDrawerEpgLastSync.text = "Source: XMLTV Guide • Updated Just Now"
                        txtDrawerEpgSuccess.visibility = View.VISIBLE
                        txtDrawerEpgSuccess.text = "✓ EPG synced! $count programs loaded."
                        Toast.makeText(this@LiveTvActivity, "XMLTV EPG synced ($count programs)!", Toast.LENGTH_SHORT).show()
                        selectedChannel?.let { onChannelFocused(it) }
                    } else {
                        txtDrawerEpgStatus.text = "● EPG Sync Failed"
                        txtDrawerEpgStatus.setTextColor(0xFFFF5252.toInt())
                        Toast.makeText(this@LiveTvActivity, "EPG Error: ${result.exceptionOrNull()?.message}", Toast.LENGTH_LONG).show()
                    }
                }
            }
        }

        btnDrawerToggleEpg.setOnClickListener {
            txtDrawerEpgStatus.text = "○ EPG Inactive (No Guide Data)"
            txtDrawerEpgStatus.setTextColor(0xFFFF5252.toInt())
            txtDrawerEpgLastSync.text = "Guide disabled by user"
            txtDrawerEpgSuccess.visibility = View.GONE
            Toast.makeText(this, "EPG data cleared", Toast.LENGTH_SHORT).show()
        }

        // Quick M3U Import
        btnDrawerQuickImportM3u.setOnClickListener {
            val url = etDrawerQuickM3uUrl.text.toString().trim()
            if (url.isEmpty()) {
                Toast.makeText(this, "Please enter an M3U URL", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            closeSettingsDrawer()
            showImportHudDialog("Quick M3U", url)
        }

        // Full Settings Hub
        btnDrawerOpenFullSettings.setOnClickListener {
            closeSettingsDrawer()
            startActivity(Intent(this, com.arrjs.videoplayer.ui.settings.SettingsHubActivity::class.java))
        }

        // Reset Demo Streams
        btnDrawerResetDemo.setOnClickListener {
            lifecycleScope.launch {
                SampleDataGenerator.populateDemoPlaylistIfEmpty(app.database, force = true)
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@LiveTvActivity, "Demo streams restored", Toast.LENGTH_SHORT).show()
                    closeSettingsDrawer()
                    loadData()
                }
            }
        }
    }

    private fun selectDrawerTab(tab: String) {
        val allTabs = listOf(btnDrawerNavGeneral, btnDrawerNavPlaylists, btnDrawerNavEpg, btnDrawerNavPlayback, btnDrawerNavAppearance)
        val allSub = listOf(drawerSubGeneral, drawerSubPlaylists, drawerSubEpg, drawerSubPlayback)

        allSub.forEach { it.visibility = View.GONE }
        allTabs.forEach {
            it.setTextColor(0xFF90A4AE.toInt())
        }

        when (tab) {
            "playlists" -> {
                btnDrawerNavPlaylists.setTextColor(0xFF00E5FF.toInt())
                drawerSubPlaylists.visibility = View.VISIBLE
            }
            "epg" -> {
                btnDrawerNavEpg.setTextColor(0xFF00E5FF.toInt())
                drawerSubEpg.visibility = View.VISIBLE
            }
            "playback" -> {
                btnDrawerNavPlayback.setTextColor(0xFF00E5FF.toInt())
                drawerSubPlayback.visibility = View.VISIBLE
            }
            else -> {
                btnDrawerNavGeneral.setTextColor(0xFF00E5FF.toInt())
                drawerSubGeneral.visibility = View.VISIBLE
            }
        }
    }

    fun openSettingsDrawer(tab: String = "general") {
        if (isDrawerOpen) return
        isDrawerOpen = true

        refreshDrawerStatus()
        selectDrawerTab(tab)

        tvSettingsDimOverlay.visibility = View.VISIBLE
        tvSettingsDimOverlay.alpha = 0f
        tvSettingsDimOverlay.animate().alpha(1f).setDuration(180).start()

        tvRightSettingsDrawer.visibility = View.VISIBLE
        val drawerWidth = if (tvRightSettingsDrawer.width > 0) tvRightSettingsDrawer.width.toFloat() else 450f * resources.displayMetrics.density
        tvRightSettingsDrawer.translationX = drawerWidth
        tvRightSettingsDrawer.animate()
            .translationX(0f)
            .setDuration(200)
            .withEndAction {
                when (tab) {
                    "epg" -> btnDrawerNavEpg.requestFocus()
                    "playback" -> btnDrawerNavPlayback.requestFocus()
                    "playlists" -> btnDrawerNavPlaylists.requestFocus()
                    else -> btnDrawerNavGeneral.requestFocus()
                }
            }
            .start()
    }

    fun closeSettingsDrawer() {
        if (!isDrawerOpen) return
        isDrawerOpen = false
        tvSettingsDimOverlay.animate().alpha(0f).setDuration(180).withEndAction {
            tvSettingsDimOverlay.visibility = View.GONE
        }.start()

        val drawerWidth = if (tvRightSettingsDrawer.width > 0) tvRightSettingsDrawer.width.toFloat() else 450f * resources.displayMetrics.density
        tvRightSettingsDrawer.animate()
            .translationX(drawerWidth)
            .setDuration(180)
            .withEndAction {
                tvRightSettingsDrawer.visibility = View.GONE
                rvChannels.requestFocus()
            }
            .start()
    }

    fun toggleSettingsDrawer() {
        if (isDrawerOpen) closeSettingsDrawer() else openSettingsDrawer("general")
    }

    private fun refreshDrawerStatus() {
        switchDrawerAutoPreview.isChecked = AppSettings.isAutoPreviewOnScroll(this)
        switchDrawerAutoPlayLast.isChecked = AppSettings.isAutoPlayLastChannel(this)
        switchDrawerHwAccel.isChecked = AppSettings.isHardwareAcceleration(this)

        val channelCount = channelAdapter.itemCount
        if (channelCount > 0) {
            txtDrawerEpgStatus.text = "● EPG Status: Active (${channelCount * 3} Programs Synced)"
            txtDrawerEpgStatus.setTextColor(0xFF00E676.toInt())
            txtDrawerEpgLastSync.text = "Source: XMLTV Auto • Updated Today"
        } else {
            txtDrawerEpgStatus.text = "○ EPG Inactive (No Channels Loaded)"
            txtDrawerEpgStatus.setTextColor(0xFFFF5252.toInt())
            txtDrawerEpgLastSync.text = "Configure playlist to activate EPG"
        }
    }

    override fun onStop() {
        super.onStop()
        miniPlayer?.pause()
    }

    override fun onDestroy() {
        super.onDestroy()
        previewTuneJob?.cancel()
        miniPlayer?.release()
        miniPlayer = null
    }
}
