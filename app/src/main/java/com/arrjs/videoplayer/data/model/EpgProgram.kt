package com.arrjs.videoplayer.data.model

data class EpgProgram(
    val id: String,
    val channelId: String,
    val title: String,
    val description: String = "",
    val startTimestamp: Long,
    val stopTimestamp: Long
) {
    val isCurrentlyAiring: Boolean
        get() {
            val now = System.currentTimeMillis() / 1000
            return now in startTimestamp..stopTimestamp
        }

    val progressPercent: Int
        get() {
            val now = System.currentTimeMillis() / 1000
            if (now < startTimestamp) return 0
            if (now > stopTimestamp) return 100
            val total = stopTimestamp - startTimestamp
            if (total <= 0) return 0
            return (((now - startTimestamp).toDouble() / total) * 100).toInt()
        }
}
