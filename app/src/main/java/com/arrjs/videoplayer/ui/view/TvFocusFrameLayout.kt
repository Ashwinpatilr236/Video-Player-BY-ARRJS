package com.arrjs.videoplayer.ui.view

import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import android.util.AttributeSet
import android.view.animation.DecelerateInterpolator
import android.widget.FrameLayout
import androidx.core.content.ContextCompat
import com.arrjs.videoplayer.R

class TvFocusFrameLayout @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {

    private val borderPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = 3f * resources.displayMetrics.density
        color = ContextCompat.getColor(context, R.color.tv_accent_cyan)
    }

    private val rect = RectF()
    private val cornerRadius = 12f * resources.displayMetrics.density
    private val interpolator = DecelerateInterpolator(2.0f)

    init {
        isFocusable = true
        isFocusableInTouchMode = true
        setWillNotDraw(false)

        setOnFocusChangeListener { _, hasFocus ->
            if (hasFocus) {
                animate()
                    .scaleX(1.04f)
                    .scaleY(1.04f)
                    .setInterpolator(interpolator)
                    .setDuration(50)
                    .start()
            } else {
                animate()
                    .scaleX(1.0f)
                    .scaleY(1.0f)
                    .setInterpolator(interpolator)
                    .setDuration(50)
                    .start()
            }
            invalidate()
        }
    }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        val inset = borderPaint.strokeWidth / 2
        rect.set(inset, inset, w - inset, h - inset)
    }

    override fun dispatchDraw(canvas: Canvas) {
        super.dispatchDraw(canvas)
        if (isFocused) {
            canvas.drawRoundRect(rect, cornerRadius, cornerRadius, borderPaint)
        }
    }
}
