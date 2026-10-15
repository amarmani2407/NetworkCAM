package com.localcam.streamer.ui

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
import com.localcam.streamer.ui.screens.PrivacyNoticeDialog
import com.localcam.streamer.ui.screens.StreamScreen
import com.localcam.streamer.ui.theme.LocalCamTheme

class MainActivity : ComponentActivity() {

    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            LocalCamTheme {
                var showPrivacyNotice by remember { mutableStateOf(false) }
                var permissionsGranted by remember { mutableStateOf(false) }

                val permissionLauncher = rememberLauncherForActivityResult(
                    ActivityResultContracts.RequestMultiplePermissions()
                ) { result ->
                    permissionsGranted = result[Manifest.permission.CAMERA] == true
                }

                LaunchedEffect(Unit) {
                    val permissions = mutableListOf(Manifest.permission.CAMERA)
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        permissions.add(Manifest.permission.POST_NOTIFICATIONS)
                    }
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        permissions.add(Manifest.permission.RECORD_AUDIO)
                    }

                    val allGranted = permissions.all {
                        ContextCompat.checkSelfPermission(this@MainActivity, it) == PackageManager.PERMISSION_GRANTED
                    }

                    if (!allGranted) {
                        permissionLauncher.launch(permissions.toTypedArray())
                    } else {
                        permissionsGranted = true
                    }
                }

                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    StreamScreen(
                        viewModel = viewModel,
                        lifecycleOwner = this
                    )

                    if (showPrivacyNotice) {
                        PrivacyNoticeDialog(onDismiss = { showPrivacyNotice = false })
                    }
                }
            }
        }
    }
}
