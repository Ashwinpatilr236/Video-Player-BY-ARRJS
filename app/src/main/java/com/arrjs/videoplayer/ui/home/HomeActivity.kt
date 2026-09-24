package com.arrjs.videoplayer.ui.home

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.arrjs.videoplayer.R
import com.arrjs.videoplayer.TvPlayerApplication
import com.arrjs.videoplayer.data.model.Channel
import com.arrjs.videoplayer.ui.livetv.LiveTvActivity
import com.arrjs.videoplayer.ui.player.PlayerActivity
import com.arrjs.videoplayer.ui.search.SearchActivity
import com.arrjs.videoplayer.ui.settings.SettingsActivity
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class HomeActivity : AppCompatActivity() {

    private lateinit var scrollHomeContent: View
    private lateinit var layoutEmptyHome: View
    private lateinit var btnEmptyAddPlaylist: View
    private lateinit var btnEmptyOpenSettings: View

    private lateinit var layoutFavoritesSection: View
    private lateinit var rvFavorites: RecyclerView
    private lateinit var favoriteAdapter: RecentChannelAdapter

    private lateinit var rvRecentlyWatched: RecyclerView
    private lateinit var rvCategories: RecyclerView
    private lateinit var tvRecentTitle: TextView

    private lateinit var recentAdapter: RecentChannelAdapter
    private lateinit var categoryAdapter: CategoryCardAdapter

    private val app by lazy { application as TvPlayerApplication }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_home)

        initViews()
        setupNavigationButtons()
    }

    override fun onResume() {
        super.onResume()
        observeData()
    }

    private lateinit var cardHeroBanner: View
    private lateinit var tvHeroTitle: TextView
    private lateinit var tvHeroSubtitle: TextView
    private var heroChannelId: Long = 0

    private fun initViews() {
        scrollHomeContent = findViewById(R.id.scrollHomeContent)
        layoutEmptyHome = findViewById(R.id.layoutEmptyHome)
        btnEmptyAddPlaylist = findViewById(R.id.btnEmptyAddPlaylist)
        btnEmptyOpenSettings = findViewById(R.id.btnEmptyOpenSettings)

        btnEmptyAddPlaylist.setOnClickListener {
            startActivity(Intent(this, com.arrjs.videoplayer.ui.settings.SettingsHubActivity::class.java))
        }

        btnEmptyOpenSettings.setOnClickListener {
            startActivity(Intent(this, com.arrjs.videoplayer.ui.settings.SettingsHubActivity::class.java))
        }

        cardHeroBanner = findViewById(R.id.cardHeroBanner)
        tvHeroTitle = findViewById(R.id.tvHeroTitle)
        tvHeroSubtitle = findViewById(R.id.tvHeroSubtitle)

        cardHeroBanner.setOnClickListener {
            if (heroChannelId > 0) {
                openPlayer(heroChannelId)
            } else {
                startActivity(Intent(this, LiveTvActivity::class.java))
            }
        }

        // Favorites Row
        layoutFavoritesSection = findViewById(R.id.layoutFavoritesSection)
        rvFavorites = findViewById(R.id.rvFavorites)
        rvFavorites.layoutManager = LinearLayoutManager(this, LinearLayoutManager.HORIZONTAL, false)
        favoriteAdapter = RecentChannelAdapter { channel ->
            openPlayer(channel.id)
        }
        rvFavorites.adapter = favoriteAdapter

        // Recently Watched Row
        tvRecentTitle = findViewById(R.id.tvSectionRecentTitle)
        rvRecentlyWatched = findViewById(R.id.rvRecentlyWatched)
        rvRecentlyWatched.layoutManager =
            LinearLayoutManager(this, LinearLayoutManager.HORIZONTAL, false)
        recentAdapter = RecentChannelAdapter { channel ->
            openPlayer(channel.id)
        }
        rvRecentlyWatched.adapter = recentAdapter

        // Categories Row
        rvCategories = findViewById(R.id.rvCategories)
        rvCategories.layoutManager =
            LinearLayoutManager(this, LinearLayoutManager.HORIZONTAL, false)
        categoryAdapter = CategoryCardAdapter { category ->
            val intent = Intent(this, LiveTvActivity::class.java).apply {
                putExtra(LiveTvActivity.EXTRA_CATEGORY_NAME, category.categoryName)
            }
            startActivity(intent)
        }
        rvCategories.adapter = categoryAdapter
    }

    private fun setupNavigationButtons() {
        findViewById<View>(R.id.btnNavLiveTv).setOnClickListener {
            startActivity(Intent(this, LiveTvActivity::class.java))
        }

        findViewById<View>(R.id.btnNavFavorites).setOnClickListener {
            val intent = Intent(this, LiveTvActivity::class.java).apply {
                putExtra(LiveTvActivity.EXTRA_SHOW_FAVORITES, true)
            }
            startActivity(intent)
        }

        findViewById<View>(R.id.btnNavSearch).setOnClickListener {
            startActivity(Intent(this, SearchActivity::class.java))
        }

        findViewById<View>(R.id.btnNavSettings).setOnClickListener {
            startActivity(Intent(this, com.arrjs.videoplayer.ui.settings.SettingsHubActivity::class.java))
        }

        // Set initial focus to Live TV button on TV launch
        findViewById<View>(R.id.btnNavLiveTv).requestFocus()
    }

    private fun observeData() {
        lifecycleScope.launch {
            val activePlaylist = app.playlistRepository.getActivePlaylist()
            if (activePlaylist == null) {
                showEmptyState(true)
                return@launch
            }

            val channelCount = app.channelRepository.getChannelCountByPlaylist(activePlaylist.id)
            if (channelCount == 0) {
                showEmptyState(true)
                return@launch
            }

            showEmptyState(false)
            val playlistId = activePlaylist.id
            findViewById<TextView>(R.id.tvActivePlaylistName)?.text = activePlaylist.name

            // 1. Observe Favorites Row
            launch {
                app.channelRepository.getFavoriteChannels(playlistId).collectLatest { favList ->
                    if (favList.isNotEmpty()) {
                        favoriteAdapter.submitList(favList)
                        layoutFavoritesSection.visibility = View.VISIBLE
                    } else {
                        layoutFavoritesSection.visibility = View.GONE
                    }
                }
            }

            // 2. Observe Categories
            launch {
                app.channelRepository.getCategoriesByPlaylist(playlistId).collectLatest { categories ->
                    categoryAdapter.submitList(categories)
                }
            }

            // 3. Observe Recent / Channels
            launch {
                app.watchHistoryRepository.getRecentHistory().collectLatest { historyList ->
                    if (historyList.isNotEmpty()) {
                        tvRecentTitle.text = getString(R.string.section_recently_watched)
                        val channels = historyList.map { item ->
                            Channel(
                                id = item.channelId,
                                playlistId = item.playlistId,
                                name = item.name,
                                streamUrl = item.streamUrl,
                                logoUrl = item.logoUrl,
                                categoryName = item.categoryName
                            )
                        }
                        recentAdapter.submitList(channels)
                        rvRecentlyWatched.visibility = View.VISIBLE
                    } else {
                        // Fallback to top channels in playlist
                        app.channelRepository.getChannelsByPlaylist(playlistId).collectLatest { allChannels ->
                            tvRecentTitle.text = "Featured Streams"
                            recentAdapter.submitList(allChannels.take(15))
                            if (allChannels.isNotEmpty()) {
                                val top = allChannels.first()
                                heroChannelId = top.id
                                tvHeroTitle.text = top.name
                                tvHeroSubtitle.text = "${top.categoryName} • Press OK to Watch Live"
                            }
                        }
                    }
                }
            }
        }
    }

    private fun showEmptyState(isEmpty: Boolean) {
        if (isEmpty) {
            scrollHomeContent.visibility = View.GONE
            layoutEmptyHome.visibility = View.VISIBLE
            findViewById<TextView>(R.id.tvActivePlaylistName)?.text = "No Playlist"
            btnEmptyAddPlaylist.requestFocus()
        } else {
            scrollHomeContent.visibility = View.VISIBLE
            layoutEmptyHome.visibility = View.GONE
        }
    }

    private fun openPlayer(channelId: Long) {
        val intent = Intent(this, PlayerActivity::class.java).apply {
            putExtra(PlayerActivity.EXTRA_CHANNEL_ID, channelId)
        }
        startActivity(intent)
    }
}
