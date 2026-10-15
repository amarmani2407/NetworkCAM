package com.localcam.streamer.camera

import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicInteger
import java.util.concurrent.atomic.AtomicLong

data class CameraFrame(
    val jpegData: ByteArray,
    val width: Int,
    val height: Int,
    val rotation: Int,
    val timestampMs: Long = System.currentTimeMillis()
)

data class ConnectedViewer(
    val id: String,
    val ipAddress: String,
    val userAgent: String,
    val connectedAtMs: Long = System.currentTimeMillis(),
    val framesDelivered: AtomicLong = new AtomicLong(0)
)

object FrameHub {
    private const val MAX_VIEWERS = 5

    // Conflated frame flow: replay=1, extraBufferCapacity=1, drops oldest frame for slow consumers
    private val _frameFlow = MutableSharedFlow<CameraFrame>(
        replay = 1,
        extraBufferCapacity = 1,
        onBufferOverflow = BufferOverflow.DROP_OLDEST
    )
    val frameFlow: SharedFlow<CameraFrame> = _frameFlow.asSharedFlow()

    private val connectedViewers = ConcurrentHashMap<String, ConnectedViewer>()
    private val frameCounter = AtomicInteger(0)
    private var lastFpsCalculationTime = System.currentTimeMillis()
    private var measuredFps: Double = 0.0
    private var latestFrame: CameraFrame? = null

    fun emitFrame(jpegData: ByteArray, width: Int, height: Int, rotation: Int) {
        val frame = CameraFrame(jpegData, width, height, rotation)
        latestFrame = frame
        _frameFlow.tryEmit(frame)

        // Calculate measured FPS
        val count = frameCounter.incrementAndGet()
        val now = System.currentTimeMillis()
        val elapsed = now - lastFpsCalculationTime
        if (elapsed >= 1000) {
            measuredFps = (count * 1000.0) / elapsed
            frameCounter.set(0)
            lastFpsCalculationTime = now
        }
    }

    fun getLatestSnapshot(): ByteArray? = latestFrame?.jpegData

    fun registerViewer(id: String, ip: String, userAgent: String): Boolean {
        if (connectedViewers.size >= MAX_VIEWERS) {
            return false
        }
        connectedViewers[id] = ConnectedViewer(id, ip, userAgent)
        return true
    }

    fun unregisterViewer(id: String) {
        connectedViewers.remove(id)
    }

    fun disconnectViewer(id: String): Boolean {
        return connectedViewers.remove(id) != null
    }

    fun getActiveViewers(): List<ConnectedViewer> = connectedViewers.values.toList()

    fun getViewerCount(): Int = connectedViewers.size

    fun getMeasuredFps(): Double = measuredFps

    fun clearSubscribers() {
        connectedViewers.clear()
        latestFrame = null
    }
}
