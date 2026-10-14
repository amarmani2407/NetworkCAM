package com.localcam.streamer.audio

import android.annotation.SuppressLint
import android.content.Context
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.util.Log
import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import java.io.ByteArrayOutputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.concurrent.atomic.AtomicBoolean

class AudioStreamer(private val context: Context) {
    private val isRecording = AtomicBoolean(false)
    private var audioRecord: AudioRecord? = null
    private var recordingThread: Thread? = null

    private val _audioFlow = MutableSharedFlow<ByteArray>(
        replay = 0,
        extraBufferCapacity = 16,
        onBufferOverflow = BufferOverflow.DROP_OLDEST
    )
    val audioFlow: SharedFlow<ByteArray> = _audioFlow.asSharedFlow()

    @SuppressLint("MissingPermission")
    fun startRecording() {
        if (isRecording.getAndSet(true)) return

        val minBufferSize = AudioRecord.getMinBufferSize(
            SAMPLE_RATE,
            CHANNEL_CONFIG,
            AUDIO_FORMAT
        )
        val bufferSize = minBufferSize.coerceAtLeast(BUFFER_SIZE)

        try {
            audioRecord = AudioRecord(
                MediaRecorder.AudioSource.MIC,
                SAMPLE_RATE,
                CHANNEL_CONFIG,
                AUDIO_FORMAT,
                bufferSize
            )

            if (audioRecord?.state != AudioRecord.STATE_INITIALIZED) {
                Log.e(TAG, "AudioRecord initialization failed")
                isRecording.set(false)
                return
            }

            audioRecord?.startRecording()

            recordingThread = Thread({
                val buffer = ByteArray(bufferSize)
                while (isRecording.get()) {
                    val bytesRead = audioRecord?.read(buffer, 0, buffer.size) ?: -1
                    if (bytesRead > 0) {
                        val chunk = buffer.copyOf(bytesRead)
                        _audioFlow.tryEmit(chunk)
                    }
                }
            }, "AudioRecordThread").apply {
                priority = Thread.NORM_PRIORITY + 1
                start()
            }
            Log.i(TAG, "Audio recording started successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Error starting AudioRecord", e)
            isRecording.set(false)
        }
    }

    fun stopRecording() {
        if (!isRecording.getAndSet(false)) return
        try {
            audioRecord?.stop()
            audioRecord?.release()
            audioRecord = null
            recordingThread?.join(500)
            recordingThread = null
            Log.i(TAG, "Audio recording stopped")
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping AudioRecord", e)
        }
    }

    fun generateWavHeader(dataLength: Int = 0x7ffffff0): ByteArray {
        val totalLength = dataLength + 36
        val header = ByteArray(44)
        val byteBuffer = ByteBuffer.wrap(header).order(ByteOrder.LITTLE_ENDIAN)

        byteBuffer.put("RIFF".toByteArray())
        byteBuffer.putInt(totalLength)
        byteBuffer.put("WAVE".toByteArray())
        byteBuffer.put("fmt ".toByteArray())
        byteBuffer.putInt(16) // Subchunk1Size for PCM
        byteBuffer.putShort(1.toShort()) // AudioFormat 1 = PCM
        byteBuffer.putShort(1.toShort()) // Channels: 1 (Mono)
        byteBuffer.putInt(SAMPLE_RATE)
        byteBuffer.putInt(SAMPLE_RATE * 2) // ByteRate = SampleRate * Channels * BitsPerSample/8
        byteBuffer.putShort(2.toShort()) // BlockAlign
        byteBuffer.putShort(16.toShort()) // BitsPerSample
        byteBuffer.put("data".toByteArray())
        byteBuffer.putInt(dataLength)

        return header
    }

    companion object {
        private const val TAG = "AudioStreamer"
        const val SAMPLE_RATE = 16000
        const val CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_MONO
        const val AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT
        private const val BUFFER_SIZE = 4096
    }
}
