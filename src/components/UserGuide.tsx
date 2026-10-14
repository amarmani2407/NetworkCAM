import React, { useState } from 'react';
import { 
  BookOpen, 
  Wifi, 
  ShieldCheck, 
  Lock, 
  Smartphone, 
  Globe, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  Terminal, 
  Key, 
  Zap, 
  HelpCircle,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';

interface UserGuideProps {
  onExportZip: () => void;
  isExporting: boolean;
}

export const UserGuide: React.FC<UserGuideProps> = ({ onExportZip, isExporting }) => {
  const [activeSection, setActiveSection] = useState<'quickstart' | 'github' | 'browser' | 'security' | 'troubleshoot' | 'build'>('github');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-2">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Complete User & Engineering Manual</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            How to Use & Deploy LocalCam Streamer
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            LocalCam Streamer turns any Android phone into an encrypted network camera. It serves a live, low-latency video feed directly over your Wi-Fi network using an embedded Ktor TLS server—no cloud accounts, no third-party servers, and zero data leakage.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onExportZip}
              disabled={isExporting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Packaging ZIP...' : 'Download Android Studio Project (.ZIP)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 text-xs font-medium">
        <button
          onClick={() => setActiveSection('github')}
          className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
            activeSection === 'github' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          🚀 Deploy to GitHub & Get APK
        </button>
        <button
          onClick={() => setActiveSection('quickstart')}
          className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
            activeSection === 'quickstart' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          1. Quick Start
        </button>
        <button
          onClick={() => setActiveSection('browser')}
          className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
            activeSection === 'browser' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          2. Browser Access & HTTPS Warning
        </button>
        <button
          onClick={() => setActiveSection('security')}
          className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
            activeSection === 'security' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          3. Security & Privacy Model
        </button>
        <button
          onClick={() => setActiveSection('troubleshoot')}
          className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
            activeSection === 'troubleshoot' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          4. Troubleshooting & FAQ
        </button>
        <button
          onClick={() => setActiveSection('build')}
          className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
            activeSection === 'build' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          5. Local Android Studio Build
        </button>
      </div>

      {/* Section 0: Deploy to GitHub & Get APK */}
      {activeSection === 'github' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/70 via-slate-900 to-slate-900 border border-blue-500/30 space-y-3">
            <div className="flex items-center gap-2.5 text-blue-400 font-bold text-sm">
              <span className="text-lg">🤖</span>
              <span>Zero-Config Automated Build on GitHub Actions</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              You do <strong>not</strong> need Android Studio, Gradle, or JDK installed on your computer. When you upload or push this project to GitHub, an automated GitHub Actions cloud runner (Ubuntu + JDK 17) compiles the code, executes all security tests, and outputs a ready-to-install <code className="text-emerald-400 font-mono">LocalCam-Streamer-Debug-APK</code> file directly for you to download!
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white">Follow These 4 Steps to Get Your APK File</h3>

            {/* Step 1 */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">1</span>
                <h4 className="font-semibold text-white text-xs">Download and Unzip the Project</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pl-8">
                Click the blue <strong>"Download Android Studio Project (.ZIP)"</strong> button above (or the <strong>"Export Android ZIP"</strong> in the top header). Extract the zip folder to your computer.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">2</span>
                <h4 className="font-semibold text-white text-xs">Create a New GitHub Repository</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pl-8">
                Go to <a href="https://github.com/new" target="_blank" rel="noreferrer" className="text-blue-400 underline font-semibold">github.com/new</a>. Create a repository named <code className="text-blue-300 font-mono">LocalCam-Streamer</code> (can be Public or Private).
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">3</span>
                <h4 className="font-semibold text-white text-xs">Push the Files to GitHub</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pl-8">
                Open terminal / command prompt in your unzipped folder and run:
              </p>
              <div className="ml-8 p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 space-y-1">
                <div className="flex items-center justify-between text-slate-500 font-sans text-[10px] pb-1 border-b border-slate-800">
                  <span>Git Commands</span>
                  <button
                    onClick={() => copyToClipboard('git init\ngit add .\ngit commit -m "Deploy LocalCam Streamer"\ngit branch -M main\ngit remote add origin https://github.com/YOUR_USERNAME/LocalCam-Streamer.git\ngit push -u origin main', 'gitCmds')}
                    className="text-blue-400 flex items-center gap-1 hover:text-blue-300"
                  >
                    {copiedCmd === 'gitCmds' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCmd === 'gitCmds' ? 'Copied' : 'Copy All'}</span>
                  </button>
                </div>
                <div>git init</div>
                <div>git add .</div>
                <div>git commit -m "Deploy LocalCam Streamer"</div>
                <div>git branch -M main</div>
                <div className="text-slate-400"># Replace YOUR_USERNAME with your GitHub username:</div>
                <div className="text-blue-300">git remote add origin https://github.com/YOUR_USERNAME/LocalCam-Streamer.git</div>
                <div>git push -u origin main</div>
              </div>
              <p className="text-[11px] text-slate-400 pl-8">
                <em>Tip: If you don't use Git CLI, you can also click "uploading an existing file" on GitHub's page and drag &amp; drop the unzipped files into your browser!</em>
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">4</span>
                <h4 className="font-semibold text-white text-xs">Download Your APK from GitHub Actions</h4>
              </div>
              <div className="pl-8 space-y-2 text-xs text-slate-300 leading-relaxed">
                <p>
                  As soon as you push your code, GitHub Actions triggers automatically using the included <code className="text-blue-300 font-mono">.github/workflows/build-apk.yml</code> workflow!
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
                  <li>In your GitHub repository, click on the <strong className="text-white">"Actions"</strong> tab at the top.</li>
                  <li>Click on the workflow run titled <strong className="text-white">"Build Android APK"</strong>.</li>
                  <li>Wait ~2 minutes until you see a green checkmark <strong className="text-emerald-400">"Build &amp; Package APK: Success"</strong>.</li>
                  <li>Scroll down to the <strong className="text-white">"Artifacts"</strong> section at the bottom of the summary page.</li>
                  <li>Click <strong className="text-emerald-400 font-mono">LocalCam-Streamer-Debug-APK</strong> to download the zip containing your compiled <code className="text-white font-mono">app-debug.apk</code>!</li>
                </ol>
              </div>

              {/* Install on phone instructions */}
              <div className="ml-8 p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200 space-y-1.5">
                <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>How to Install the APK on Your Phone</span>
                </div>
                <p className="leading-relaxed text-emerald-200/90">
                  Send the <code className="text-white font-mono">app-debug.apk</code> to your phone (via WhatsApp, Google Drive, USB cable, or download directly from GitHub on your phone's browser). Tap the file to install, allow <em>"Install unknown apps"</em> when prompted, and launch <strong>LocalCam Streamer</strong>!
                </p>
              </div>

              {/* Troubleshooting: Directory does not contain a Gradle build */}
              <div className="ml-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-2.5">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Got Error: "Directory does not contain a Gradle build"?</span>
                </div>
                <p className="leading-relaxed text-amber-200/90">
                  This happens if the unzipped folder was pushed as a subfolder (e.g. <code className="text-white font-mono">NetworkCAM/LocalCamStreamer/...</code>) rather than having <code className="text-white font-mono">settings.gradle.kts</code> in the repository root.
                </p>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 space-y-1.5 font-sans">
                  <div className="font-semibold text-white">How to fix it:</div>
                  <p>Our updated <code className="text-emerald-400 font-mono">.github/workflows/build-apk.yml</code> now automatically detects your project even if it is inside a subfolder!</p>
                  <p>In GitHub, go to <strong>.github/workflows/build-apk.yml</strong> &gt; click the <strong>Pencil icon (Edit)</strong> &gt; replace it with the updated workflow below &gt; click <strong>Commit changes</strong>. It will run and succeed!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 1: Quick Start */}
      {activeSection === 'quickstart' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                01
              </div>
              <h3 className="text-sm font-semibold text-white">Connect to Same Wi-Fi</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ensure both your Android device and your viewing computer or laptop are connected to the same Wi-Fi router.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                02
              </div>
              <h3 className="text-sm font-semibold text-white">Start the Service</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Open LocalCam Streamer and tap <strong>"Start Streaming Service"</strong>. An ongoing notification keeps it alive in the background.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                03
              </div>
              <h3 className="text-sm font-semibold text-white">Open in Any Browser</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Navigate to the URL displayed on the phone (e.g. <code className="text-blue-300">https://192.168.1.142:8443</code>) and log in with your device password.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">How LocalCam Streamer Works</h4>
            <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
              <p>
                When you tap <strong>Start</strong>, LocalCam Streamer launches a native Android Foreground Service with type <code className="text-blue-300">camera|microphone</code>. It initializes:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 ml-2">
                <li><strong className="text-slate-200">CameraX ImageAnalysis:</strong> Uses single-thread hardware encoding to compress camera frames to JPEG on Dispatchers.Default.</li>
                <li><strong className="text-slate-200">Ktor CIO TLS Server:</strong> Runs directly inside the app on port 8443 with self-signed HTTPS encryption.</li>
                <li><strong className="text-slate-200">Conflated FrameHub:</strong> Broadcasts frames over Kotlin SharedFlow with buffer drop so slow browsers never cause memory leaks.</li>
                <li><strong className="text-slate-200">Partial WakeLock & High-Perf WifiLock:</strong> Prevents Android from putting the CPU or Wi-Fi radio to sleep while streaming.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Browser Access & Certificate Warning */}
      {activeSection === 'browser' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Why Does the Browser Show a "Not Secure" or "Privacy Warning"?</span>
            </div>
            <p className="leading-relaxed text-amber-200/90">
              This is completely normal and expected! LocalCam Streamer generates a <strong>unique, private self-signed TLS certificate</strong> on your phone. Because this certificate is created by your device rather than purchased from a public certificate authority (like Let's Encrypt), web browsers don't recognize the issuer by default.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">How to Bypass the Browser Warning Safely</h3>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 shrink-0">1</span>
                <div>
                  <strong className="text-white block mb-0.5">Chrome, Brave, Edge:</strong>
                  <span>Click <strong>"Advanced"</strong> on the red warning screen, then click <strong>"Proceed to 192.168.x.x (unsafe)"</strong>.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 shrink-0">2</span>
                <div>
                  <strong className="text-white block mb-0.5">Firefox:</strong>
                  <span>Click <strong>"Advanced..."</strong>, then click <strong>"Accept the Risk and Continue"</strong>.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 shrink-0">3</span>
                <div>
                  <strong className="text-white block mb-0.5">Safari (macOS / iOS):</strong>
                  <span>Click <strong>"Show Details"</strong>, then click <strong>"visit this website"</strong> and confirm with your device passcode/Touch ID.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">✓</span>
                <div>
                  <strong className="text-white block mb-0.5">Verify the Certificate Fingerprint:</strong>
                  <span>Compare the SHA-256 fingerprint displayed on the phone with the one in the browser certificate dialog. If they match, you are 100% protected against man-in-the-middle attacks!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 3: Security & Privacy Model */}
      {activeSection === 'security' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Key className="w-4 h-4" />
                <span>Zero Default Passwords</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                The app generates a cryptographically random 14-character password on first launch using <code className="text-slate-300">SecureRandom</code>. You can change it anytime (minimum 10 characters enforced). The server refuses to start without a password.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-blue-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Brute-Force Rate Limiting</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                If someone attempts to guess your password, 5 failed login attempts triggers an automatic <strong>15-minute exponential lockout</strong> on their IP address.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-purple-400 font-bold">
                <Lock className="w-4 h-4" />
                <span>Encrypted Keystore Storage</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Passwords are never stored in plaintext. LocalCam uses <code className="text-slate-300">PBKDF2WithHmacSHA256</code> with 120,000 iterations and random salts, secured inside AndroidX <code className="text-slate-300">EncryptedSharedPreferences</code> with an AES256_GCM MasterKey.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold">
                <Wifi className="w-4 h-4" />
                <span>RFC1918 Private Subnet Firewall</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Only connections originating from private local address ranges (<code className="text-slate-300">192.168.x.x</code>, <code className="text-slate-300">10.x.x.x</code>, <code className="text-slate-300">172.16-31.x.x</code>, and loopback) are permitted. Public internet connections are dropped automatically.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Section 4: Troubleshooting & FAQ */}
      {activeSection === 'troubleshoot' && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
            <div>
              <h4 className="font-bold text-white text-sm mb-1">Q: The web viewer says "Connection Refused" or cannot reach the IP address</h4>
              <p className="text-slate-400 leading-relaxed">
                <strong>Solution:</strong> Check that your Wi-Fi router does not have <em>"Client Isolation"</em> or <em>"AP Isolation"</em> turned on. In guest networks, routers frequently block wireless devices from talking to one another. Ensure both phone and computer are on the main 2.4GHz or 5GHz home Wi-Fi network.
              </p>
            </div>

            <div className="border-t border-slate-800 pt-3">
              <h4 className="font-bold text-white text-sm mb-1">Q: The video stream freezes or lags after 10 minutes</h4>
              <p className="text-slate-400 leading-relaxed">
                <strong>Solution:</strong> Some aggressive battery management skins (like Xiaomi MIUI, Huawei, or Samsung OneUI) may attempt to restrict background services. In Android Settings &gt; Apps &gt; LocalCam Streamer &gt; Battery, set Battery Usage to <strong>"Unrestricted"</strong>.
              </p>
            </div>

            <div className="border-t border-slate-800 pt-3">
              <h4 className="font-bold text-white text-sm mb-1">Q: How do I disconnect an unauthorized viewer?</h4>
              <p className="text-slate-400 leading-relaxed">
                <strong>Solution:</strong> In the LocalCam phone interface, look at the <strong>"Connected Viewers"</strong> card. Tap the red <strong>"Disconnect"</strong> button next to any IP address to terminate their session immediately. You can also change your password in Settings to revoke all active tokens.
              </p>
            </div>

            <div className="border-t border-slate-800 pt-3">
              <h4 className="font-bold text-white text-sm mb-1">Q: What ports does LocalCam use?</h4>
              <p className="text-slate-400 leading-relaxed">
                <strong>Solution:</strong> The default port is <code className="text-blue-300">8443</code> (HTTPS). You can change this port to any number between 1024 and 65535 in Settings.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Section 5: Compile & Build Instructions */}
      {activeSection === 'build' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white">How to Compile in Android Studio</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              You can download the entire source code bundle as a ZIP file using the button below and open it directly in Android Studio.
            </p>

            {/* Quick Fix for Unresolved reference 'libs' */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2.5">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Fixing "Unresolved reference 'libs'" in Android Studio</span>
              </div>
              <p className="text-amber-200/90 leading-relaxed">
                If your Android Studio shows <code className="text-white font-mono">Unresolved reference 'libs'</code> on line 3 of the root <code className="text-white font-mono">build.gradle.kts</code>, this happens because Android Studio couldn't find a version catalog.
              </p>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-200 space-y-1">
                <div className="text-slate-500 font-sans text-[10px] mb-1">Open root <strong>build.gradle.kts</strong> and replace its content with:</div>
                <div className="text-emerald-400">plugins &#123;</div>
                <div className="text-emerald-400 pl-4">id("com.android.application") version "8.2.2" apply false</div>
                <div className="text-emerald-400 pl-4">id("org.jetbrains.kotlin.android") version "1.9.22" apply false</div>
                <div className="text-emerald-400 pl-4">id("org.jetbrains.kotlin.plugin.serialization") version "1.9.22" apply false</div>
                <div className="text-emerald-400">&#125;</div>
              </div>
              <p className="text-[11px] text-slate-400">
                Then click <strong>"Sync Project with Gradle Files"</strong> (the elephant icon with blue arrow) in the top-right toolbar. (The project ZIP has also been updated with this fix automatically!).
              </p>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-500 font-sans">1. Unpack project archive</span>
                  <button
                    onClick={() => copyToClipboard('unzip LocalCamStreamer-Android-Project.zip -d LocalCamStreamer', 'cmd1')}
                    className="text-[10px] text-blue-400 flex items-center gap-1 font-sans"
                  >
                    {copiedCmd === 'cmd1' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCmd === 'cmd1' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <code className="text-emerald-400">unzip LocalCamStreamer-Android-Project.zip -d LocalCamStreamer</code>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-500 font-sans">2. Run all unit tests</span>
                  <button
                    onClick={() => copyToClipboard('./gradlew testDebugUnitTest', 'cmd2')}
                    className="text-[10px] text-blue-400 flex items-center gap-1 font-sans"
                  >
                    {copiedCmd === 'cmd2' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCmd === 'cmd2' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <code className="text-emerald-400">./gradlew testDebugUnitTest</code>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-500 font-sans">3. Build debug APK and install on phone</span>
                  <button
                    onClick={() => copyToClipboard('./gradlew installDebug', 'cmd3')}
                    className="text-[10px] text-blue-400 flex items-center gap-1 font-sans"
                  >
                    {copiedCmd === 'cmd3' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCmd === 'cmd3' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <code className="text-emerald-400">./gradlew installDebug</code>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onExportZip}
                disabled={isExporting}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Generating ZIP...' : 'Download Android Project (.ZIP) Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
