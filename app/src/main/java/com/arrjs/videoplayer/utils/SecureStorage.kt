package com.arrjs.videoplayer.utils

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class SecureStorage(context: Context) {

    private val prefs: SharedPreferences by lazy {
        try {
            val masterKey = MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()

            EncryptedSharedPreferences.create(
                context,
                "arrjs_secure_prefs",
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        } catch (e: Exception) {
            // Fallback to standard private preferences if Keystore unavailable on device
            context.getSharedPreferences("arrjs_secure_fallback_prefs", Context.MODE_PRIVATE)
        }
    }

    fun saveCredential(key: String, value: String) {
        prefs.edit().putString(key, value).apply()
    }

    fun getCredential(key: String, defaultValue: String = ""): String {
        return prefs.getString(key, defaultValue) ?: defaultValue
    }

    fun removeCredential(key: String) {
        prefs.edit().remove(key).apply()
    }
}
