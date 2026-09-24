package com.arrjs.videoplayer.utils

import android.content.Context
import android.graphics.Color
import androidx.core.content.ContextCompat
import com.arrjs.videoplayer.R

enum class AccentColor(
    val id: String,
    val displayName: String,
    val hexColor: String,
    val colorResId: Int
) {
    PINK("pink", "Pink", "#EC4899", R.color.tv_accent_pink),
    PURPLE("purple", "Purple", "#A855F7", R.color.tv_accent_purple),
    INDIGO("indigo", "Indigo", "#6366F1", R.color.tv_accent_indigo),
    BLUE("blue", "Blue", "#3B82F6", R.color.tv_accent_blue),
    CYAN("cyan", "Cyan", "#00F0FF", R.color.tv_accent_cyan),
    TEAL("teal", "Teal", "#14B8A6", R.color.tv_accent_teal),
    GREEN("green", "Green", "#10B981", R.color.tv_accent_green),
    LIME("lime", "Lime", "#84CC16", R.color.tv_accent_lime),
    YELLOW("yellow", "Yellow", "#EAB308", R.color.tv_accent_yellow),
    AMBER("amber", "Amber", "#F59E0B", R.color.tv_accent_amber);

    val parsedColorInt: Int
        get() = Color.parseColor(hexColor)
}

object ThemeManager {
    private const val PREFS_NAME = "arrjs_theme_prefs"
    private const val KEY_ACCENT = "key_accent_color"

    fun getAccentColor(context: Context): AccentColor {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val savedId = prefs.getString(KEY_ACCENT, AccentColor.BLUE.id) ?: AccentColor.BLUE.id
        return AccentColor.values().firstOrNull { it.id.equals(savedId, ignoreCase = true) } ?: AccentColor.BLUE
    }

    fun setAccentColor(context: Context, accentColor: AccentColor) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putString(KEY_ACCENT, accentColor.id).apply()
    }

    fun getAccentColorInt(context: Context): Int {
        val accent = getAccentColor(context)
        return try {
            ContextCompat.getColor(context, accent.colorResId)
        } catch (e: Exception) {
            accent.parsedColorInt
        }
    }
}
