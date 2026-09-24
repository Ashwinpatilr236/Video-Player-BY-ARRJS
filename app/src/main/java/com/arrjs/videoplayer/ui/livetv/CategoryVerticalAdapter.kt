package com.arrjs.videoplayer.ui.livetv

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.arrjs.videoplayer.R
import com.arrjs.videoplayer.data.model.Category

class CategoryVerticalAdapter(
    private val onCategorySelected: (Category) -> Unit
) : RecyclerView.Adapter<CategoryVerticalAdapter.ViewHolder>() {

    private val items = ArrayList<Category>()
    private var selectedIndex = 0

    fun submitList(newItems: List<Category>) {
        items.clear()
        items.addAll(newItems)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_category_vertical, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(items[position], position)
    }

    override fun getItemCount(): Int = items.size

    inner class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val tvName: TextView = itemView.findViewById(R.id.tvCategoryName)
        private val tvBadge: TextView = itemView.findViewById(R.id.tvChannelBadge)

        fun bind(category: Category, position: Int) {
            val displayName = category.categoryName.replace(";", " • ").trim()
            tvName.text = displayName

            if (category.streamType == com.arrjs.videoplayer.data.model.StreamType.VOD) {
                tvBadge.visibility = View.VISIBLE
                tvBadge.text = "VOD"
            } else {
                tvBadge.visibility = View.GONE
            }

            itemView.isSelected = (position == selectedIndex)

            com.arrjs.videoplayer.utils.TvAnimationUtils.attachTvFocusFeedback(itemView, scale = 1.04f, elevationDp = 6f) { hasFocus ->
                if (hasFocus) {
                    selectedIndex = position
                    onCategorySelected(category)
                }
            }

            itemView.setOnClickListener {
                selectedIndex = position
                onCategorySelected(category)
            }
        }
    }
}
