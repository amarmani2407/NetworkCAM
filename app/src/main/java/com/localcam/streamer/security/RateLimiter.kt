package com.localcam.streamer.security

import java.util.concurrent.ConcurrentHashMap

data class IpAttemptRecord(
    var failureCount: Int = 0,
    var lockedUntilMs: Long = 0L,
    var lastAttemptMs: Long = System.currentTimeMillis()
)

object RateLimiter {
    const val MAX_FAILURES_BEFORE_LOCKOUT = 5
    const val LOCKOUT_DURATION_MS = 15 * 60 * 1000L // 15 minutes lockout

    private val attemptMap = ConcurrentHashMap<String, IpAttemptRecord>()

    fun isIpLocked(ip: String): Boolean {
        cleanOldRecords()
        val record = attemptMap[ip] ?: return false
        val now = System.currentTimeMillis()
        return now < record.lockedUntilMs
    }

    fun getRemainingLockoutSeconds(ip: String): Long {
        val record = attemptMap[ip] ?: return 0L
        val remaining = record.lockedUntilMs - System.currentTimeMillis()
        return (remaining / 1000L).coerceAtLeast(0L)
    }

    fun recordFailedAttempt(ip: String): Boolean {
        cleanOldRecords()
        val now = System.currentTimeMillis()
        val record = attemptMap.compute(ip) { _, existing ->
            val rec = existing ?: IpAttemptRecord()
            rec.failureCount++
            rec.lastAttemptMs = now
            if (rec.failureCount >= MAX_FAILURES_BEFORE_LOCKOUT) {
                rec.lockedUntilMs = now + LOCKOUT_DURATION_MS
            }
            rec
        }!!

        return record.lockedUntilMs > now
    }

    fun recordSuccessfulLogin(ip: String) {
        attemptMap.remove(ip)
    }

    private fun cleanOldRecords() {
        val now = System.currentTimeMillis()
        val iterator = attemptMap.entries.iterator()
        while (iterator.hasNext()) {
            val entry = iterator.next()
            val rec = entry.value
            // Remove records older than 1 hour if not locked
            if (now > rec.lockedUntilMs && (now - rec.lastAttemptMs > 3600_000L)) {
                iterator.remove()
            }
        }
    }

    fun reset() {
        attemptMap.clear()
    }
}
