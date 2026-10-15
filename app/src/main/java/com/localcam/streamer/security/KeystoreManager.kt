package com.localcam.streamer.security

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.security.KeyStore
import java.security.SecureRandom

object KeystoreManager {
    const val KEY_ALIAS_TLS = "localcam_tls_key"
    private const val PREFS_FILE = "localcam_secure_prefs"

    private const val KEY_PASSWORD_SALT = "pwd_salt"
    private const val KEY_PASSWORD_HASH = "pwd_hash"
    private const val KEY_CERT_FINGERPRINT = "cert_sha256"
    private const val KEY_KEYSTORE_DATA = "tls_keystore_blob"
    private const val KEY_KEYSTORE_PASSWORD = "keystore_pass"
    private const val KEY_SERVER_PORT = "server_port"
    private const val KEY_AUDIO_ENABLED = "audio_enabled"
    private const val KEY_AUTO_STOP_MINS = "auto_stop_mins"
    private const val KEY_ALLOW_PUBLIC_IPS = "allow_public_ips"

    private lateinit var encryptedPrefs: SharedPreferences
    private val secureRandom = SecureRandom()

    fun init(context: Context) {
        if (::encryptedPrefs.isInitialized) return

        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()

        encryptedPrefs = EncryptedSharedPreferences.create(
            context,
            PREFS_FILE,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )

        // Generate initial cryptographically random 12-char password on first launch
        if (getHashedPassword() == null) {
            val generatedPassword = generateRandomPassword(14)
            saveInitialPlainPassword(generatedPassword)
            val salt = PasswordHasher.generateSalt()
            val hash = PasswordHasher.hashPassword(generatedPassword, salt)
            encryptedPrefs.edit()
                .putString(KEY_PASSWORD_SALT, PasswordHasher.toHex(salt))
                .putString(KEY_PASSWORD_HASH, PasswordHasher.toHex(hash))
                .apply()
        }
    }

    private var initialClearPasswordCache: String? = null

    private fun saveInitialPlainPassword(pwd: String) {
        initialClearPasswordCache = pwd
    }

    fun getInitialGeneratedPassword(): String? = initialClearPasswordCache

    fun setPassword(newPlaintext: String): Boolean {
        if (newPlaintext.length < 10) return false
        val salt = PasswordHasher.generateSalt()
        val hash = PasswordHasher.hashPassword(newPlaintext, salt)
        encryptedPrefs.edit()
            .putString(KEY_PASSWORD_SALT, PasswordHasher.toHex(salt))
            .putString(KEY_PASSWORD_HASH, PasswordHasher.toHex(hash))
            .apply()
        initialClearPasswordCache = null // Clear cache once user modifies it
        return true
    }

    fun verifyPassword(plainAttempt: String): Boolean {
        val saltHex = encryptedPrefs.getString(KEY_PASSWORD_SALT, null) ?: return false
        val hashHex = encryptedPrefs.getString(KEY_PASSWORD_HASH, null) ?: return false
        val salt = PasswordHasher.fromHex(saltHex)
        val expectedHash = PasswordHasher.fromHex(hashHex)
        val attemptHash = PasswordHasher.hashPassword(plainAttempt, salt)
        return PasswordHasher.constantTimeEquals(expectedHash, attemptHash)
    }

    fun getHashedPassword(): String? = encryptedPrefs.getString(KEY_PASSWORD_HASH, null)

    fun hasTlsCertificate(): Boolean = encryptedPrefs.contains(KEY_KEYSTORE_DATA)

    fun getKeystorePassword(): String {
        var pwd = encryptedPrefs.getString(KEY_KEYSTORE_PASSWORD, null)
        if (pwd == null) {
            pwd = generateRandomPassword(24)
            encryptedPrefs.edit().putString(KEY_KEYSTORE_PASSWORD, pwd).apply()
        }
        return pwd
    }

    fun saveTlsKeyStore(keyStore: KeyStore) {
        val password = getKeystorePassword().toCharArray()
        val bos = ByteArrayOutputStream()
        keyStore.store(bos, password)
        val bytes = bos.toByteArray()
        val hex = PasswordHasher.toHex(bytes)

        val cert = keyStore.getCertificate(KEY_ALIAS_TLS)
        val fingerprint = TlsCertificateGenerator.calculateSha256Fingerprint(cert)

        encryptedPrefs.edit()
            .putString(KEY_KEYSTORE_DATA, hex)
            .putString(KEY_CERT_FINGERPRINT, fingerprint)
            .apply()
    }

    fun loadTlsKeyStore(): KeyStore {
        val hex = encryptedPrefs.getString(KEY_KEYSTORE_DATA, null)
            ?: throw IllegalStateException("TLS Keystore data not initialized")
        val bytes = PasswordHasher.fromHex(hex)
        val password = getKeystorePassword().toCharArray()
        val keyStore = KeyStore.getInstance(KeyStore.getDefaultType())
        keyStore.load(ByteArrayInputStream(bytes), password)
        return keyStore
    }

    fun getCertFingerprint(): String =
        encryptedPrefs.getString(KEY_CERT_FINGERPRINT, "Generating...") ?: "Generating..."

    fun getServerPort(): Int = encryptedPrefs.getInt(KEY_SERVER_PORT, 8443)
    fun setServerPort(port: Int) = encryptedPrefs.edit().putInt(KEY_SERVER_PORT, port).apply()

    fun isAudioEnabled(): Boolean = encryptedPrefs.getBoolean(KEY_AUDIO_ENABLED, false)
    fun setAudioEnabled(enabled: Boolean) = encryptedPrefs.edit().putBoolean(KEY_AUDIO_ENABLED, enabled).apply()

    fun getAutoStopMinutes(): Int = encryptedPrefs.getInt(KEY_AUTO_STOP_MINS, 0)
    fun setAutoStopMinutes(mins: Int) = encryptedPrefs.edit().putInt(KEY_AUTO_STOP_MINS, mins).apply()

    fun isAllowPublicIps(): Boolean = encryptedPrefs.getBoolean(KEY_ALLOW_PUBLIC_IPS, false)
    fun setAllowPublicIps(allow: Boolean) = encryptedPrefs.edit().putBoolean(KEY_ALLOW_PUBLIC_IPS, allow).apply()

    private fun generateRandomPassword(length: Int): String {
        val chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*"
        return (1..length)
            .map { chars[secureRandom.nextInt(chars.length)] }
            .joinToString("")
    }
}
