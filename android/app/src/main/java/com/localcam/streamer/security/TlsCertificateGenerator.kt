package com.localcam.streamer.security

import android.content.Context
import org.bouncycastle.asn1.x500.X500Name
import org.bouncycastle.asn1.x509.BasicConstraints
import org.bouncycastle.asn1.x509.Extension
import org.bouncycastle.asn1.x509.GeneralName
import org.bouncycastle.asn1.x509.GeneralNames
import org.bouncycastle.asn1.x509.KeyUsage
import org.bouncycastle.cert.jcajce.JcaX509CertificateConverter
import org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder
import java.math.BigInteger
import java.security.KeyPair
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.MessageDigest
import java.security.SecureRandom
import java.security.cert.Certificate
import java.security.cert.X509Certificate
import java.util.Date

object TlsCertificateGenerator {

    fun generateSelfSignedKeyStore(context: Context, alias: String, password: String): KeyStore {
        // 1. Generate RSA 2048 keypair
        val keyPairGen = KeyPairGenerator.getInstance("RSA")
        keyPairGen.initialize(2048, SecureRandom())
        val keyPair = keyPairGen.generateKeyPair()

        // 2. Build X.509 certificate with Subject Alternative Names (SAN)
        val cert = generateCertificate(keyPair)

        // 3. Store in a PKCS12 / BKS KeyStore in memory
        val keyStore = KeyStore.getInstance(KeyStore.getDefaultType())
        keyStore.load(null, null)
        keyStore.setKeyEntry(
            alias,
            keyPair.private,
            password.toCharArray(),
            arrayOf<Certificate>(cert)
        )
        return keyStore
    }

    private fun generateCertificate(keyPair: KeyPair): X509Certificate {
        val issuer = X500Name("CN=LocalCam Streamer, O=LocalCam Security, OU=Device Camera")
        val serialNumber = BigInteger(64, SecureRandom())
        val notBefore = Date(System.currentTimeMillis() - 24 * 60 * 60 * 1000L) // Yesterday
        val notAfter = Date(System.currentTimeMillis() + 10L * 365 * 24 * 60 * 60 * 1000L) // 10 years

        val certBuilder = JcaX509v3CertificateBuilder(
            issuer,
            serialNumber,
            notBefore,
            notAfter,
            issuer,
            keyPair.public
        )

        // Key usage
        certBuilder.addExtension(
            Extension.keyUsage,
            true,
            KeyUsage(KeyUsage.digitalSignature or KeyUsage.keyEncipherment)
        )

        // Basic Constraints CA = false
        certBuilder.addExtension(
            Extension.basicConstraints,
            true,
            BasicConstraints(false)
        )

        // Subject Alternative Names: localhost, 127.0.0.1, local Wi-Fi IPs
        val altNames = GeneralNames(
            arrayOf(
                GeneralName(GeneralName.dNSName, "localhost"),
                GeneralName(GeneralName.iPAddress, "127.0.0.1"),
                GeneralName(GeneralName.dNSName, "localcam.local")
            )
        )
        certBuilder.addExtension(Extension.subjectAlternativeName, false, altNames)

        val signer = JcaContentSignerBuilder("SHA256withRSA").build(keyPair.private)
        val certHolder = certBuilder.build(signer)
        return JcaX509CertificateConverter().getCertificate(certHolder)
    }

    fun calculateSha256Fingerprint(cert: Certificate): String {
        val md = MessageDigest.getInstance("SHA-256")
        val der = cert.encoded
        val digest = md.digest(der)
        return digest.joinToString(":") { String.format("%02X", it) }
    }
}
