package com.localcam.streamer.webrtc

/**
 * PHASE 2: OPTIONAL REMOTE ACCESS SPECIFICATION & INTERFACES
 *
 * Strict Security Rules:
 * 1. OFF BY DEFAULT. Only enabled behind explicit "Remote access (advanced)" setting.
 * 2. Media must be encrypted end-to-end via DTLS-SRTP with verified peer fingerprint.
 * 3. Signaling must occur over authenticated WSS with TLS 1.3 and short-lived (5 min) pairing codes.
 * 4. Never weakens any local-mode security rules or cleartext restrictions.
 */

interface RemoteSignalingClient {
    /** Connect to signaling server with device token */
    suspend fun connect(signalingUrl: String, authToken: String): Result<Unit>
    
    /** Exchange SDP offer/answer */
    suspend fun sendOffer(sessionDescription: String): Result<Unit>
    suspend fun receiveAnswer(): Result<String>
    
    /** Exchange ICE Candidates */
    suspend fun sendIceCandidate(candidate: String, sdpMid: String, sdpMLineIndex: Int)
    
    /** Close connection */
    fun disconnect()
}

data class StunTurnConfig(
    val stunServers: List<String> = listOf("stun:stun.l.google.com:19302"),
    val turnServerUrl: String?,
    val turnUsername: String?,
    val turnCredential: String?,
    val credentialTtlSeconds: Long = 3600
)

data class PeerPairingRequest(
    val pairingCode: String, // 6-digit numeric short-lived code
    val peerDeviceId: String,
    val peerCertFingerprintSha256: String
)

interface WebRtcPeerConnectionController {
    fun initializePeerConnection(config: StunTurnConfig)
    fun setRemoteDescription(sdp: String)
    fun createLocalAnswer(): String
    fun addIceCandidate(candidate: String)
    fun verifyRemoteFingerprint(expectedSha256: String): Boolean
    fun close()
}
