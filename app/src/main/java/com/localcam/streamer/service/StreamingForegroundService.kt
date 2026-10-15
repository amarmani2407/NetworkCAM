package com.localcam.streamer.service

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.net.wifi.WifiManager
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat
import com.localcam.streamer.LocalCamApplication
import com.localcam.streamer.R
import com.localcam.streamer.audio.AudioStreamer
import com.localcam.streamer.camera.CameraPipeline
import com.localcam.streamer.camera.FrameHub
import com.localcam.streamer.security.KeystoreManager
import com.localcam.streamer.server.KtorStreamingServer
import com.localcam.streamer.ui.MainActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class StreamingForegroundService : Service() {

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var wakeLock: PowerManager.WakeLock? = null
    private var wifiLock: WifiManager.WifiLock? = null

    private var ktorServer: KtorStreamingServer? = null
    private var audioStreamer: AudioStreamer? = null
    private var autoStopJob: Job? = null

    override fun onCreate() {
        super.onCreate()
        Log.i(TAG, "Creating StreamingForegroundService")
        acquireLocks()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action ?: ACTION_START
        when (action) {
            ACTION_STOP -> {
                Log.i(TAG, "Received STOP action via Intent")
                stopSelf()
                return START_NOT_STICKY
            }
            ACTION_START -> {
                startForegroundWithTypes()
                startStreamingPipeline()
            }
        }
        return START_NOT_STICKY
    }

    private fun startForegroundWithTypes() {
        val notification = buildNotification()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val foregroundServiceType = if (KeystoreManager.isAudioEnabled()) {
                ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA or ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
            } else {
                ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA
            }
            startForeground(NOTIFICATION_ID, notification, foregroundServiceType)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    private fun buildNotification(): Notification {
        val launchIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingLaunch = PendingIntent.getActivity(
            this, 0, launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val stopIntent = Intent(this, StreamingForegroundService::class.java).apply {
            action = ACTION_STOP
        }
        val pendingStop = PendingIntent.getService(
            this, 1, stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val port = KeystoreManager.getServerPort()
        return NotificationCompat.Builder(this, LocalCamApplication.NOTIFICATION_CHANNEL_ID)
            .setContentTitle(getString(R.string.notification_title))
            .setContentText("TLS Server running on port $port (HTTPS)")
            .setSmallIcon(android.R.drawable.presence_video_online)
            .setOngoing(true)
            .setContentIntent(pendingLaunch)
            .addAction(android.R.drawable.ic_media_pause, getString(R.string.action_stop), pendingStop)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build()
    }

    private fun acquireLocks() {
        try {
            val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
            wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "LocalCam::WakeLock").apply {
                setReferenceCounted(false)
                acquire(10 * 60 * 60 * 1000L) // 10 hour safety ceiling
            }

            val wifiManager = applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
            wifiLock = wifiManager.createWifiLock(
                WifiManager.WIFI_MODE_FULL_HIGH_PERF,
                "LocalCam::WifiLock"
            ).apply {
                setReferenceCounted(false)
                acquire()
            }
            Log.d(TAG, "Acquired WakeLock and HighPerf WifiLock")
        } catch (e: Exception) {
            Log.e(TAG, "Error acquiring system locks", e)
        }
    }

    private fun releaseLocks() {
        try {
            wakeLock?.let {
                if (it.isHeld) it.release()
            }
            wakeLock = null

            wifiLock?.let {
                if (it.isHeld) it.release()
            }
            wifiLock = null
            Log.d(TAG, "Released system locks")
        } catch (e: Exception) {
            Log.e(TAG, "Error releasing system locks", e)
        }
    }

    private fun startStreamingPipeline() {
        serviceScope.launch {
            try {
                // Ensure configured password exists before starting server
                val password = KeystoreManager.getHashedPassword()
                if (password.isNullOrEmpty()) {
                    Log.e(TAG, "Cannot start server: No password configured!")
                    stopSelf()
                    return@launch
                }

                // Start optional microphone audio streamer
                if (KeystoreManager.isAudioEnabled()) {
                    audioStreamer = AudioStreamer(applicationContext).also { it.startRecording() }
                }

                // Start Ktor TLS server
                val port = KeystoreManager.getServerPort()
                ktorServer = KtorStreamingServer(
                    context = applicationContext,
                    port = port,
                    frameHub = FrameHub,
                    audioStreamer = audioStreamer
                )
                ktorServer?.start()

                _isRunningFlow.value = true
                Log.i(TAG, "LocalCam server started successfully on port $port")

                // Auto-stop timer handler
                val autoStopMinutes = KeystoreManager.getAutoStopMinutes()
                if (autoStopMinutes > 0) {
                    autoStopJob?.cancel()
                    autoStopJob = serviceScope.launch {
                        delay(autoStopMinutes * 60 * 1000L)
                        Log.i(TAG, "Auto-stop timer elapsed ($autoStopMinutes mins). Stopping service.")
                        stopSelf()
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to start server pipeline", e)
                stopSelf()
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.i(TAG, "Destroying StreamingForegroundService, performing graceful shutdown")
        _isRunningFlow.value = false

        autoStopJob?.cancel()
        serviceScope.launch {
            ktorServer?.stop()
            ktorServer = null
        }

        audioStreamer?.stopRecording()
        audioStreamer = null

        FrameHub.clearSubscribers()
        CameraPipeline.unbindCamera()
        releaseLocks()

        serviceScope.cancel()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        private const val TAG = "StreamingService"
        const val NOTIFICATION_ID = 1001
        const val ACTION_START = "com.localcam.streamer.ACTION_START"
        const val ACTION_STOP = "com.localcam.streamer.ACTION_STOP"

        private val _isRunningFlow = MutableStateFlow(false)
        val isRunningFlow = _isRunningFlow.asStateFlow()

        fun startService(context: Context) {
            val intent = Intent(context, StreamingForegroundService::class.java).apply {
                action = ACTION_START
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stopService(context: Context) {
            val intent = Intent(context, StreamingForegroundService::class.java).apply {
                action = ACTION_STOP
            }
            context.startService(intent)
        }
    }
}
