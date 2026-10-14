package com.localcam.streamer.ui

import android.app.Application
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.ConnectivityManager
import android.net.LinkProperties
import android.net.Network
import android.net.NetworkCapabilities
import android.net.wifi.WifiManager
import android.os.BatteryManager
import android.os.PowerManager
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.localcam.streamer.camera.CameraPipeline
import com.localcam.streamer.camera.ConnectedViewer
import com.localcam.streamer.camera.FrameHub
import com.localcam.streamer.security.KeystoreManager
import com.localcam.streamer.service.StreamingForegroundService
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.net.Inet4Address
import java.net.NetworkInterface

class MainViewModel(application: Application) : AndroidViewModel(application) {

    val isRunning: StateFlow<Boolean> = StreamingForegroundService.isRunningFlow

    private val _localIpAddress = MutableStateFlow(detectLocalWifiIp())
    val localIpAddress: StateFlow<String> = _localIpAddress.asStateFlow()

    private val _currentPassword = MutableStateFlow(KeystoreManager.getInitialGeneratedPassword() ?: "••••••••••••")
    val currentPassword: StateFlow<String> = _currentPassword.asStateFlow()

    private val _certFingerprint = MutableStateFlow(KeystoreManager.getCertFingerprint())
    val certFingerprint: StateFlow<String> = _certFingerprint.asStateFlow()

    private val _activeViewers = MutableStateFlow<List<ConnectedViewer>>(emptyList())
    val activeViewers: StateFlow<List<ConnectedViewer>> = _activeViewers.asStateFlow()

    private val _batteryLevel = MutableStateFlow(getBatteryCapacity())
    val batteryLevel: StateFlow<Int> = _batteryLevel.asStateFlow()

    private val _measuredFps = MutableStateFlow(0.0)
    val measuredFps: StateFlow<Double> = _measuredFps.asStateFlow()

    private val connectivityManager =
        application.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager

    init {
        registerNetworkCallback()
        startPeriodicTelemetry()
    }

    private fun registerNetworkCallback() {
        val networkCallback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                _localIpAddress.value = detectLocalWifiIp()
            }
            override fun onLost(network: Network) {
                _localIpAddress.value = detectLocalWifiIp()
            }
            override fun onLinkPropertiesChanged(network: Network, linkProperties: LinkProperties) {
                _localIpAddress.value = detectLocalWifiIp()
            }
        }
        try {
            connectivityManager.registerDefaultNetworkCallback(networkCallback)
        } catch (e: Exception) {
            // Fallback to initial value
        }
    }

    private fun startPeriodicTelemetry() {
        viewModelScope.launch {
            while (isActive) {
                _activeViewers.value = FrameHub.getActiveViewers()
                _measuredFps.value = FrameHub.getMeasuredFps()
                _batteryLevel.value = getBatteryCapacity()
                _certFingerprint.value = KeystoreManager.getCertFingerprint()
                delay(1000)
            }
        }
    }

    fun toggleStreaming() {
        val context = getApplication<Application>()
        if (isRunning.value) {
            StreamingForegroundService.stopService(context)
        } else {
            StreamingForegroundService.startService(context)
        }
    }

    fun disconnectViewer(viewerId: String) {
        FrameHub.disconnectViewer(viewerId)
        _activeViewers.value = FrameHub.getActiveViewers()
    }

    fun updatePassword(newPassword: String): Boolean {
        val success = KeystoreManager.setPassword(newPassword)
        if (success) {
            _currentPassword.value = newPassword
        }
        return success
    }

    private fun detectLocalWifiIp(): String {
        try {
            val interfaces = NetworkInterface.getNetworkInterfaces()
            while (interfaces.hasMoreElements()) {
                val networkInterface = interfaces.nextElement()
                if (networkInterface.isLoopback || !networkInterface.isUp) continue

                val addresses = networkInterface.inetAddresses
                while (addresses.hasMoreElements()) {
                    val address = addresses.nextElement()
                    if (!address.isLoopbackAddress && address is Inet4Address) {
                        val host = address.hostAddress
                        if (host != null && (host.startsWith("192.168.") || host.startsWith("10.") || host.startsWith("172."))) {
                            return host
                        }
                    }
                }
            }
        } catch (e: Exception) {}
        return "127.0.0.1"
    }

    private fun getBatteryCapacity(): Int {
        val context = getApplication<Application>()
        val bm = context.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
        return bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
    }

    fun getStreamUrl(): String {
        val ip = localIpAddress.value
        val port = KeystoreManager.getServerPort()
        return "https://$ip:$port"
    }
}
