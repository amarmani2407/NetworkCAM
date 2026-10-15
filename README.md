# LocalCam Streamer

LocalCam Streamer turns an Android device into a secure, zero-cloud local network camera with CameraX and an embedded Ktor TLS server.

## Features
- **TLS 1.2+ Only (HTTPS)** with unique per-install RSA 2048 self-signed certificates.
- **CameraX ImageAnalysis** with `STRATEGY_KEEP_ONLY_LATEST` on dedicated threads.
- **Conflated Frame Hub** with buffer overflow frame-dropping for slow clients.
- **Audio Streaming** over live 16-bit PCM WAV chunks.
- **Brute-force protection**: 5 failed login attempts per IP triggers a 15-minute lockout.
- **Private Network Restriction**: RFC1918 and link-local address filtering by default.
- **Encrypted Keystore Storage**: Android Keystore + EncryptedSharedPreferences for password salt/hashes.

## Build & Run Instructions
1. Clone or open the project in Android Studio Iguana / Jellyfish (JDK 17).
2. Sync Gradle dependencies:
   ```bash
   ./gradlew assembleDebug
   ```
3. Connect your Android device (Android 8.0 / API 26+ up to API 34).
4. Run on device:
   ```bash
   ./gradlew installDebug
   ```
5. Grant Camera & Notification permissions.
6. Note the displayed HTTPS URL (e.g., `https://192.168.1.142:8443`) and the 12+ character auto-generated password.
7. Open the URL in any browser on the same Wi-Fi network and authenticate!

## Security Model & Threat Matrix
| Threat | Mitigation | Implementation |
|---|---|---|
| Eavesdropping on local Wi-Fi | End-to-end TLS encryption | Ktor CIO SSL connector with unique X.509 cert |
| Default credential attacks | Cryptographically random password generated on 1st boot | SecureRandom 14-char password, min 10 chars enforced |
| Credential stuffing / Brute-force | Sliding-window IP rate limiter | 5 failures = 15-min lockout |
| Credential theft via XSS | HttpOnly, Secure, SameSite=Strict cookies | Browser cannot access session token via JS |
| Cross-Site Request Forgery (CSRF) | Origin & Host header validation | Rejected if origin does not match Host |
| Shodan / Port-scanner exposure | RFC1918 Private IP whitelist | Rejects non-private IPs even if port forwarded |
| Backup credential leaks | Disabled backup in Manifest & extraction rules | android:allowBackup="false" |
