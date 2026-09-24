package com.arrjs.videoplayer.ui.vod

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

class VodMoviesActivity : AppCompatActivity() {

    private val app by lazy { application as TvPlayerApplication }
    private lateinit var rvMovies: RecyclerView
    private lateinit var categoryContainer: LinearLayout
    private lateinit var txtVodCount: TextView
    private lateinit var txtNoMovies: TextView
    private lateinit var movieAdapter: MovieGridAdapter

    private var allMovies: List<Channel> = emptyList()
    private var selectedCategory: String = "All"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_vod_movies)

        rvMovies = findViewById(R.id.rvMovies)
        categoryContainer = findViewById(R.id.categoryChipsContainer)
        txtVodCount = findViewById(R.id.txtVodCount)
        txtNoMovies = findViewById(R.id.txtNoMovies)

        findViewById<Button>(R.id.btnBackToLive).setOnClickListener {
            finish()
        }

        setupRecyclerView()
        loadMovies()
    }

    private fun setupRecyclerView() {
        rvMovies.layoutManager = GridLayoutManager(this, 5)
        movieAdapter = MovieGridAdapter { movie ->
            val intent = Intent(this, PlayerActivity::class.java).apply {
                putExtra(PlayerActivity.EXTRA_CHANNEL_ID, movie.id)
            }
            startActivity(intent)
        }
        rvMovies.adapter = movieAdapter
    }

    private fun loadMovies() {
        lifecycleScope.launch {
            val activePlaylist = app.playlistRepository.getActivePlaylist()
            var movies = if (activePlaylist != null) {
                app.database.channelDao().getChannelsByStreamType(activePlaylist.id, StreamType.VOD).firstOrNull() ?: emptyList()
            } else {
                emptyList()
            }

            // If no VOD movies present in active playlist, provide high-quality demo cinema items
            if (movies.isEmpty()) {
                movies = getDemoMovies(activePlaylist?.id ?: 1L)
            }

            allMovies = movies
            txtVodCount.text = "${allMovies.size} Movies available"
            txtNoMovies.visibility = if (allMovies.isEmpty()) View.VISIBLE else View.GONE

            setupCategories()
            filterMovies("All")
        }
    }

    private fun setupCategories() {
        categoryContainer.removeAllViews()

        val categories = ArrayList<String>().apply {
            add("All")
            addAll(allMovies.map { it.categoryName }.distinct().filter { it.isNotBlank() })
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
                    filterMovies(catName)
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

    private fun filterMovies(category: String) {
        val filtered = if (category.equals("All", ignoreCase = true)) {
            allMovies
        } else {
            allMovies.filter { it.categoryName.equals(category, ignoreCase = true) }
        }
        movieAdapter.submitList(filtered)
    }

    private fun getDemoMovies(playlistId: Long): List<Channel> {
        return listOf(
            Channel(
                playlistId = playlistId,
                name = "Big Buck Bunny 4K",
                streamUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                logoUrl = "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80",
                categoryName = "Animation & 4K",
                streamType = StreamType.VOD
            ),
            Channel(
                playlistId = playlistId,
                name = "Tears of Steel Sci-Fi",
                streamUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
                logoUrl = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80",
                categoryName = "Sci-Fi Cinema",
                streamType = StreamType.VOD
            ),
            Channel(
                playlistId = playlistId,
                name = "Sintel Open Movie",
                streamUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
                logoUrl = "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500&auto=format&fit=crop&q=80",
                categoryName = "Fantasy Adventure",
                streamType = StreamType.VOD
            ),
            Channel(
                playlistId = playlistId,
                name = "Elephants Dream UHD",
                streamUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
                logoUrl = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80",
                categoryName = "Sci-Fi Cinema",
                streamType = StreamType.VOD
            ),
            Channel(
                playlistId = playlistId,
                name = "We Are Going On Bullrun",
                streamUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
                logoUrl = "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80",
                categoryName = "Action & Thriller",
                streamType = StreamType.VOD
            ),
            Channel(
                playlistId = playlistId,
                name = "For Bigger Blazes UHD",
                streamUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                logoUrl = "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=500&auto=format&fit=crop&q=80",
                categoryName = "Action & Thriller",
                streamType = StreamType.VOD
            )
        )
    }

    private class MovieGridAdapter(
        private val onClick: (Channel) -> Unit
    ) : RecyclerView.Adapter<MovieGridAdapter.MovieViewHolder>() {

        private var items = listOf<Channel>()

        fun submitList(newItems: List<Channel>) {
            items = newItems
            notifyDataSetChanged()
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): MovieViewHolder {
            val view = LayoutInflater.from(parent.context).inflate(R.layout.item_vod_movie, parent, false)
            return MovieViewHolder(view)
        }

        override fun onBindViewHolder(holder: MovieViewHolder, position: Int) {
            val movie = items[position]
            holder.txtTitle.text = movie.name
            holder.txtCategory.text = movie.categoryName

            if (!movie.logoUrl.isNullOrEmpty()) {
                holder.imgPoster.load(movie.logoUrl) {
                    crossfade(true)
                    placeholder(R.drawable.bg_tv_hero_banner)
                    error(R.drawable.bg_tv_hero_banner)
                }
            } else {
                holder.imgPoster.setImageResource(R.drawable.bg_tv_hero_banner)
            }

            holder.itemView.setOnClickListener { onClick(movie) }
        }

        override fun getItemCount(): Int = items.size

        class MovieViewHolder(view: View) : RecyclerView.ViewHolder(view) {
            val imgPoster: ImageView = view.findViewById(R.id.imgMoviePoster)
            val txtTitle: TextView = view.findViewById(R.id.txtMovieTitle)
            val txtCategory: TextView = view.findViewById(R.id.txtMovieCategory)
        }
    }
}
