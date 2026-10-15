package com.localcam.streamer.server

import android.content.Context
import android.util.Log
import com.localcam.streamer.audio.AudioStreamer
import com.localcam.streamer.camera.FrameHub
import com.localcam.streamer.security.KeystoreManager
import io.ktor.http.HttpHeaders
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.cio.CIO
import io.ktor.server.cio.CIOApplicationEngine
import io.ktor.server.engine.ApplicationEngineEnvironment
import io.ktor.server.engine.applicationEngineEnvironment
import io.ktor.server.engine.connector
import io.ktor.server.engine.embeddedServer
import io.ktor.server.engine.sslConnector
import io.ktor.server.plugins.contentnegotiation.ContentNegotiation
import io.ktor.server.plugins.cors.routing.CORS
import io.ktor.server.response.header
import io.ktor.server.routing.routing
import kotlinx.serialization.json.Json
import java.security.KeyStore

class KtorStreamingServer(
    private val context: Context,
    private val port: Int,
    private val frameHub: FrameHub,
    private val audioStreamer: AudioStreamer?
) {
    private var engine: CIOApplicationEngine? = null

    fun start() {
        val keyStore: KeyStore = KeystoreManager.loadTlsKeyStore()
        val keyPassword = KeystoreManager.getKeystorePassword().toCharArray()

        val environment = applicationEngineEnvironment {
            log = org.slf4j.LoggerFactory.getLogger("KtorStreamingServer")

            // Strict HTTPS / TLS Connector only (No plain HTTP)
            sslConnector(
                keyStore = keyStore,
                keyAlias = KeystoreManager.KEY_ALIAS_TLS,
                keyStorePassword = { keyPassword },
                privateKeyPassword = { keyPassword }
            ) {
                this.port = this@KtorStreamingServer.port
                this.keyStorePath = null
            }

            module {
                configureServerFeatures(context, frameHub, audioStreamer)
            }
        }

        engine = embeddedServer(CIO, environment).start(wait = false)
        Log.i(TAG, "Ktor CIO TLS Server listening on port $port")
    }

    fun stop() {
        try {
            engine?.stop(1000, 2000)
            engine = null
            Log.i(TAG, "Ktor CIO TLS Server stopped gracefully")
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping server", e)
        }
    }

    companion object {
        private const val TAG = "KtorServer"
    }
}

fun Application.configureServerFeatures(
    context: Context,
    frameHub: FrameHub,
    audioStreamer: AudioStreamer?
) {
    install(ContentNegotiation) {
        json(Json {
            ignoreUnknownKeys = true
            isLenient = true
            encodeDefaults = true
        })
    }

    // Strict security interceptor: Content-Security-Policy, HSTS, No-Sniff, Deny Framing
    intercept(io.ktor.server.application.ApplicationCallPipeline.Plugins) {
        call.response.header("Content-Security-Policy", "default-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:;")
        call.response.header("X-Content-Type-Options", "nosniff")
        call.response.header("X-Frame-Options", "DENY")
        call.response.header("Referrer-Policy", "no-referrer")
        call.response.header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        call.response.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    }

    routing {
        registerStreamingRoutes(context, frameHub, audioStreamer)
    }
}
