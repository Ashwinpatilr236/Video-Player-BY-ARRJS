package com.arrjs.videoplayer.utils

import android.os.Build

object NetworkUtils {

    /**
     * Determines whether the app is currently running inside an Android emulator.
     */
    val isEmulator: Boolean by lazy {
        Build.FINGERPRINT.startsWith("generic") ||
        Build.FINGERPRINT.startsWith("unknown") ||
        Build.MODEL.contains("google_sdk", ignoreCase = true) ||
        Build.MODEL.contains("Emulator", ignoreCase = true) ||
        Build.MODEL.contains("Android SDK built for x86", ignoreCase = true) ||
        Build.MANUFACTURER.contains("Genymotion", ignoreCase = true) ||
        (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic")) ||
        Build.PRODUCT == "google_sdk" ||
        Build.PRODUCT.contains("sdk_gphone", ignoreCase = true) ||
        Build.HARDWARE.contains("goldfish", ignoreCase = true) ||
        Build.HARDWARE.contains("ranchu", ignoreCase = true)
    }

    /**
     * Normalizes a URL:
     * - Adds "http://" if protocol is omitted.
     * - When running on an Android emulator, automatically routes "localhost" and "127.0.0.1"
     *   to "10.0.2.2" (the host machine's loopback alias in the Android emulator).
     */
    fun resolveUrl(rawUrl: String): String {
        var url = rawUrl.trim()
        if (url.isEmpty()) return url

        val lower = url.lowercase()
        if (!lower.startsWith("http://") && !lower.startsWith("https://") &&
            !lower.startsWith("rtmp://") && !lower.startsWith("rtmps://") &&
            !lower.startsWith("rtsp://") && !lower.startsWith("udp://") &&
            !lower.startsWith("mms://")) {
            url = "http://$url"
        }

        if (isEmulator) {
            // Replace localhost and 127.0.0.1 with 10.0.2.2 for emulator-to-host networking
            url = url.replace("://localhost", "://10.0.2.2", ignoreCase = true)
                     .replace("://127.0.0.1", "://10.0.2.2")
        }

        return url
    }
}
