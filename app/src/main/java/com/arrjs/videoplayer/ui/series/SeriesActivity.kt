package com.arrjs.videoplayer.ui.series

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.RecyclerView
import android.content.Intent
import com.arrjs.videoplayer.R
import com.arrjs.videoplayer.TvPlayerApplication
import com.arrjs.videoplayer.data.model.Channel
import com.arrjs.videoplayer.data.model.StreamType
import com.arrjs.videoplayer.ui.player.PlayerActivity
import coil.load
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch

class SeriesActivity : AppCompatActivity() {

    private val app by lazy { application as TvPlayerApplication }
    private lateinit var rvSeries: RecyclerView
    private lateinit var categoryContainer: LinearLayout
    private lateinit var txtSeriesCount: TextView
    private lateinit var txtNoSeries: TextView
    private lateinit var seriesAdapter: SeriesGridAdapter

    private var allSeries: List<Channel> = emptyList()
    private var selectedCategory: String = "All"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_series)

        rvSeries = findViewById(R.id.rvSeries)
        categoryContainer = findViewById(R.id.seriesCategoryChips)
        txtSeriesCount = findViewById(R.id.txtSeriesCount)
        txtNoSeries = findViewById(R.id.txtNoSeries)

        findViewById<Button>(R.id.btnBackToLiveFromSeries).setOnClickListener {
            finish()
        }

        setupRecyclerView()
        loadSeries()
    }

    private fun setupRecyclerView() {
        rvSeries.layoutManager = GridLayoutManager(this, 5)
        seriesAdapter = SeriesGridAdapter { item ->
            val intent = Intent(this, PlayerActivity::class.java).apply {
                putExtra(PlayerActivity.EXTRA_CHANNEL_ID, item.id)
            }
            startActivity(intent)
        }
        rvSeries.adapter = seriesAdapter
    }

    private fun loadSeries() {
        lifecycleScope.launch {
            val activePlaylist = app.playlistRepository.getActivePlaylist()
            var series = if (activePlaylist != null) {
                app.database.channelDao().getChannelsByStreamType(activePlaylist.id, StreamType.SERIES).firstOrNull() ?: emptyList()
            } else {
                emptyList()
            }

            // If no series present in active playlist, provide demo high-profile series
            if (series.isEmpty()) {
                series = getDemoSeries(activePlaylist?.id ?: 1L)
            }

            allSeries = series
            txtSeriesCount.text = "${allSeries.size} TV Series available"
            txtNoSeries.visibility = if (allSeries.isEmpty()) View.VISIBLE else View.GONE

            setupCategories()
            filterSeries("All")
        }
    }

    private fun setupCategories() {
        categoryContainer.removeAllViews()

        val categories = ArrayList<String>().apply {
            add("All")
            addAll(allSeries.map { it.categoryName }.distinct().filter { it.isNotBlank() })
        }

        categories.forEach { catName ->
            val chip = Button(this).apply {
                val heightPx = (46 * resources.displayMetrics.density).toInt()
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    heightPx
                ).apply {
                    marginEnd = 12
                }
                text = catName
                textSize = 12f
                setTextColor(if (catName == selectedCategory) 0xFF00E5FF.toInt() else 0xFF90A4AE.toInt())
                background = getDrawable(R.drawable.bg_tv_button)
                isFocusable = true
                setOnClickListener {
                    selectedCategory = catName
                    updateCategorySelection()
                    filterSeries(catName)
                }
            }
            categoryContainer.addView(chip)
        }
    }

    private fun updateCategorySelection() {
        for (i in 0 until categoryContainer.childCount) {
            val child = categoryContainer.getChildAt(i) as? Button ?: continue
            val isSelected = child.text.toString().equals(selectedCategory, ignoreCase = true)
            child.setTextColor(if (isSelected) 0xFF00E5FF.toInt() else 0xFF90A4AE.toInt())
        }
    }

    private fun filterSeries(category: String) {
        val filtered = if (category.equals("All", ignoreCase = true)) {
            allSeries
        } else {
            allSeries.filter { it.categoryName.equals(category, ignoreCase = true) }
        }
        seriesAdapter.submitList(filtered)
    }

    private fun getDemoSeries(playlistId: Long): List<Channel> {
        return listOf(
            Channel(
                playlistId = playlistId,
                name = "Cosmos: A Spacetime Odyssey (S01)",
                streamUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                logoUrl = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&auto=format&fit=crop&q=80",
                categoryName = "Documentary & Science",
                streamType = StreamType.SERIES
            ),
            Channel(
                playlistId = playlistId,
                name = "The Cyber Frontier (S02)",
                streamUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
                logoUrl = "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=80",
                categoryName = "Sci-Fi & Tech",
                streamType = StreamType.SERIES
            ),
            Channel(
                playlistId = playlistId,
                name = "Deep Ocean Mysteries (S01)",
                streamUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
                logoUrl = "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=500&auto=format&fit=crop&q=80",
                categoryName = "Documentary & Science",
                streamType = StreamType.SERIES
            ),
            Channel(
                playlistId = playlistId,
                name = "Tokyo Neon Stories (S03)",
                streamUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
                logoUrl = "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=500&auto=format&fit=crop&q=80",
                categoryName = "Drama & Crime",
                streamType = StreamType.SERIES
            )
        )
    }

    private class SeriesGridAdapter(
        private val onClick: (Channel) -> Unit
    ) : RecyclerView.Adapter<SeriesGridAdapter.SeriesViewHolder>() {

        private var items = listOf<Channel>()

        fun submitList(newItems: List<Channel>) {
            items = newItems
            notifyDataSetChanged()
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): SeriesViewHolder {
            val view = LayoutInflater.from(parent.context).inflate(R.layout.item_vod_movie, parent, false)
            return SeriesViewHolder(view)
        }

        override fun onBindViewHolder(holder: SeriesViewHolder, position: Int) {
            val item = items[position]
            holder.txtTitle.text = item.name
            holder.txtCategory.text = item.categoryName
            holder.txtBadge.text = "SERIES"

            if (!item.logoUrl.isNullOrEmpty()) {
                holder.imgPoster.load(item.logoUrl) {
                    crossfade(true)
                    placeholder(R.drawable.bg_tv_hero_banner)
                    error(R.drawable.bg_tv_hero_banner)
                }
            } else {
                holder.imgPoster.setImageResource(R.drawable.bg_tv_hero_banner)
            }

            holder.itemView.setOnClickListener { onClick(item) }
        }

        override fun getItemCount(): Int = items.size

        class SeriesViewHolder(view: View) : RecyclerView.ViewHolder(view) {
            val imgPoster: ImageView = view.findViewById(R.id.imgMoviePoster)
            val txtTitle: TextView = view.findViewById(R.id.txtMovieTitle)
            val txtCategory: TextView = view.findViewById(R.id.txtMovieCategory)
            val txtBadge: TextView = view.findViewById(R.id.txtMovieBadge)
        }
    }
}
