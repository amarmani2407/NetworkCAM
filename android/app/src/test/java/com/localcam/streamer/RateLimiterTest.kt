package com.localcam.streamer

import com.localcam.streamer.security.RateLimiter
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class RateLimiterTest {

    @Before
    fun setUp() {
        RateLimiter.reset()
    }

    @Test
    fun testInitialIpNotLocked() {
        val ip = "192.168.1.100"
        assertFalse(RateLimiter.isIpLocked(ip))
        assertEquals(0L, RateLimiter.getRemainingLockoutSeconds(ip))
    }

    @Test
    fun testLockoutTriggeredAfterMaxFailures() {
        val ip = "192.168.1.105"

        // 1..4 failures should not lock
        for (i in 1 until RateLimiter.MAX_FAILURES_BEFORE_LOCKOUT) {
            val locked = RateLimiter.recordFailedAttempt(ip)
            assertFalse("Should not be locked after $i failures", locked)
            assertFalse(RateLimiter.isIpLocked(ip))
        }

        // 5th failure must trigger lockout
        val lockedAtFifth = RateLimiter.recordFailedAttempt(ip)
        assertTrue("Fifth failure must lock IP", lockedAtFifth)
        assertTrue(RateLimiter.isIpLocked(ip))
        assertTrue(RateLimiter.getRemainingLockoutSeconds(ip) > 0)
    }

    @Test
    fun testSuccessfulLoginResetsFailures() {
        val ip = "192.168.1.200"

        // 4 failed attempts
        repeat(4) { RateLimiter.recordFailedAttempt(ip) }
        assertFalse(RateLimiter.isIpLocked(ip))

        // Successful login
        RateLimiter.recordSuccessfulLogin(ip)

        // Further failures start fresh
        RateLimiter.recordFailedAttempt(ip)
        assertFalse(RateLimiter.isIpLocked(ip))
    }
}
