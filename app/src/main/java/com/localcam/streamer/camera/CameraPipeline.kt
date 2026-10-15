package com.localcam.streamer.camera

import android.content.Context
import android.graphics.ImageFormat
import android.graphics.Rect
import android.graphics.YuvImage
import android.util.Log
import android.util.Size
import androidx.camera.core.Camera
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import com.localcam.streamer.security.KeystoreManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.io.ByteArrayOutputStream
import java.nio.ByteBuffer
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

object CameraPipeline {
    private const val TAG = "CameraPipeline"

    private val cameraExecutor: ExecutorService = Executors.newSingleThreadExecutor()
    private var cameraProvider: ProcessCameraProvider? = null
    private var camera: Camera? = null

    private var lensFacing = CameraSelector.LENS_FACING_BACK
    private var currentResolutionPreset = "720p" // 480p, 720p, 1080p
    private var jpegQuality = 75

    private val _torchState = MutableStateFlow(false)
    val torchState = _torchState.asStateFlow()

    private val _currentLens = MutableStateFlow("BACK")
    val currentLens = _currentLens.asStateFlow()

    private val _currentResolution = MutableStateFlow("720p")
    val currentResolution = _currentResolution.asStateFlow()

    fun bindCamera(
        context: Context,
        lifecycleOwner: LifecycleOwner,
        surfaceProvider: Preview.SurfaceProvider? = null
    ) {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
        cameraProviderFuture.addListener({
            try {
                cameraProvider = cameraProviderFuture.get()
                rebindUseCases(lifecycleOwner, surfaceProvider)
            } catch (e: Exception) {
                Log.e(TAG, "Use case binding failed", e)
            }
        }, ContextCompat.getMainExecutor(context))
    }

    fun unbindCamera() {
        cameraProvider?.unbindAll()
        camera = null
        _torchState.value = false
    }

    private fun rebindUseCases(
        lifecycleOwner: LifecycleOwner,
        surfaceProvider: Preview.SurfaceProvider?
    ) {
        val provider = cameraProvider ?: return
        provider.unbindAll()

        val targetSize = when (currentResolutionPreset) {
            "480p" -> Size(640, 480)
            "1080p" -> Size(1920, 1080)
            else -> Size(1280, 720)
        }

        val cameraSelector = CameraSelector.Builder()
            .requireLensFacing(lensFacing)
            .build()

        val imageAnalysis = ImageAnalysis.Builder()
            .setTargetResolution(targetSize)
            .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
            .setOutputImageFormat(ImageAnalysis.OUTPUT_IMAGE_FORMAT_YUV_420_888)
            .build()

        imageAnalysis.setAnalyzer(cameraExecutor) { imageProxy ->
            processImageProxy(imageProxy)
        }

        val useCases = mutableListOf<androidx.camera.core.UseCase>(imageAnalysis)

        // Optional UI preview
        if (surfaceProvider != null) {
            val preview = Preview.Builder()
                .setTargetResolution(targetSize)
                .build()
            preview.setSurfaceProvider(surfaceProvider)
            useCases.add(preview)
        }

        try {
            camera = provider.bindToLifecycle(
                lifecycleOwner,
                cameraSelector,
                *useCases.toTypedArray()
            )
            _currentLens.value = if (lensFacing == CameraSelector.LENS_FACING_BACK) "BACK" else "FRONT"
            _currentResolution.value = currentResolutionPreset
        } catch (e: Exception) {
            Log.e(TAG, "Binding use cases failed", e)
        }
    }

    private fun processImageProxy(image: ImageProxy) {
        try {
            if (image.format != ImageFormat.YUV_420_888) {
                image.close()
                return
            }

            val nv21Bytes = yuv420888ToNv21(image)
            val rotationDegrees = image.imageInfo.rotationDegrees
            val width = image.width
            val height = image.height

            val yuvImage = YuvImage(nv21Bytes, ImageFormat.NV21, width, height, null)
            val outputStream = ByteArrayOutputStream()
            val cropRect = Rect(0, 0, width, height)

            val quality = jpegQuality.coerceIn(30, 95)
            yuvImage.compressToJpeg(cropRect, quality, outputStream)
            val jpegBytes = outputStream.toByteArray()

            // Pass to conflated frame hub for distribution
            FrameHub.emitFrame(jpegBytes, width, height, rotationDegrees)
        } catch (e: Exception) {
            Log.e(TAG, "Error converting image frame", e)
        } finally {
            image.close()
        }
    }

    private fun yuv420888ToNv21(image: ImageProxy): ByteArray {
        val yPlane = image.planes[0]
        val uPlane = image.planes[1]
        val vPlane = image.planes[2]

        val yBuffer = yPlane.buffer
        val uBuffer = uPlane.buffer
        val vBuffer = vPlane.buffer

        val numPixels = image.width * image.height
        val nv21 = ByteArray(numPixels * 3 / 2)

        // Y plane copy
        var outputIndex = 0
        val yRowStride = yPlane.rowStride
        val yPixelStride = yPlane.pixelStride

        if (yPixelStride == 1 && yRowStride == image.width) {
            yBuffer.get(nv21, 0, numPixels)
            outputIndex = numPixels
        } else {
            var yOffset = 0
            for (row in 0 until image.height) {
                yBuffer.position(row * yRowStride)
                yBuffer.get(nv21, outputIndex, image.width)
                outputIndex += image.width
            }
        }

        // UV plane interleaving into NV21 (V then U)
        val uvHeight = image.height / 2
        val uvWidth = image.width / 2
        val uRowStride = uPlane.rowStride
        val vRowStride = vPlane.rowStride
        val uPixelStride = uPlane.pixelStride
        val vPixelStride = vPlane.pixelStride

        for (row in 0 until uvHeight) {
            for (col in 0 until uvWidth) {
                val vPos = row * vRowStride + col * vPixelStride
                val uPos = row * uRowStride + col * uPixelStride
                nv21[outputIndex++] = vBuffer.get(vPos)
                nv21[outputIndex++] = uBuffer.get(uPos)
            }
        }

        return nv21
    }

    fun setTorch(enabled: Boolean): Boolean {
        val cam = camera ?: return false
        if (!cam.cameraInfo.hasFlashUnit()) return false
        return try {
            cam.cameraControl.enableTorch(enabled)
            _torchState.value = enabled
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to toggle torch", e)
            false
        }
    }

    fun switchCamera(lifecycleOwner: LifecycleOwner, surfaceProvider: Preview.SurfaceProvider?): Boolean {
        lensFacing = if (lensFacing == CameraSelector.LENS_FACING_BACK) {
            CameraSelector.LENS_FACING_FRONT
        } else {
            CameraSelector.LENS_FACING_BACK
        }
        rebindUseCases(lifecycleOwner, surfaceProvider)
        return true
    }

    fun setResolutionPreset(
        preset: String,
        lifecycleOwner: LifecycleOwner,
        surfaceProvider: Preview.SurfaceProvider?
    ): Boolean {
        if (preset !in listOf("480p", "720p", "1080p")) return false
        currentResolutionPreset = preset
        rebindUseCases(lifecycleOwner, surfaceProvider)
        return true
    }

    fun setJpegQuality(quality: Int): Boolean {
        jpegQuality = quality.coerceIn(30, 95)
        return true
    }

    fun getQuality(): Int = jpegQuality
}
