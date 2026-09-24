package com.arrjs.videoplayer.utils

import android.view.View
import android.view.animation.DecelerateInterpolator

object TvAnimationUtils {

    private val interpolator = DecelerateInterpolator(2.0f)

    /**
     * Ultra-fast tactile 10-foot TV D-Pad focus zoom.
     * Tuned for 50ms instant snappy response on Fire TV without translationZ layout lag.
     */
    fun attachTvFocusFeedback(
        view: View,
        scale: Float = 1.035f,
        elevationDp: Float = 0f,
        onFocusChanged: ((Boolean) -> Unit)? = null
    ) {
        view.setOnFocusChangeListener { v, hasFocus ->
            if (hasFocus) {
                v.animate()
                    .scaleX(scale)
                    .scaleY(scale)
                    .setDuration(50)
                    .setInterpolator(interpolator)
                    .start()
            } else {
                v.animate()
                    .scaleX(1.0f)
                    .scaleY(1.0f)
                    .setDuration(50)
                    .setInterpolator(interpolator)
                    .start()
            }
            onFocusChanged?.invoke(hasFocus)
        }
    }
}
