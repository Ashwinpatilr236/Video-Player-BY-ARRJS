package com.arrjs.videoplayer.utils

import android.content.Context
import android.content.SharedPreferences

object AppSettings {
    private const val PREFS_NAME = "arrjs_tv_player_settings"

    private const val KEY_AUTO_PREVIEW_ON_SCROLL = "key_auto_preview_on_scroll"
    private const val KEY_AUTO_PLAY_LAST_CHANNEL = "key_auto_play_last_channel"
    private const val KEY_LAST_CHANNEL_ID = "key_last_channel_id"
    private const val KEY_BUFFER_DURATION_MS = "key_buffer_duration_ms"
    private const val KEY_HARDWARE_ACCELERATION = "key_hardware_acceleration"

    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    /**
     * When true: Scrolling through channels immediately tunes and previews live stream.
     * When false: Video remains on the current channel until the user presses OK.
     */
    fun isAutoPreviewOnScroll(context: Context): Boolean {
        return getPrefs(context).getBoolean(KEY_AUTO_PREVIEW_ON_SCROLL, false)
    }

    fun setAutoPreviewOnScroll(context: Context, enabled: Boolean) {
        getPrefs(context).edit().putBoolean(KEY_AUTO_PREVIEW_ON_SCROLL, enabled).apply()
    }

    /**
     * When true: App automatically tunes to the last played channel upon opening Live TV.
     */
    fun isAutoPlayLastChannel(context: Context): Boolean {
        return getPrefs(context).getBoolean(KEY_AUTO_PLAY_LAST_CHANNEL, true)
    }

    fun setAutoPlayLastChannel(context: Context, enabled: Boolean) {
        getPrefs(context).edit().putBoolean(KEY_AUTO_PLAY_LAST_CHANNEL, enabled).apply()
    }

    fun getLastChannelId(context: Context): Long {
        return getPrefs(context).getLong(KEY_LAST_CHANNEL_ID, -1L)
    }

    fun setLastChannelId(context: Context, channelId: Long) {
        getPrefs(context).edit().putLong(KEY_LAST_CHANNEL_ID, channelId).apply()
    }

    fun getBufferDurationMs(context: Context): Int {
        return getPrefs(context).getInt(KEY_BUFFER_DURATION_MS, 5000)
    }

    fun setBufferDurationMs(context: Context, bufferMs: Int) {
        getPrefs(context).edit().putInt(KEY_BUFFER_DURATION_MS, bufferMs).apply()
    }

    fun isHardwareAcceleration(context: Context): Boolean {
        return getPrefs(context).getBoolean(KEY_HARDWARE_ACCELERATION, true)
    }

    fun setHardwareAcceleration(context: Context, enabled: Boolean) {
        getPrefs(context).edit().putBoolean(KEY_HARDWARE_ACCELERATION, enabled).apply()
    }

    fun getHiddenCategoryNames(context: Context, playlistId: Long): Set<String> {
        return getPrefs(context).getStringSet("key_hidden_categories_$playlistId", emptySet()) ?: emptySet()
    }

    fun setHiddenCategoryNames(context: Context, playlistId: Long, hiddenNames: Set<String>) {
        getPrefs(context).edit().putStringSet("key_hidden_categories_$playlistId", hiddenNames).apply()
    }

    fun isSurroundPassthroughEnabled(context: Context): Boolean {
        return getPrefs(context).getBoolean("key_surround_passthrough", false)
    }

    fun setSurroundPassthroughEnabled(context: Context, enabled: Boolean) {
        getPrefs(context).edit().putBoolean("key_surround_passthrough", enabled).apply()
    }

    /**
     * Testing Mode: All users are granted PRO features automatically.
     * Future roadmap: Connect to remote account/login service.
     */
    fun isPremiumUser(context: Context): Boolean {
        return true
    }

    fun setPremiumUser(context: Context, isPremium: Boolean) {
        getPrefs(context).edit().putBoolean("key_is_premium", isPremium).apply()
    }

    /**
     * Fullscreen Player Tool Flags:
     * When false (default): Player displays a clean, elegant bottom EPG Card without button clutter.
     * When true: Advanced bottom tools bar with 10 control icons is shown.
     */
    fun isShowPlayerToolsBar(context: Context): Boolean {
        return getPrefs(context).getBoolean("key_show_player_tools_bar", false)
    }

    fun setShowPlayerToolsBar(context: Context, enabled: Boolean) {
        getPrefs(context).edit().putBoolean("key_show_player_tools_bar", enabled).apply()
    }

    fun isShowPlayerStatsHud(context: Context): Boolean {
        return getPrefs(context).getBoolean("key_show_player_stats_hud", false)
    }

    fun setShowPlayerStatsHud(context: Context, enabled: Boolean) {
        getPrefs(context).edit().putBoolean("key_show_player_stats_hud", enabled).apply()
    }

    fun isEnableMiniGuideDrawer(context: Context): Boolean {
        return getPrefs(context).getBoolean("key_enable_miniguide_drawer", false)
    }

    fun setEnableMiniGuideDrawer(context: Context, enabled: Boolean) {
        getPrefs(context).edit().putBoolean("key_enable_miniguide_drawer", enabled).apply()
    }

    fun getParentalPin(context: Context): String {
        return getPrefs(context).getString("key_parental_pin", "0000") ?: "0000"
    }

    fun setParentalPin(context: Context, pin: String) {
        getPrefs(context).edit().putString("key_parental_pin", pin).apply()
    }

    fun isParentalControlEnabled(context: Context): Boolean {
        return getPrefs(context).getBoolean("key_parental_enabled", false)
    }

    fun setParentalControlEnabled(context: Context, enabled: Boolean) {
        getPrefs(context).edit().putBoolean("key_parental_enabled", enabled).apply()
    }

    const val DEFAULT_EPG_URL = "https://avkb.short.gy/epg.xml.gz"

    fun getEpgUrl(context: Context): String {
        val saved = getPrefs(context).getString("key_epg_url", "") ?: ""
        return if (saved.isNotBlank()) saved else DEFAULT_EPG_URL
    }

    fun setEpgUrl(context: Context, url: String) {
        getPrefs(context).edit().putString("key_epg_url", url).apply()
    }

    fun getLastEpgSyncTime(context: Context): Long {
        return getPrefs(context).getLong("key_last_epg_sync_time", 0L)
    }

    fun setLastEpgSyncTime(context: Context, timestamp: Long) {
        getPrefs(context).edit().putLong("key_last_epg_sync_time", timestamp).apply()
    }

    enum class EpgUpdateFrequency(val days: Int) {
        DAILY(1),
        THREE_DAYS(3),
        NEVER(-1)
    }

    fun getEpgUpdateFrequency(context: Context): EpgUpdateFrequency {
        val saved = getPrefs(context).getString("key_epg_update_frequency", EpgUpdateFrequency.THREE_DAYS.name) ?: EpgUpdateFrequency.THREE_DAYS.name
        return try {
            EpgUpdateFrequency.valueOf(saved)
        } catch (e: Exception) {
            EpgUpdateFrequency.THREE_DAYS
        }
    }

    fun setEpgUpdateFrequency(context: Context, frequency: EpgUpdateFrequency) {
        getPrefs(context).edit().putString("key_epg_update_frequency", frequency.name).apply()
    }

    // Individual Tool Bar Flags
    fun isShowToolPrevNext(context: Context) = getPrefs(context).getBoolean("key_tool_prev_next", true)
    fun setShowToolPrevNext(context: Context, enabled: Boolean) = getPrefs(context).edit().putBoolean("key_tool_prev_next", enabled).apply()

    fun isShowToolAspectRatio(context: Context) = getPrefs(context).getBoolean("key_tool_aspect_ratio", true)
    fun setShowToolAspectRatio(context: Context, enabled: Boolean) = getPrefs(context).edit().putBoolean("key_tool_aspect_ratio", enabled).apply()

    fun isShowToolVideoQuality(context: Context) = getPrefs(context).getBoolean("key_tool_video_quality", true)
    fun setShowToolVideoQuality(context: Context, enabled: Boolean) = getPrefs(context).edit().putBoolean("key_tool_video_quality", enabled).apply()

    fun isShowToolAudioBoost(context: Context) = getPrefs(context).getBoolean("key_tool_audio_boost", true)
    fun setShowToolAudioBoost(context: Context, enabled: Boolean) = getPrefs(context).edit().putBoolean("key_tool_audio_boost", enabled).apply()

    fun isShowToolAudioTracks(context: Context) = getPrefs(context).getBoolean("key_tool_audio_tracks", true)
    fun setShowToolAudioTracks(context: Context, enabled: Boolean) = getPrefs(context).edit().putBoolean("key_tool_audio_tracks", enabled).apply()

    fun isShowToolSubtitles(context: Context) = getPrefs(context).getBoolean("key_tool_subtitles", true)
    fun setShowToolSubtitles(context: Context, enabled: Boolean) = getPrefs(context).edit().putBoolean("key_tool_subtitles", enabled).apply()

    fun isShowToolSleepTimer(context: Context) = getPrefs(context).getBoolean("key_tool_sleep_timer", true)
    fun setShowToolSleepTimer(context: Context, enabled: Boolean) = getPrefs(context).edit().putBoolean("key_tool_sleep_timer", enabled).apply()
}
