package com.arrjs.videoplayer.ui.search

import android.content.Intent
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.arrjs.videoplayer.R
import com.arrjs.videoplayer.TvPlayerApplication
import com.arrjs.videoplayer.ui.livetv.ChannelVerticalAdapter
import com.arrjs.videoplayer.ui.player.PlayerActivity
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class SearchActivity : AppCompatActivity() {

    private lateinit var etSearchQuery: EditText
    private lateinit var btnClearSearch: Button
    private lateinit var tvResultsCount: TextView
    private lateinit var rvSearchResults: RecyclerView

    private lateinit var channelAdapter: ChannelVerticalAdapter
    private var searchJob: Job? = null
    private var activePlaylistId: Long = 0

    private val app by lazy { application as TvPlayerApplication }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_search)

        initViews()
        loadPlaylist()
    }

    private fun initViews() {
        etSearchQuery = findViewById(R.id.etSearchQuery)
        btnClearSearch = findViewById(R.id.btnClearSearch)
        tvResultsCount = findViewById(R.id.tvResultsCount)
        rvSearchResults = findViewById(R.id.rvSearchResults)

        rvSearchResults.layoutManager = LinearLayoutManager(this)
        channelAdapter = ChannelVerticalAdapter(
            onChannelFocused = {},
            onChannelClicked = { channel ->
                val intent = Intent(this, PlayerActivity::class.java).apply {
                    putExtra(PlayerActivity.EXTRA_CHANNEL_ID, channel.id)
                }
                startActivity(intent)
            },
            onFavoriteToggled = { channel ->
                lifecycleScope.launch {
                    app.channelRepository.toggleFavorite(channel)
                }
            }
        )
        rvSearchResults.adapter = channelAdapter

        btnClearSearch.setOnClickListener {
            etSearchQuery.setText("")
            etSearchQuery.requestFocus()
        }

        etSearchQuery.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                performSearch(s.toString().trim())
            }
            override fun afterTextChanged(s: Editable?) {}
        })

        etSearchQuery.requestFocus()
    }

    private fun loadPlaylist() {
        lifecycleScope.launch {
            val active = app.playlistRepository.getActivePlaylist() ?: return@launch
            activePlaylistId = active.id
            performSearch("")
        }
    }

    private fun performSearch(query: String) {
        searchJob?.cancel()
        searchJob = lifecycleScope.launch {
            delay(150) // Debounce
            if (activePlaylistId == 0L) return@launch

            if (query.isEmpty()) {
                app.channelRepository.getChannelsByPlaylist(activePlaylistId).collectLatest { channels ->
                    channelAdapter.submitList(channels)
                    tvResultsCount.text = "${channels.size} channels"
                }
            } else {
                app.channelRepository.searchChannels(activePlaylistId, query).collectLatest { channels ->
                    channelAdapter.submitList(channels)
                    tvResultsCount.text = if (channels.isNotEmpty()) {
                        "Found ${channels.size} channels for \"$query\""
                    } else {
                        getString(R.string.search_no_results)
                    }
                }
            }
        }
    }
}
