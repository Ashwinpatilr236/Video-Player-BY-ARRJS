package com.arrjs.videoplayer.ui.home

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.arrjs.videoplayer.R
import com.arrjs.videoplayer.data.model.Category

class CategoryCardAdapter(
    private val onCategoryClick: (Category) -> Unit
) : RecyclerView.Adapter<CategoryCardAdapter.ViewHolder>() {

    private val items = ArrayList<Category>()

    fun submitList(newItems: List<Category>) {
        items.clear()
        items.addAll(newItems)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_category_card, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(items[position])
    }

    override fun getItemCount(): Int = items.size

    inner class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val tvName: TextView = itemView.findViewById(R.id.tvCategoryName)
        private val tvStreamType: TextView = itemView.findViewById(R.id.tvStreamType)

        fun bind(category: Category) {
            tvName.text = category.categoryName
            tvStreamType.text = category.streamType.name

            itemView.setOnClickListener {
                onCategoryClick(category)
            }
        }
    }
}
