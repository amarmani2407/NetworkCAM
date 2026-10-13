import React from 'react';
import { Shield, Lock, Wifi, AlertTriangle, Key, Cpu, Zap, Eye, CheckCircle2 } from 'lucide-react';

export const SecurityArchitecture: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">LocalCam Security Model & Threat Matrix</h2>
            <p className="text-xs text-slate-400">Zero-trust local camera architecture engineered for Android 14+</p>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed mt-2">
          LocalCam Streamer enforces security-by-default on every install. There are no hardcoded secrets, no unencrypted HTTP fallbacks, and no external cloud relay dependencies. The app runs as an isolated TLS 1.3 server inside an Android Foreground Service.
        </p>
      </div>

      {/* Threats Mitigated Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950 border-b border-slate-800">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Threat Mitigation Matrix</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Threat Vector</th>
                <th className="py-3 px-4">Security Mechanism</th>
                <th className="py-3 px-4">Implementation Component</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              <tr className="hover:bg-slate-850/50">
                <td className="py-3 px-4 font-medium text-white">Wi-Fi Eavesdropping / Packet Sniffing</td>
                <td className="py-3 px-4">Enforced TLS 1.2+ HTTPS (CIO SSL engine). Cleartext strictly disabled in NetworkSecurityConfig.</td>
                <td className="py-3 px-4 font-mono text-[11px] text-blue-300">KtorStreamingServer & network_security_config.xml</td>
                <td className="py-3 px-4"><span className="text-emerald-400 font-semibold">Mitigated</span></td>
              </tr>
              <tr className="hover:bg-slate-850/50">
                <td className="py-3 px-4 font-medium text-white">Default / Hardcoded Credential Exploit</td>
                <td className="py-3 px-4">Dynamic cryptographically random 14-char password generated on first boot. Min 10 chars enforced.</td>
                <td className="py-3 px-4 font-mono text-[11px] text-blue-300">KeystoreManager.kt & SecureRandom</td>
                <td className="py-3 px-4"><span className="text-emerald-400 font-semibold">Mitigated</span></td>
              </tr>
              <tr className="hover:bg-slate-850/50">
                <td className="py-3 px-4 font-medium text-white">Credential Stuffing & Brute Force</td>
                <td className="py-3 px-4">Sliding-window IP rate limiter. 5 failed login attempts triggers an exponential 15-minute lockout.</td>
                <td className="py-3 px-4 font-mono text-[11px] text-blue-300">RateLimiter.kt & POST /api/login</td>
                <td className="py-3 px-4"><span className="text-emerald-400 font-semibold">Mitigated</span></td>
              </tr>
              <tr className="hover:bg-slate-850/50">
                <td className="py-3 px-4 font-medium text-white">Session Theft & XSS Hijacking</td>
                <td className="py-3 px-4">256-bit random tokens in HttpOnly, Secure, SameSite=Strict cookies. Hashed server storage.</td>
                <td className="py-3 px-4 font-mono text-[11px] text-blue-300">SessionAuthManager.kt (SHA-256 tokens)</td>
                <td className="py-3 px-4"><span className="text-emerald-400 font-semibold">Mitigated</span></td>
              </tr>
              <tr className="hover:bg-slate-850/50">
                <td className="py-3 px-4 font-medium text-white">Cross-Site Request Forgery (CSRF)</td>
                <td className="py-3 px-4">Origin and Host header verification on all POST mutation endpoints (torch, resolution, camera).</td>
                <td className="py-3 px-4 font-mono text-[11px] text-blue-300">Routes.kt::verifyCsrf()</td>
                <td className="py-3 px-4"><span className="text-emerald-400 font-semibold">Mitigated</span></td>
              </tr>
              <tr className="hover:bg-slate-850/50">
                <td className="py-3 px-4 font-medium text-white">Internet Exposure via Port-Forwarding</td>
                <td className="py-3 px-4">Strict RFC1918 (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16) and link-local IP firewall.</td>
                <td className="py-3 px-4 font-mono text-[11px] text-blue-300">IpFilter.kt (Public IP Rejection)</td>
                <td className="py-3 font-medium px-4"><span className="text-emerald-400 font-semibold">Mitigated</span></td>
              </tr>
              <tr className="hover:bg-slate-850/50">
                <td className="py-3 px-4 font-medium text-white">Slow-Client Memory Leak / Exhaustion</td>
                <td className="py-3 px-4">Conflated SharedFlow with BufferOverflow.DROP_OLDEST. Never buffers frames for lagging viewers.</td>
                <td className="py-3 px-4 font-mono text-[11px] text-blue-300">FrameHub.kt (Max 5 Concurrent Viewers)</td>
                <td className="py-3 px-4"><span className="text-emerald-400 font-semibold">Mitigated</span></td>
              </tr>
              <tr className="hover:bg-slate-850/50">
                <td className="py-3 px-4 font-medium text-white">Data Leakage via Cloud/Device Backup</td>
                <td className="py-3 px-4">android:allowBackup="false" with data_extraction_rules.xml excluding shared preferences & root storage.</td>
                <td className="py-3 px-4 font-mono text-[11px] text-blue-300">data_extraction_rules.xml & Manifest</td>
                <td className="py-3 px-4"><span className="text-emerald-400 font-semibold">Mitigated</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Deep-Dive Architectural Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pillar 1: Cryptography & Keystore */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <Key className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Key Derivation & Storage</h4>
          </div>
          <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <li>
              <strong className="text-slate-100">PBKDF2WithHmacSHA256:</strong> Password hashes use 120,000 iterations and a cryptographically unique 16-byte salt per install.
            </li>
            <li>
              <strong className="text-slate-100">Android Keystore:</strong> MasterKey is created with <code className="text-emerald-400">AES256_GCM</code>. Preferences use <code className="text-emerald-400">AES256_SIV</code> keys.
            </li>
            <li>
              <strong className="text-slate-100">Constant-Time Comparison:</strong> Secret checks utilize <code className="text-emerald-400">MessageDigest.isEqual()</code> to prevent side-channel timing attacks.
            </li>
            <li>
              <strong className="text-slate-100">Ephemeral Session Tokens:</strong> 256-bit tokens generated via <code className="text-emerald-400">SecureRandom</code>, stored in SHA-256 hashed form only.
            </li>
          </ul>
        </div>

        {/* Pillar 2: Self-Signed TLS Certificate & Browser Warnings */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-blue-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">TLS & Self-Signed Cert Model</h4>
          </div>
          <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <li>
              <strong className="text-slate-100">Unique Per-Install X.509 Cert:</strong> BouncyCastle generates an RSA 2048 keypair on first launch. No pre-bundled keys or certificates exist.
            </li>
            <li>
              <strong className="text-slate-100">Subject Alternative Names (SAN):</strong> Injected for <code className="text-blue-300">localhost</code>, <code className="text-blue-300">127.0.0.1</code>, and local Wi-Fi hostnames.
            </li>
            <li>
              <strong className="text-slate-100">Fingerprint Verification:</strong> The SHA-256 fingerprint is calculated and displayed on the Android device UI so the user can verify the browser security exception.
            </li>
            <li>
              <strong className="text-slate-100">TLS 1.2+ Only:</strong> Legacy SSLv3, TLS 1.0, and TLS 1.1 are explicitly disabled on the Ktor CIO connector.
            </li>
          </ul>
        </div>

        {/* Pillar 3: CameraX Pipeline & Conflated Hub */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-4 h-4 text-purple-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Camera Pipeline & Concurrency</h4>
          </div>
          <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <li>
              <strong className="text-slate-100">STRATEGY_KEEP_ONLY_LATEST:</strong> Analysis pipeline drops obsolete frames automatically if the encoder thread is busy.
            </li>
            <li>
              <strong className="text-slate-100">Single-Thread Background Executor:</strong> Analysis runs on a dedicated executor to keep the Android main thread and UI responsive.
            </li>
            <li>
              <strong className="text-slate-100">Single Compression Pass:</strong> YUV_420_888 to NV21/JPEG compression occurs once in CameraPipeline, then emits to FrameHub.
            </li>
            <li>
              <strong className="text-slate-100">Conflated Flow:</strong> Multi-client distribution uses <code className="text-purple-300">MutableSharedFlow(replay=1, onBufferOverflow=DROP_OLDEST)</code>.
            </li>
          </ul>
        </div>

        {/* Pillar 4: Android 14 Foreground Service & Locks */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Reliability, WakeLocks & OS Lifecycle</h4>
          </div>
          <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <li>
              <strong className="text-slate-100">Foreground Service Types:</strong> Declares <code className="text-amber-300">foregroundServiceType="camera|microphone"</code> required on Android 14+.
            </li>
            <li>
              <strong className="text-slate-100">Power & Wi-Fi Locks:</strong> Holds <code className="text-amber-300">PARTIAL_WAKE_LOCK</code> and <code className="text-amber-300">WIFI_MODE_FULL_HIGH_PERF</code> only while server is active.
            </li>
            <li>
              <strong className="text-slate-100">Graceful Shutdown:</strong> Stop intent cleanly closes Ktor server, unbinds CameraX, stops AudioRecord, and removes the persistent notification.
            </li>
            <li>
              <strong className="text-slate-100">No Auto-Start on Boot:</strong> Server remains stopped upon reboot to preserve user privacy and prevent unintentional camera exposure.
            </li>
          </ul>
        </div>
      </div>

      {/* Phase 2: WebRTC Remote Access Architecture */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Eye className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Phase 2: Remote Access Architecture (Advanced - OFF by Default)</h4>
          </div>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-cyan-400 font-mono border border-slate-700">
            Design & Interfaces Ready
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          When remote access outside the local Wi-Fi subnet is requested, LocalCam transitions to WebRTC rather than opening inbound firewall ports:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
            <strong className="text-white block mb-1">1. DTLS-SRTP Media</strong>
            Audio and video packets are encrypted peer-to-peer with DTLS-SRTP. Media keys are negotiated directly between endpoints.
          </div>
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
            <strong className="text-white block mb-1">2. Authenticated WSS Signaling</strong>
            SDP offer/answer and ICE candidate exchange occurs through a TLS 1.3 WebSocket signaling server using 6-digit short-lived pairing codes (5-minute TTL).
          </div>
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
            <strong className="text-white block mb-1">3. E2E Peer Verification</strong>
            Viewer must verify the camera device's TLS certificate fingerprint before the peer connection transitions to active state.
          </div>
        </div>
      </div>
    </div>
  );
};
