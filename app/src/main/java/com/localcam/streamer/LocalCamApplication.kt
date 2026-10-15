package com.localcam.streamer

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import android.util.Log
import com.localcam.streamer.security.KeystoreManager
import com.localcam.streamer.security.TlsCertificateGenerator
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class LocalCamApplication : Application() {

    private val applicationScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    override fun onCreate() {
        super.onCreate()
        instance = this

        createNotificationChannels()
        initializeSecurityPrimitives()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                getString(R.string.notification_channel_name),
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = getString(R.string.notification_channel_desc)
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun initializeSecurityPrimitives() {
        applicationScope.launch {
            try {
                // Initialize EncryptedSharedPreferences and ensure secure password exists
                KeystoreManager.init(this@LocalCamApplication)
                
                // Ensure a unique RSA/EC self-signed TLS certificate exists in keystore
                if (!KeystoreManager.hasTlsCertificate()) {
                    Log.i(TAG, "Generating unique per-install TLS certificate...")
                    val keyStore = TlsCertificateGenerator.generateSelfSignedKeyStore(
                        context = this@LocalCamApplication,
                        alias = KeystoreManager.KEY_ALIAS_TLS,
                        password = KeystoreManager.getKeystorePassword()
                    )
                    KeystoreManager.saveTlsKeyStore(keyStore)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to initialize security primitives", e)
            }
        }
    }

    companion object {
        private const val TAG = "LocalCamApp"
        const val NOTIFICATION_CHANNEL_ID = "localcam_streaming_channel"
        lateinit var instance: LocalCamApplication
            private set
    }
}
