package com.arrjs.videoplayer.ui.settings

import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.SwitchCompat
import androidx.lifecycle.lifecycleScope
import com.arrjs.videoplayer.R
import com.arrjs.videoplayer.TvPlayerApplication
import com.arrjs.videoplayer.utils.AppSettings
import com.arrjs.videoplayer.utils.SampleDataGenerator
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Commercial-grade 2-Pane Full-Page TV Settings Hub (TiviMate style).
 * Left Navigation Pane + Right Expanded Workspace taking 100% of TV screen.
 */
class SettingsHubActivity : AppCompatActivity() {

    private val app by lazy { application as TvPlayerApplication }

    // Left Tabs
    private lateinit var tabPlaylists: Button
    private lateinit var tabPlayback: Button
    private lateinit var tabStalker: Button
    private lateinit var tabEpg: Button
    private lateinit var tabAppearance: Button
    private lateinit var tabMaintenance: Button

    // Right Panels
    private lateinit var panelPlaylists: View
    private lateinit var panelPlayback: View
    private lateinit var panelStalker: View
    private lateinit var panelEpg: View
    private lateinit var panelAppearance: View
    private lateinit var panelMaintenance: View

    // Status Texts
    private lateinit var txtActiveTitle: TextView
    private lateinit var txtActiveDetails: TextView

    // Switches
    private lateinit var switchAutoPreview: SwitchCompat
    private lateinit var switchLastChannel: SwitchCompat
    private lateinit var switchHardwareAccel: SwitchCompat

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_settings_hub)

        initViews()
        setupTabNavigation()
        setupPlaylistPanel()
        setupPlaybackPanel()
        setupStalkerPanel()
        setupEpgPanel()
        setupAppearancePanel()
        setupMaintenancePanel()

        loadActivePlaylistInfo()
    }

    private fun initViews() {
        tabPlaylists = findViewById(R.id.navTabPlaylists)
        tabPlayback = findViewById(R.id.navTabPlayback)
        tabStalker = findViewById(R.id.navTabStalker)
        tabEpg = findViewById(R.id.navTabEpg)
        tabAppearance = findViewById(R.id.navTabAppearance)
        tabMaintenance = findViewById(R.id.navTabMaintenance)

        panelPlaylists = findViewById(R.id.panelPlaylists)
        panelPlayback = findViewById(R.id.panelPlayback)
        panelStalker = findViewById(R.id.panelStalker)
        panelEpg = findViewById(R.id.panelEpg)
        panelAppearance = findViewById(R.id.panelAppearance)
        panelMaintenance = findViewById(R.id.panelMaintenance)

        txtActiveTitle = findViewById(R.id.txtActivePlaylistTitle)
        txtActiveDetails = findViewById(R.id.txtActivePlaylistDetails)

        switchAutoPreview = findViewById(R.id.switchAutoPreview)
        switchLastChannel = findViewById(R.id.switchLastChannel)
        switchHardwareAccel = findViewById(R.id.switchHardwareAccel)
    }

    private fun setupTabNavigation() {
        val allTabs = listOf(tabPlaylists, tabPlayback, tabStalker, tabEpg, tabAppearance, tabMaintenance)
        val allPanels = listOf(panelPlaylists, panelPlayback, panelStalker, panelEpg, panelAppearance, panelMaintenance)

        fun selectTab(selectedTab: Button, selectedPanel: View) {
            allTabs.forEach { tab ->
                val isSelected = tab == selectedTab
                tab.setTextColor(if (isSelected) 0xFF00E5FF.toInt() else 0xFF90A4AE.toInt())
                tab.compoundDrawablesRelative[0]?.setTint(if (isSelected) 0xFF00E5FF.toInt() else 0xFF90A4AE.toInt())
            }
            allPanels.forEach { panel ->
                panel.visibility = if (panel == selectedPanel) View.VISIBLE else View.GONE
            }
        }

        tabPlaylists.setOnClickListener { selectTab(tabPlaylists, panelPlaylists) }
        tabPlayback.setOnClickListener { selectTab(tabPlayback, panelPlayback) }
        tabStalker.setOnClickListener { selectTab(tabStalker, panelStalker) }
        tabEpg.setOnClickListener { selectTab(tabEpg, panelEpg) }
        tabAppearance.setOnClickListener { selectTab(tabAppearance, panelAppearance) }
        tabMaintenance.setOnClickListener { selectTab(tabMaintenance, panelMaintenance) }

        // Start on playlists
        selectTab(tabPlaylists, panelPlaylists)
        tabPlaylists.requestFocus()
    }

    private fun loadActivePlaylistInfo() {
        lifecycleScope.launch {
            val active = app.playlistRepository.getActivePlaylist()
            if (active != null) {
                txtActiveTitle.text = "Active: ${active.name}"
                txtActiveDetails.text = "Type: ${active.type} | Channels: ${active.channelCount} | URL: ${active.url}"
            } else {
                txtActiveTitle.text = "No Active Playlist"
                txtActiveDetails.text = "Add an M3U, Xtream, or Stalker portal below."
            }
        }
    }

    private fun setupPlaylistPanel() {
        val etM3uName = findViewById<EditText>(R.id.etM3uName)
        val etM3uUrl = findViewById<EditText>(R.id.etM3uUrl)
        val btnSubmitM3u = findViewById<Button>(R.id.btnSubmitM3u)

        val etXtreamServer = findViewById<EditText>(R.id.etXtreamServer)
        val etXtreamUser = findViewById<EditText>(R.id.etXtreamUser)
        val etXtreamPass = findViewById<EditText>(R.id.etXtreamPass)
        val btnSubmitXtream = findViewById<Button>(R.id.btnSubmitXtream)

        val btnReloadPlaylist = findViewById<Button>(R.id.btnReloadPlaylist)
        btnReloadPlaylist.setOnClickListener {
            loadActivePlaylistInfo()
            Toast.makeText(this, "Active playlist reloaded", Toast.LENGTH_SHORT).show()
        }

        btnSubmitM3u.setOnClickListener {
            val name = etM3uName.text.toString().trim()
            val url = etM3uUrl.text.toString().trim()

            if (name.isEmpty() || url.isEmpty()) {
                Toast.makeText(this, "Please enter both playlist name and URL", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            btnSubmitM3u.isEnabled = false
            btnSubmitM3u.text = "Downloading & Parsing M3U..."

            lifecycleScope.launch {
                val result = app.playlistRepository.importM3UFromUrl(name, url)
                withContext(Dispatchers.Main) {
                    btnSubmitM3u.isEnabled = true
                    btnSubmitM3u.text = "Import M3U Playlist"
                    if (result.isSuccess) {
                        val pl = result.getOrNull()
                        Toast.makeText(this@SettingsHubActivity, "Success: Loaded ${pl?.channelCount ?: 0} channels!", Toast.LENGTH_LONG).show()
                        loadActivePlaylistInfo()
                        etM3uName.text.clear()
                        etM3uUrl.text.clear()
                    } else {
                        Toast.makeText(this@SettingsHubActivity, "Failed: ${result.exceptionOrNull()?.message}", Toast.LENGTH_LONG).show()
                    }
                }
            }
        }

        btnSubmitXtream.setOnClickListener {
            val server = etXtreamServer.text.toString().trim()
            val user = etXtreamUser.text.toString().trim()
            val pass = etXtreamPass.text.toString().trim()

            if (server.isEmpty() || user.isEmpty() || pass.isEmpty()) {
                Toast.makeText(this, "Please fill in Server, Username and Password", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            btnSubmitXtream.isEnabled = false
            btnSubmitXtream.text = "Connecting Xtream API..."

            lifecycleScope.launch {
                val result = app.playlistRepository.importXtreamCodes("Xtream ($user)", server, user, pass)
                withContext(Dispatchers.Main) {
                    btnSubmitXtream.isEnabled = true
                    btnSubmitXtream.text = "Connect Xtream API"
                    if (result.isSuccess) {
                        val pl = result.getOrNull()
                        Toast.makeText(this@SettingsHubActivity, "Xtream Connected! ${pl?.channelCount ?: 0} streams loaded", Toast.LENGTH_LONG).show()
                        loadActivePlaylistInfo()
                    } else {
                        Toast.makeText(this@SettingsHubActivity, "Error: ${result.exceptionOrNull()?.message}", Toast.LENGTH_LONG).show()
                    }
                }
            }
        }
    }

    private fun setupPlaybackPanel() {
        switchAutoPreview.isChecked = AppSettings.isAutoPreviewOnScroll(this)
        switchLastChannel.isChecked = AppSettings.isAutoPlayLastChannel(this)
        switchHardwareAccel.isChecked = AppSettings.isHardwareAcceleration(this)

        findViewById<View>(R.id.cardFlagAutoPreview).setOnClickListener {
            val newVal = !switchAutoPreview.isChecked
            switchAutoPreview.isChecked = newVal
            AppSettings.setAutoPreviewOnScroll(this, newVal)
            Toast.makeText(this, "Auto-preview on scroll: ${if (newVal) "ON" else "OFF"}", Toast.LENGTH_SHORT).show()
        }

        findViewById<View>(R.id.cardFlagLastChannel).setOnClickListener {
            val newVal = !switchLastChannel.isChecked
            switchLastChannel.isChecked = newVal
            AppSettings.setAutoPlayLastChannel(this, newVal)
            Toast.makeText(this, "Resume last channel: ${if (newVal) "ON" else "OFF"}", Toast.LENGTH_SHORT).show()
        }

        findViewById<View>(R.id.cardFlagHardwareAccel).setOnClickListener {
            val newVal = !switchHardwareAccel.isChecked
            switchHardwareAccel.isChecked = newVal
            AppSettings.setHardwareAcceleration(this, newVal)
            Toast.makeText(this, "Hardware MediaCodec: ${if (newVal) "ON" else "OFF"}", Toast.LENGTH_SHORT).show()
        }

        val btnBuffer15 = findViewById<Button>(R.id.btnBuffer15)
        val btnBuffer30 = findViewById<Button>(R.id.btnBuffer30)
        val btnBuffer60 = findViewById<Button>(R.id.btnBuffer60)

        fun updateBufferButtons(currentDuration: Int) {
            btnBuffer15.setTextColor(if (currentDuration == 15000) 0xFF00E5FF.toInt() else 0xFF90A4AE.toInt())
            btnBuffer30.setTextColor(if (currentDuration == 30000) 0xFF00E5FF.toInt() else 0xFF90A4AE.toInt())
            btnBuffer60.setTextColor(if (currentDuration == 60000) 0xFF00E5FF.toInt() else 0xFF90A4AE.toInt())
        }

        updateBufferButtons(AppSettings.getBufferDurationMs(this))

        btnBuffer15.setOnClickListener {
            AppSettings.setBufferDurationMs(this, 15000)
            updateBufferButtons(15000)
            Toast.makeText(this, "Buffer set to 15s (Ultra-Fast Switch)", Toast.LENGTH_SHORT).show()
        }

        btnBuffer30.setOnClickListener {
            AppSettings.setBufferDurationMs(this, 30000)
            updateBufferButtons(30000)
            Toast.makeText(this, "Buffer set to 30s (Balanced)", Toast.LENGTH_SHORT).show()
        }

        btnBuffer60.setOnClickListener {
            AppSettings.setBufferDurationMs(this, 60000)
            updateBufferButtons(60000)
            Toast.makeText(this, "Buffer set to 60s (High Stability)", Toast.LENGTH_SHORT).show()
        }

        // Tool Bar Flags
        val chkToolPrevNext = findViewById<android.widget.CheckBox>(R.id.chkToolPrevNext)
        val chkToolAspectRatio = findViewById<android.widget.CheckBox>(R.id.chkToolAspectRatio)
        val chkToolVideoQuality = findViewById<android.widget.CheckBox>(R.id.chkToolVideoQuality)
        val chkToolAudioBoost = findViewById<android.widget.CheckBox>(R.id.chkToolAudioBoost)
        val chkToolAudioTracks = findViewById<android.widget.CheckBox>(R.id.chkToolAudioTracks)
        val chkToolSubtitles = findViewById<android.widget.CheckBox>(R.id.chkToolSubtitles)
        val chkToolSleepTimer = findViewById<android.widget.CheckBox>(R.id.chkToolSleepTimer)

        chkToolPrevNext.isChecked = AppSettings.isShowToolPrevNext(this)
        chkToolAspectRatio.isChecked = AppSettings.isShowToolAspectRatio(this)
        chkToolVideoQuality.isChecked = AppSettings.isShowToolVideoQuality(this)
        chkToolAudioBoost.isChecked = AppSettings.isShowToolAudioBoost(this)
        chkToolAudioTracks.isChecked = AppSettings.isShowToolAudioTracks(this)
        chkToolSubtitles.isChecked = AppSettings.isShowToolSubtitles(this)
        chkToolSleepTimer.isChecked = AppSettings.isShowToolSleepTimer(this)

        chkToolPrevNext.setOnCheckedChangeListener { _, isChecked -> AppSettings.setShowToolPrevNext(this, isChecked) }
        chkToolAspectRatio.setOnCheckedChangeListener { _, isChecked -> AppSettings.setShowToolAspectRatio(this, isChecked) }
        chkToolVideoQuality.setOnCheckedChangeListener { _, isChecked -> AppSettings.setShowToolVideoQuality(this, isChecked) }
        chkToolAudioBoost.setOnCheckedChangeListener { _, isChecked -> AppSettings.setShowToolAudioBoost(this, isChecked) }
        chkToolAudioTracks.setOnCheckedChangeListener { _, isChecked -> AppSettings.setShowToolAudioTracks(this, isChecked) }
        chkToolSubtitles.setOnCheckedChangeListener { _, isChecked -> AppSettings.setShowToolSubtitles(this, isChecked) }
        chkToolSleepTimer.setOnCheckedChangeListener { _, isChecked -> AppSettings.setShowToolSleepTimer(this, isChecked) }
    }

    private fun setupStalkerPanel() {
        val etStalkerName = findViewById<EditText>(R.id.etStalkerName)
        val etStalkerUrl = findViewById<EditText>(R.id.etStalkerUrl)
        val etStalkerMac = findViewById<EditText>(R.id.etStalkerMac)
        val btnConnect = findViewById<Button>(R.id.btnConnectStalker)

        btnConnect.setOnClickListener {
            val name = etStalkerName.text.toString().trim()
            val url = etStalkerUrl.text.toString().trim()
            val mac = etStalkerMac.text.toString().trim()

            if (url.isEmpty() || mac.isEmpty()) {
                Toast.makeText(this, "Please enter Portal URL and MAC Address", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            btnConnect.isEnabled = false
            btnConnect.text = "Handshaking MAG STB..."

            lifecycleScope.launch {
                val displayName = if (name.isNotEmpty()) name else "Stalker ($mac)"
                val result = app.playlistRepository.importStalkerPortal(displayName, url, mac)
                withContext(Dispatchers.Main) {
                    btnConnect.isEnabled = true
                    btnConnect.text = "Connect Stalker Portal"
                    if (result.isSuccess) {
                        val pl = result.getOrNull()
                        Toast.makeText(this@SettingsHubActivity, "Stalker Connected! ${pl?.channelCount ?: 0} channels", Toast.LENGTH_LONG).show()
                        loadActivePlaylistInfo()
                    } else {
                        Toast.makeText(this@SettingsHubActivity, "Stalker Error: ${result.exceptionOrNull()?.message}", Toast.LENGTH_LONG).show()
                    }
                }
            }
        }
    }

    private fun setupEpgPanel() {
        val etEpgUrl = findViewById<EditText>(R.id.etEpgUrl)
        val btnSync = findViewById<Button>(R.id.btnSyncEpg)
        val tvStatus = findViewById<TextView>(R.id.tvEpgStatusDetails)

        val savedUrl = com.arrjs.videoplayer.utils.AppSettings.getEpgUrl(this)
        if (savedUrl.isNotBlank()) {
            etEpgUrl.setText(savedUrl)
        }
        val app = application as com.arrjs.videoplayer.TvPlayerApplication
        val count = app.epgRepository.getLoadedProgramCount()
        if (count > 0) {
            tvStatus.text = "✓ EPG Active: $count programs currently loaded in guide."
            tvStatus.setTextColor(0xFF00E676.toInt())
        }

        btnSync.setOnClickListener {
            val url = etEpgUrl.text.toString().trim()
            if (url.isEmpty()) {
                Toast.makeText(this, "Please enter an XMLTV URL", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            btnSync.isEnabled = false
            btnSync.text = "Syncing EPG..."
            tvStatus.text = "Syncing guide from $url..."
            tvStatus.setTextColor(0xFF00E5FF.toInt())
            Toast.makeText(this, "Syncing EPG guide in background...", Toast.LENGTH_SHORT).show()

            lifecycleScope.launch {
                val result = app.epgRepository.syncEpgFromUrl(url)
                withContext(Dispatchers.Main) {
                    btnSync.isEnabled = true
                    btnSync.text = "Sync TV Guide Schedule"
                    if (result.isSuccess) {
                        val total = result.getOrDefault(0)
                        tvStatus.text = "✓ EPG Synced! $total programs loaded successfully."
                        tvStatus.setTextColor(0xFF00E676.toInt())
                        Toast.makeText(this@SettingsHubActivity, "EPG synced ($total programs)!", Toast.LENGTH_SHORT).show()
                    } else {
                        val err = result.exceptionOrNull()?.message ?: "Unknown error"
                        tvStatus.text = "✕ Sync failed: $err"
                        tvStatus.setTextColor(0xFFFF5252.toInt())
                        Toast.makeText(this@SettingsHubActivity, "EPG Error: $err", Toast.LENGTH_LONG).show()
                    }
                }
            }
        }

        // EPG Frequency
        val btnEpgFreqDaily = findViewById<Button>(R.id.btnEpgFreqDaily)
        val btnEpgFreq3Days = findViewById<Button>(R.id.btnEpgFreq3Days)
        val btnEpgFreqNever = findViewById<Button>(R.id.btnEpgFreqNever)

        fun updateFreqButtons(freq: AppSettings.EpgUpdateFrequency) {
            btnEpgFreqDaily.setTextColor(if (freq == AppSettings.EpgUpdateFrequency.DAILY) 0xFF00E5FF.toInt() else 0xFF90A4AE.toInt())
            btnEpgFreq3Days.setTextColor(if (freq == AppSettings.EpgUpdateFrequency.THREE_DAYS) 0xFF00E5FF.toInt() else 0xFF90A4AE.toInt())
            btnEpgFreqNever.setTextColor(if (freq == AppSettings.EpgUpdateFrequency.NEVER) 0xFF00E5FF.toInt() else 0xFF90A4AE.toInt())
        }

        updateFreqButtons(AppSettings.getEpgUpdateFrequency(this))

        btnEpgFreqDaily.setOnClickListener {
            AppSettings.setEpgUpdateFrequency(this, AppSettings.EpgUpdateFrequency.DAILY)
            updateFreqButtons(AppSettings.EpgUpdateFrequency.DAILY)
            Toast.makeText(this, "EPG Update: Daily", Toast.LENGTH_SHORT).show()
        }
        btnEpgFreq3Days.setOnClickListener {
            AppSettings.setEpgUpdateFrequency(this, AppSettings.EpgUpdateFrequency.THREE_DAYS)
            updateFreqButtons(AppSettings.EpgUpdateFrequency.THREE_DAYS)
            Toast.makeText(this, "EPG Update: Every 3 Days", Toast.LENGTH_SHORT).show()
        }
        btnEpgFreqNever.setOnClickListener {
            AppSettings.setEpgUpdateFrequency(this, AppSettings.EpgUpdateFrequency.NEVER)
            updateFreqButtons(AppSettings.EpgUpdateFrequency.NEVER)
            Toast.makeText(this, "EPG Update: Never (Manual)", Toast.LENGTH_SHORT).show()
        }
    }

    private fun setupAppearancePanel() {
        val btnCyan = findViewById<Button>(R.id.btnAccentCyan)
        val btnGold = findViewById<Button>(R.id.btnAccentGold)
        val btnEmerald = findViewById<Button>(R.id.btnAccentEmerald)
        val btnPurple = findViewById<Button>(R.id.btnAccentPurple)

        btnCyan.setOnClickListener {
            com.arrjs.videoplayer.utils.ThemeManager.setAccentColor(this, com.arrjs.videoplayer.utils.AccentColor.CYAN)
            Toast.makeText(this, "Electric Cyan theme active", Toast.LENGTH_SHORT).show()
        }

        btnGold.setOnClickListener {
            com.arrjs.videoplayer.utils.ThemeManager.setAccentColor(this, com.arrjs.videoplayer.utils.AccentColor.AMBER)
            Toast.makeText(this, "Neon Gold theme active", Toast.LENGTH_SHORT).show()
        }

        btnEmerald.setOnClickListener {
            com.arrjs.videoplayer.utils.ThemeManager.setAccentColor(this, com.arrjs.videoplayer.utils.AccentColor.GREEN)
            Toast.makeText(this, "Emerald Green theme active", Toast.LENGTH_SHORT).show()
        }

        btnPurple.setOnClickListener {
            com.arrjs.videoplayer.utils.ThemeManager.setAccentColor(this, com.arrjs.videoplayer.utils.AccentColor.PURPLE)
            Toast.makeText(this, "Deep Violet theme active", Toast.LENGTH_SHORT).show()
        }
    }

    private fun setupMaintenancePanel() {
        findViewById<Button>(R.id.btnResetDemoStreams).setOnClickListener {
            lifecycleScope.launch {
                SampleDataGenerator.populateDemoPlaylistIfEmpty(app.database)
                withContext(Dispatchers.Main) {
                    loadActivePlaylistInfo()
                    Toast.makeText(this@SettingsHubActivity, "Built-in demo streams restored!", Toast.LENGTH_LONG).show()
                }
            }
        }

        findViewById<Button>(R.id.btnClearHistory).setOnClickListener {
            lifecycleScope.launch {
                app.watchHistoryRepository.clearHistory()
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@SettingsHubActivity, "Watch history cleared", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }
}
