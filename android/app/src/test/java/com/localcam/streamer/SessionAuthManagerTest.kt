package com.localcam.streamer

import com.localcam.streamer.security.SessionAuthManager
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class SessionAuthManagerTest {

    @Before
    fun setUp() {
        SessionAuthManager.revokeAllSessions()
    }

    @Test
    fun testCreateAndValidateSession() {
        val ip = "192.168.1.10"
        val userAgent = "Mozilla/5.0"

        val token = SessionAuthManager.createSession(ip, userAgent)
        assertNotNull(token)
        assertTrue(token.length >= 32)

        // Valid session
        assertTrue(SessionAuthManager.validateSession(token, ip))

        // Different IP rejected when pinned
        assertFalse(SessionAuthManager.validateSession(token, "192.168.1.99"))

        // Invalid token rejected
        assertFalse(SessionAuthManager.validateSession("invalid_token_123", ip))
    }

    @Test
    fun testRevokeSession() {
        val ip = "192.168.1.15"
        val token = SessionAuthManager.createSession(ip, "TestAgent")

        assertTrue(SessionAuthManager.validateSession(token, ip))
        SessionAuthManager.revokeSession(token)
        assertFalse(SessionAuthManager.validateSession(token, ip))
    }

    @Test
    fun testCsrfOriginValidation() {
        // Match host
        assertTrue(SessionAuthManager.validateCsrfOrigin("https://192.168.1.5:8443", "192.168.1.5:8443"))
        assertTrue(SessionAuthManager.validateCsrfOrigin("http://localhost:8443", "localhost:8443"))

        // Malicious mismatch
        assertFalse(SessionAuthManager.validateCsrfOrigin("https://evil-attacker.com", "192.168.1.5:8443"))
    }
}
