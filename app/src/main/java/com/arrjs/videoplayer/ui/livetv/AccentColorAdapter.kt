package com.arrjs.videoplayer.ui.livetv

import android.graphics.PorterDuff
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.arrjs.videoplayer.R
import com.arrjs.videoplayer.utils.AccentColor

class AccentColorAdapter(
    private var selectedColor: AccentColor,
    private val onColorSelected: (AccentColor) -> Unit
) : RecyclerView.Adapter<AccentColorAdapter.ColorViewHolder>() {

    private val colors = AccentColor.values().toList()

    inner class ColorViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val container: View = itemView.findViewById(R.id.containerColorOption)
        val viewColorDot: View = itemView.findViewById(R.id.viewColorDot)
        val tvColorName: TextView = itemView.findViewById(R.id.tvColorName)
        val tvCheckCircle: TextView = itemView.findViewById(R.id.tvCheckCircle)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ColorViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_accent_color, parent, false)
        return ColorViewHolder(view)
    }

    override fun onBindViewHolder(holder: ColorViewHolder, position: Int) {
        val item = colors[position]
        val isSelected = (item == selectedColor)

        holder.tvColorName.text = item.displayName
        
        // Swatch dot color
        val dotDrawable = holder.viewColorDot.background?.mutate()
        dotDrawable?.setColorFilter(item.parsedColorInt, PorterDuff.Mode.SRC_IN)
        holder.viewColorDot.background = dotDrawable

        // Checkmark badge
        if (isSelected) {
            holder.tvCheckCircle.visibility = View.VISIBLE
            val checkDrawable = holder.tvCheckCircle.background?.mutate()
            checkDrawable?.setColorFilter(item.parsedColorInt, PorterDuff.Mode.SRC_IN)
            holder.tvCheckCircle.background = checkDrawable
        } else {
            holder.tvCheckCircle.visibility = View.GONE
        }

        holder.container.setOnClickListener {
            selectedColor = item
            notifyDataSetChanged()
            onColorSelected(item)
        }
    }

    override fun getItemCount(): Int = colors.size

    fun updateSelected(newColor: AccentColor) {
        selectedColor = newColor
        notifyDataSetChanged()
    }
}
