package com.arrjs.videoplayer.ui.settings

import android.app.AlertDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.arrjs.videoplayer.R
import com.arrjs.videoplayer.TvPlayerApplication
import com.arrjs.videoplayer.utils.SampleDataGenerator
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class SettingsActivity : AppCompatActivity() {

    private val app by lazy { application as TvPlayerApplication }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_settings)

        findViewById<Button>(R.id.btnAddM3u).setOnClickListener {
            showAddM3uDialog()
        }

        findViewById<Button>(R.id.btnAddXtream).setOnClickListener {
            showAddXtreamDialog()
        }

        findViewById<Button>(R.id.btnResetSampleStreams).setOnClickListener {
            lifecycleScope.launch {
                SampleDataGenerator.populateDemoPlaylistIfEmpty(app.database)
                Toast.makeText(this@SettingsActivity, R.string.sample_playlist_loaded, Toast.LENGTH_SHORT).show()
            }
        }

        findViewById<Button>(R.id.btnClearData).setOnClickListener {
            lifecycleScope.launch {
                app.watchHistoryRepository.clearHistory()
                Toast.makeText(this@SettingsActivity, "Watch history cleared", Toast.LENGTH_SHORT).show()
            }
        }

        findViewById<Button>(R.id.btnAddM3u).requestFocus()
    }

    private fun showAddM3uDialog() {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_add_m3u, null)
        val etName = dialogView.findViewById<EditText>(R.id.etPlaylistName)
        val etUrl = dialogView.findViewById<EditText>(R.id.etPlaylistUrl)
        val btnCancel = dialogView.findViewById<Button>(R.id.btnCancel)
        val btnSave = dialogView.findViewById<Button>(R.id.btnSaveM3u)

        val dialog = AlertDialog.Builder(this)
            .setView(dialogView)
            .create()

        btnCancel.setOnClickListener { dialog.dismiss() }

        btnSave.setOnClickListener {
            val name = etName.text.toString().trim()
            val url = etUrl.text.toString().trim()

            if (name.isEmpty() || url.isEmpty()) {
                Toast.makeText(this, "Please enter both name and URL", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            btnSave.isEnabled = false
            btnSave.text = "Loading..."

            lifecycleScope.launch {
                val result = app.playlistRepository.importM3UFromUrl(name, url)
                withContext(Dispatchers.Main) {
                    dialog.dismiss()
                    if (result.isSuccess) {
                        Toast.makeText(this@SettingsActivity, "Playlist imported successfully", Toast.LENGTH_LONG).show()
                    } else {
                        Toast.makeText(this@SettingsActivity, "Failed: ${result.exceptionOrNull()?.message}", Toast.LENGTH_LONG).show()
                    }
                }
            }
        }

        dialog.show()
    }

    private fun showAddXtreamDialog() {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_add_xtream, null)
        val etName = dialogView.findViewById<EditText>(R.id.etXtreamName)
        val etServer = dialogView.findViewById<EditText>(R.id.etXtreamServer)
        val etUser = dialogView.findViewById<EditText>(R.id.etXtreamUsername)
        val etPass = dialogView.findViewById<EditText>(R.id.etXtreamPassword)
        val btnCancel = dialogView.findViewById<Button>(R.id.btnCancelXtream)
        val btnConnect = dialogView.findViewById<Button>(R.id.btnConnectXtream)

        val dialog = AlertDialog.Builder(this)
            .setView(dialogView)
            .create()

        btnCancel.setOnClickListener { dialog.dismiss() }

        btnConnect.setOnClickListener {
            val name = etName.text.toString().trim()
            val server = etServer.text.toString().trim()
            val user = etUser.text.toString().trim()
            val pass = etPass.text.toString().trim()

            if (name.isEmpty() || server.isEmpty() || user.isEmpty() || pass.isEmpty()) {
                Toast.makeText(this, "Please fill in all fields", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            btnConnect.isEnabled = false
            btnConnect.text = "Connecting..."

            // Securely save credentials
            app.secureStorage.saveCredential("xtream_pass_$user", pass)

            lifecycleScope.launch {
                val result = app.playlistRepository.importXtreamCodes(name, server, user, pass)
                withContext(Dispatchers.Main) {
                    dialog.dismiss()
                    if (result.isSuccess) {
                        Toast.makeText(this@SettingsActivity, "Xtream playlist connected!", Toast.LENGTH_LONG).show()
                    } else {
                        Toast.makeText(this@SettingsActivity, "Error: ${result.exceptionOrNull()?.message}", Toast.LENGTH_LONG).show()
                    }
                }
            }
        }

        dialog.show()
    }
}
