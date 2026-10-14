package com.localcam.streamer.server

import android.content.Context
import android.os.BatteryManager
import androidx.core.content.ContextCompat
import com.localcam.streamer.audio.AudioStreamer
import com.localcam.streamer.camera.CameraPipeline
import com.localcam.streamer.camera.FrameHub
import com.localcam.streamer.security.IpFilter
import com.localcam.streamer.security.KeystoreManager
import com.localcam.streamer.security.RateLimiter
import com.localcam.streamer.security.SessionAuthManager
import io.ktor.http.ContentType
import io.ktor.http.Cookie
import io.ktor.http.CookieEncoding
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.ApplicationCall
import io.ktor.server.application.call
import io.ktor.server.plugins.origin
import io.ktor.server.request.header
import io.ktor.server.request.httpMethod
import io.ktor.server.request.receive
import io.ktor.server.response.header
import io.ktor.server.response.respond
import io.ktor.server.response.respondBytes
import io.ktor.server.response.respondBytesWriter
import io.ktor.server.response.respondText
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.utils.io.writeFully
import io.ktor.utils.io.writeStringUtf8
import kotlinx.coroutines.flow.collectLatest
import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
data class LoginRequest(val password: String)

@Serializable
data class LoginResponse(val success: Boolean, val message: String, val token: String? = null)

@Serializable
data class TorchRequest(val enabled: Boolean)

@Serializable
data class ResolutionRequest(val preset: String)

@Serializable
data class QualityRequest(val value: Int)

@Serializable
data class DisconnectRequest(val viewerId: String)

@Serializable
data class StatusResponse(
    val camera: String,
    val resolution: String,
    val quality: Int,
    val fps: Double,
    val viewerCount: Int,
    val torch: Boolean,
    val batteryLevel: Int,
    val audioEnabled: Boolean
)

fun Route.registerStreamingRoutes(
    context: Context,
    frameHub: FrameHub,
    audioStreamer: AudioStreamer?
) {
    // -------------------------------------------------------------
    // GET / : Responsive Single-Page Web Viewer (HTML/CSS/JS)
    // -------------------------------------------------------------
    get("/") {
        if (!validateClientIp(call)) return@get
        val html = loadWebViewerHtml(context)
        call.respondText(html, ContentType.Text.Html)
    }

    // -------------------------------------------------------------
    // POST /api/login : Authenticate and set HttpOnly session cookie
    // -------------------------------------------------------------
    post("/api/login") {
        val clientIp = call.request.origin.remoteHost
        if (!validateClientIp(call)) return@post

        // Brute-force lockout check
        if (RateLimiter.isIpLocked(clientIp)) {
            val waitSec = RateLimiter.getRemainingLockoutSeconds(clientIp)
            call.respond(
                HttpStatusCode.TooManyRequests,
                LoginResponse(false, "Too many failed attempts. Try again in $waitSec seconds.")
            )
            return@post
        }

        val request = try {
            call.receive<LoginRequest>()
        } catch (e: Exception) {
            call.respond(HttpStatusCode.BadRequest, LoginResponse(false, "Invalid JSON payload"))
            return@post
        }

        if (KeystoreManager.verifyPassword(request.password)) {
            RateLimiter.recordSuccessfulLogin(clientIp)
            val userAgent = call.request.header(HttpHeaders.UserAgent) ?: "Unknown"
            val token = SessionAuthManager.createSession(clientIp, userAgent)

            // Set secure, HttpOnly, SameSite=Strict cookie
            call.response.cookies.append(
                Cookie(
                    name = "LOCALCAM_SESSION",
                    value = token,
                    maxAge = 12 * 3600,
                    secure = true,
                    httpOnly = true,
                    path = "/",
                    extensions = mapOf("SameSite" to "Strict")
                )
            )

            call.respond(HttpStatusCode.OK, LoginResponse(true, "Authentication successful", token))
        } else {
            val locked = RateLimiter.recordFailedAttempt(clientIp)
            if (locked) {
                call.respond(
                    HttpStatusCode.TooManyRequests,
                    LoginResponse(false, "Rate limit exceeded. Lockout active for 15 minutes.")
                )
            } else {
                call.respond(HttpStatusCode.Unauthorized, LoginResponse(false, "Invalid password"))
            }
        }
    }

    // -------------------------------------------------------------
    // POST /api/logout : Invalidate current session
    // -------------------------------------------------------------
    post("/api/logout") {
        val token = extractToken(call)
        SessionAuthManager.revokeSession(token)
        call.response.cookies.appendExpired("LOCALCAM_SESSION", path = "/")
        call.respond(HttpStatusCode.OK, mapOf("success" to true))
    }

    // -------------------------------------------------------------
    // GET /video : MJPEG Stream (multipart/x-mixed-replace; boundary=frame)
    // -------------------------------------------------------------
    get("/video") {
        if (!validateClientIp(call) || !authenticate(call)) return@get

        val viewerId = UUID.randomUUID().toString()
        val clientIp = call.request.origin.remoteHost
        val userAgent = call.request.header(HttpHeaders.UserAgent) ?: "Browser"

        if (!FrameHub.registerViewer(viewerId, clientIp, userAgent)) {
            call.respond(HttpStatusCode.ServiceUnavailable, "Maximum concurrent viewer limit reached (5)")
            return@get
        }

        try {
            call.response.header("Connection", "close")
            call.response.header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
            call.response.header("Pragma", "no-cache")

            call.respondBytesWriter(
                contentType = ContentType.parse("multipart/x-mixed-replace; boundary=frame")
            ) {
                try {
                    FrameHub.frameFlow.collectLatest { frame ->
                        val header = "--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ${frame.jpegData.size}\r\n\r\n"
                        writeStringUtf8(header)
                        writeFully(frame.jpegData)
                        writeStringUtf8("\r\n")
                        flush()
                    }
                } catch (e: Exception) {
                    // Client disconnected
                }
            }
        } finally {
            FrameHub.unregisterViewer(viewerId)
        }
    }

    // -------------------------------------------------------------
    // GET /snapshot : Single JPEG snapshot
    // -------------------------------------------------------------
    get("/snapshot") {
        if (!validateClientIp(call) || !authenticate(call)) return@get

        val bytes = FrameHub.getLatestSnapshot()
        if (bytes != null) {
            call.respondBytes(bytes, ContentType.Image.JPEG)
        } else {
            call.respond(HttpStatusCode.ServiceUnavailable, "Camera warming up, no frame ready")
        }
    }

    // -------------------------------------------------------------
    // GET /audio : Live microphone stream wrapped in WAV container
    // -------------------------------------------------------------
    get("/audio") {
        if (!validateClientIp(call) || !authenticate(call)) return@get
        val streamer = audioStreamer
        if (streamer == null || !KeystoreManager.isAudioEnabled()) {
            call.respond(HttpStatusCode.NotFound, "Audio streaming is disabled in device settings")
            return@get
        }

        call.response.header("Cache-Control", "no-store, no-cache")
        call.respondBytesWriter(contentType = ContentType.Audio.WAV) {
            // Write initial WAV container header
            val wavHeader = streamer.generateWavHeader()
            writeFully(wavHeader)
            flush()

            try {
                streamer.audioFlow.collectLatest { chunk ->
                    writeFully(chunk)
                    flush()
                }
            } catch (e: Exception) {
                // Client closed audio stream
            }
        }
    }

    // -------------------------------------------------------------
    // REST CONTROLS (POST with CSRF checks)
    // -------------------------------------------------------------
    post("/api/torch") {
        if (!validateClientIp(call) || !authenticate(call) || !verifyCsrf(call)) return@post
        val req = call.receive<TorchRequest>()
        val success = CameraPipeline.setTorch(req.enabled)
        call.respond(mapOf("success" to success, "torch" to CameraPipeline.torchState.value))
    }

    post("/api/switch-camera") {
        if (!validateClientIp(call) || !authenticate(call) || !verifyCsrf(call)) return@post
        // Switches camera lens
        val success = CameraPipeline.switchCamera(context as androidx.lifecycle.LifecycleOwner, null)
        call.respond(mapOf("success" to success, "lens" to CameraPipeline.currentLens.value))
    }

    post("/api/resolution") {
        if (!validateClientIp(call) || !authenticate(call) || !verifyCsrf(call)) return@post
        val req = call.receive<ResolutionRequest>()
        val success = CameraPipeline.setResolutionPreset(req.preset, context as androidx.lifecycle.LifecycleOwner, null)
        call.respond(mapOf("success" to success, "resolution" to CameraPipeline.currentResolution.value))
    }

    post("/api/quality") {
        if (!validateClientIp(call) || !authenticate(call) || !verifyCsrf(call)) return@post
        val req = call.receive<QualityRequest>()
        val success = CameraPipeline.setJpegQuality(req.value)
        call.respond(mapOf("success" to success, "quality" to CameraPipeline.getQuality()))
    }

    post("/api/disconnect-viewer") {
        if (!validateClientIp(call) || !authenticate(call) || !verifyCsrf(call)) return@post
        val req = call.receive<DisconnectRequest>()
        val success = FrameHub.disconnectViewer(req.viewerId)
        call.respond(mapOf("success" to success))
    }

    get("/api/status") {
        if (!validateClientIp(call) || !authenticate(call)) return@get

        val batteryManager = context.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
        val batteryPct = batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)

        call.respond(
            StatusResponse(
                camera = CameraPipeline.currentLens.value,
                resolution = CameraPipeline.currentResolution.value,
                quality = CameraPipeline.getQuality(),
                fps = FrameHub.getMeasuredFps(),
                viewerCount = FrameHub.getViewerCount(),
                torch = CameraPipeline.torchState.value,
                batteryLevel = batteryPct,
                audioEnabled = KeystoreManager.isAudioEnabled()
            )
        )
    }
}

// -----------------------------------------------------------------
// Helper Security Utilities
// -----------------------------------------------------------------
private suspend fun validateClientIp(call: ApplicationCall): Boolean {
    val clientIp = call.request.origin.remoteHost
    val allowPublic = KeystoreManager.isAllowPublicIps()
    if (!IpFilter.isAllowedIp(clientIp, allowPublic)) {
        call.respond(HttpStatusCode.Forbidden, "Access forbidden: Requests permitted from local private network only.")
        return false
    }
    return true
}

private suspend fun authenticate(call: ApplicationCall): Boolean {
    val token = extractToken(call)
    val clientIp = call.request.origin.remoteHost
    if (!SessionAuthManager.validateSession(token, clientIp)) {
        call.respond(HttpStatusCode.Unauthorized, "Session unauthorized or expired")
        return false
    }
    return true
}

private fun extractToken(call: ApplicationCall): String? {
    // 1. Check HttpOnly cookie
    val cookie = call.request.cookies["LOCALCAM_SESSION"]
    if (!cookie.isNullOrBlank()) return cookie

    // 2. Check Bearer Authorization header
    val authHeader = call.request.header(HttpHeaders.Authorization)
    if (authHeader != null && authHeader.startsWith("Bearer ", ignoreCase = true)) {
        return authHeader.substring(7).trim()
    }

    return null
}

private suspend fun verifyCsrf(call: ApplicationCall): Boolean {
    val origin = call.request.header(HttpHeaders.Origin)
    val host = call.request.header(HttpHeaders.Host)
    if (!SessionAuthManager.validateCsrfOrigin(origin, host)) {
        call.respond(HttpStatusCode.Forbidden, "CSRF origin verification failed")
        return false
    }
    return true
}

private fun loadWebViewerHtml(context: Context): String {
    return try {
        context.assets.open("web/index.html").bufferedReader().use { it.readText() }
    } catch (e: Exception) {
        WEB_VIEWER_FALLBACK_HTML
    }
}

val WEB_VIEWER_FALLBACK_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>LocalCam Streamer</title>
</head>
<body style="background:#0f172a;color:#f8fafc;font-family:sans-serif;padding:2rem;">
    <h2>LocalCam Streamer</h2>
    <p>Loading secure stream interface...</p>
</body>
</html>
""".trimIndent()
