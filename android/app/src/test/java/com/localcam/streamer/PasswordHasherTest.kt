package com.localcam.streamer

import com.localcam.streamer.security.PasswordHasher
import org.junit.Assert.*
import org.junit.Test

class PasswordHasherTest {

    @Test
    fun testSaltUniqueness() {
        val salt1 = PasswordHasher.generateSalt()
        val salt2 = PasswordHasher.generateSalt()
        assertFalse("Salts must be randomly generated and unique", salt1.contentEquals(salt2))
    }

    @Test
    fun testHashConsistency() {
        val password = "StrongSecurePassword123!"
        val salt = PasswordHasher.generateSalt()

        val hash1 = PasswordHasher.hashPassword(password, salt)
        val hash2 = PasswordHasher.hashPassword(password, salt)

        assertTrue(PasswordHasher.constantTimeEquals(hash1, hash2))
    }

    @Test
    fun testDifferentPasswordsProduceDifferentHashes() {
        val salt = PasswordHasher.generateSalt()
        val hash1 = PasswordHasher.hashPassword("PasswordAlpha123", salt)
        val hash2 = PasswordHasher.hashPassword("PasswordBeta456", salt)

        assertFalse(PasswordHasher.constantTimeEquals(hash1, hash2))
    }
}
