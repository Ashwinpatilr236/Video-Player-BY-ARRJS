package com.arrjs.videoplayer.ui.home

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import coil.load
import com.arrjs.videoplayer.R
import com.arrjs.videoplayer.data.model.Channel

class RecentChannelAdapter(
    private val onChannelClick: (Channel) -> Unit
) : RecyclerView.Adapter<RecentChannelAdapter.ViewHolder>() {

    private val items = ArrayList<Channel>()

    fun submitList(newItems: List<Channel>) {
        items.clear()
        items.addAll(newItems)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_channel_card, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val channel = items[position]
        holder.bind(channel)
    }

    override fun getItemCount(): Int = items.size

    inner class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val tvName: TextView = itemView.findViewById(R.id.tvChannelName)
        private val tvCategory: TextView = itemView.findViewById(R.id.tvCategoryTag)
        private val imgLogo: ImageView = itemView.findViewById(R.id.imgChannelLogo)
        private val imgFavorite: ImageView = itemView.findViewById(R.id.imgFavoriteBadge)

        fun bind(channel: Channel) {
            tvName.text = channel.name
            tvCategory.text = channel.categoryName
            imgFavorite.visibility = if (channel.isFavorite) View.VISIBLE else View.GONE

            if (!channel.logoUrl.isNullOrBlank()) {
                imgLogo.load(channel.logoUrl) {
                    crossfade(true)
                    placeholder(R.drawable.ic_tv_logo)
                    error(R.drawable.ic_tv_logo)
                }
            } else {
                imgLogo.setImageResource(R.drawable.ic_tv_logo)
            }

            itemView.setOnClickListener {
                onChannelClick(channel)
            }
        }
    }
}
