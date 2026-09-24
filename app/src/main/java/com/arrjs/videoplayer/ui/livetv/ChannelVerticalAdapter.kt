package com.arrjs.videoplayer.ui.livetv

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import coil.load
import com.arrjs.videoplayer.R
import com.arrjs.videoplayer.data.model.Channel

class ChannelVerticalAdapter(
    private val onChannelFocused: (Channel) -> Unit,
    private val onChannelClicked: (Channel) -> Unit,
    private val onFavoriteToggled: (Channel) -> Unit,
    private val epgProgramProvider: ((Channel) -> String?)? = null
) : RecyclerView.Adapter<ChannelVerticalAdapter.ViewHolder>() {

    private val items = ArrayList<Channel>()

    fun submitList(newItems: List<Channel>) {
        items.clear()
        items.addAll(newItems)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_channel_vertical, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(items[position], position)
    }

    override fun getItemCount(): Int = items.size

    inner class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val tvNum: TextView = itemView.findViewById(R.id.tvChannelNum)
        private val tvName: TextView = itemView.findViewById(R.id.tvChannelName)
        private val tvProgram: TextView = itemView.findViewById(R.id.tvProgramTitle)
        private val imgLogo: ImageView = itemView.findViewById(R.id.imgChannelLogo)
        private val btnFav: ImageView = itemView.findViewById(R.id.btnFavorite)

        fun bind(channel: Channel, position: Int) {
            tvNum.text = if (channel.num > 0) channel.num.toString() else (position + 1).toString()
            tvName.text = channel.name
            val progTitle = epgProgramProvider?.invoke(channel)
            tvProgram.text = if (!progTitle.isNullOrBlank()) progTitle else channel.categoryName

            btnFav.setImageResource(
                if (channel.isFavorite) R.drawable.ic_favorite_filled else R.drawable.ic_favorite_border
            )

            if (!channel.logoUrl.isNullOrBlank()) {
                imgLogo.load(channel.logoUrl) {
                    crossfade(true)
                    placeholder(R.drawable.ic_modern_channel)
                    error(R.drawable.ic_modern_channel)
                }
            } else {
                imgLogo.setImageResource(R.drawable.ic_modern_channel)
            }

            com.arrjs.videoplayer.utils.TvAnimationUtils.attachTvFocusFeedback(itemView, scale = 1.035f, elevationDp = 8f) { hasFocus ->
                if (hasFocus) {
                    onChannelFocused(channel)
                }
            }

            itemView.setOnClickListener {
                onChannelClicked(channel)
            }

            btnFav.setOnClickListener {
                onFavoriteToggled(channel)
            }
        }
    }
}
