package com.localcam.streamer.security

import java.security.MessageDigest
import java.security.SecureRandom
import java.util.concurrent.ConcurrentHashMap

data class Session(
    val tokenHashHex: String,
    val ipAddress: String,
    val userAgent: String,
    val createdAtMs: Long = System.currentTimeMillis(),
    val expiresAtMs: Long = System.currentTimeMillis() + 12 * 60 * 60 * 1000L // 12 hours
)

object SessionAuthManager {
    private val secureRandom = SecureRandom()
    private val activeSessions = ConcurrentHashMap<String, Session>() // tokenHashHex -> Session

    fun createSession(ipAddress: String, userAgent: String): String {
        // Clean expired sessions periodically
        cleanExpiredSessions()

        // Generate 256-bit cryptographically secure random token
        val tokenBytes = ByteArray(32)
        secureRandom.nextBytes(tokenBytes)
        val plainToken = PasswordHasher.toHex(tokenBytes)

        val tokenHash = hashToken(plainToken)
        val session = Session(
            tokenHashHex = tokenHash,
            ipAddress = ipAddress,
            userAgent = userAgent
        )
        activeSessions[tokenHash] = session
        return plainToken
    }

    fun validateSession(plainToken: String?, clientIp: String?): Boolean {
        if (plainToken.isNullOrBlank()) return false
        val tokenHash = hashToken(plainToken)
        val session = activeSessions[tokenHash] ?: return false

        // Check expiration
        if (System.currentTimeMillis() > session.expiresAtMs) {
            activeSessions.remove(tokenHash)
            return false
        }

        // Optional IP pinning
        if (clientIp != null && session.ipAddress != clientIp) {
            // Suspicious IP change for same session token
            return false
        }

        return true
    }

    fun revokeSession(plainToken: String?) {
        if (plainToken.isNullOrBlank()) return
        val tokenHash = hashToken(plainToken)
        activeSessions.remove(tokenHash)
    }

    fun revokeAllSessions() {
        activeSessions.clear()
    }

    fun hashToken(plainToken: String): String {
        val md = MessageDigest.getInstance("SHA-256")
        val hash = md.digest(plainToken.toByteArray(Charsets.UTF_8))
        return PasswordHasher.toHex(hash)
    }

    private fun cleanExpiredSessions() {
        val now = System.currentTimeMillis()
        val iterator = activeSessions.entries.iterator()
        while (iterator.hasNext()) {
            val entry = iterator.next()
            if (now > entry.value.expiresAtMs) {
                iterator.remove()
            }
        }
    }

    /**
     * CSRF Header and Origin verification for POST / PUT endpoints
     */
    fun validateCsrfOrigin(originHeader: String?, hostHeader: String?): Boolean {
        if (originHeader.isNullOrBlank()) {
            // Allowed if requested by non-browser native client with Bearer header
            return true
        }
        if (hostHeader.isNullOrBlank()) return false

        // Normalize origin: e.g. "https://192.168.1.50:8443"
        val cleanOrigin = originHeader.removePrefix("https://").removePrefix("http://")
        return cleanOrigin.equals(hostHeader, ignoreCase = true) ||
               cleanOrigin.startsWith("localhost") ||
               cleanOrigin.startsWith("127.0.0.1")
    }
}
