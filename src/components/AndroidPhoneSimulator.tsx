import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Settings, Copy, Check, ShieldAlert, Wifi, Battery, Camera, Volume2, Shield, Eye, Smartphone, Zap } from 'lucide-react';

interface AndroidPhoneSimulatorProps {
  isServerRunning: boolean;
  onToggleServer: () => void;
  localIp: string;
  serverPort: number;
  password: string;
  onUpdatePassword: (newPwd: string) => boolean;
  certFingerprint: string;
  activeViewers: Array<{ id: string; ip: string; userAgent: string; connectedAt: number }>;
  onDisconnectViewer: (id: string) => void;
  audioEnabled: boolean;
  onToggleAudio: (enabled: boolean) => void;
  allowPublicIps: boolean;
  onTogglePublicIps: (allow: boolean) => void;
  torchEnabled: boolean;
  onToggleTorch: () => void;
  cameraFacing: 'BACK' | 'FRONT';
  onSwitchCamera: () => void;
  resolution: string;
  jpegQuality: number;
  onVideoElementReady?: (el: HTMLVideoElement | null) => void;
}

export const AndroidPhoneSimulator: React.FC<AndroidPhoneSimulatorProps> = ({
  isServerRunning,
  onToggleServer,
  localIp,
  serverPort,
  password,
  onUpdatePassword,
  certFingerprint,
  activeViewers,
  onDisconnectViewer,
  audioEnabled,
  onToggleAudio,
  allowPublicIps,
  onTogglePublicIps,
  torchEnabled,
  onToggleTorch,
  cameraFacing,
  onSwitchCamera,
  resolution,
  jpegQuality,
  onVideoElementReady,
}) => {
  const [copiedPwd, setCopiedPwd] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newPwdInput, setNewPwdInput] = useState('');
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [measuredFps, setMeasuredFps] = useState(24.5);
  const [currentTime, setCurrentTime] = useState('11:45');
  const [useWebcam, setUseWebcam] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamUrl = `https://${localIp}:${serverPort}`;

  // Time ticker
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, []);

  // Measured FPS fluctuation when running
  useEffect(() => {
    if (!isServerRunning) {
      setMeasuredFps(0);
      return;
    }
    const interval = setInterval(() => {
      const base = resolution === '1080p' ? 18.0 : resolution === '720p' ? 26.5 : 30.0;
      const jitter = (Math.random() - 0.5) * 1.5;
      setMeasuredFps(Number((base + jitter).toFixed(1)));
    }, 1200);
    return () => clearInterval(interval);
  }, [isServerRunning, resolution]);

  // Webcam integration
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (useWebcam) {
      navigator.mediaDevices?.getUserMedia({
        video: { facingMode: cameraFacing === 'BACK' ? 'environment' : 'user' },
        audio: false,
      })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          if (onVideoElementReady) onVideoElementReady(videoRef.current);
        }
        setWebcamError(null);
      })
      .catch(() => {
        setWebcamError('Camera access not granted. Using synthetic security feed.');
        setUseWebcam(false);
        if (onVideoElementReady) onVideoElementReady(null);
      });
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const s = videoRef.current.srcObject as MediaStream;
        s.getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
      if (onVideoElementReady) onVideoElementReady(null);
    }

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (onVideoElementReady) onVideoElementReady(null);
    };
  }, [useWebcam, cameraFacing, onVideoElementReady]);

  const handleCopyPassword = () => {
    navigator.clipboard?.writeText(password);
    setCopiedPwd(true);
    setTimeout(() => setCopiedPwd(false), 2000);
  };

  const handleCopyUrl = () => {
    navigator.clipboard?.writeText(streamUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwdInput.length < 10) {
      setPwdError('Password must be at least 10 characters');
      return;
    }
    const success = onUpdatePassword(newPwdInput);
    if (success) {
      setNewPwdInput('');
      setPwdError(null);
      setShowSettings(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Phone Hardware Shell */}
      <div className="w-[360px] sm:w-[380px] bg-slate-950 rounded-[44px] p-3 shadow-2xl border-4 border-slate-800 relative">
        {/* Speaker / Camera Cutout Notch */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-900 rounded-full flex items-center justify-center gap-2 z-30">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-800" />
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse" title="Camera Sensor Active" />
        </div>

        {/* Inner Screen */}
        <div className="w-full bg-slate-900 rounded-[34px] overflow-hidden flex flex-col h-[700px] border border-slate-800/80 text-slate-100 select-none">
          {/* Status Bar */}
          <div className="h-9 px-6 pt-2 flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>{currentTime}</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Wi-Fi</span>
              <Wifi className="w-3.5 h-3.5 text-slate-300" />
              <div className="flex items-center gap-0.5">
                <span className="text-[11px] tabular-nums">84%</span>
                <Battery className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Compose TopAppBar */}
          <div className="h-14 px-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs">
                LC
              </div>
              <div>
                <h1 className="text-sm font-semibold tracking-tight text-white leading-tight">LocalCam Streamer</h1>
                <p className="text-[10px] text-slate-400 font-mono">Foreground Service · TLS</p>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Screen Body */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5">
            {/* Camera Viewport (CameraX Preview) */}
            <div className="relative w-full h-48 bg-black rounded-xl overflow-hidden border border-slate-800 group">
              {useWebcam ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraFacing === 'FRONT' ? 'scale-x-[-1]' : ''}`}
                />
              ) : (
                /* Synthetic Camera Feed with Motion / HUD */
                <div className="w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
                  {/* Crosshair */}
                  <div className="w-16 h-16 border border-slate-700/60 rounded-full flex items-center justify-center relative">
                    <div className="w-2 h-2 rounded-full bg-blue-500/80" />
                    <div className="absolute w-24 h-[1px] bg-slate-700/40" />
                    <div className="absolute h-24 w-[1px] bg-slate-700/40" />
                  </div>
                  {/* Lens Indicator */}
                  <span className="text-[10px] font-mono text-slate-500 mt-2">
                    {cameraFacing === 'BACK' ? 'BACK LENS · 24mm f/1.8' : 'FRONT LENS · 28mm f/2.2'}
                  </span>
                </div>
              )}

              {/* Torch Glow Effect if active */}
              {torchEnabled && (
                <div className="absolute inset-0 bg-amber-400/10 pointer-events-none mix-blend-screen" />
              )}

              {/* Live Overlay Badges */}
              <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wide ${
                  isServerRunning ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                }`}>
                  {isServerRunning ? 'LIVE' : 'STANDBY'}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/70 text-slate-300 border border-white/10 tabular-nums">
                  {measuredFps} FPS
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/70 text-slate-300 border border-white/10">
                  {resolution}
                </span>
              </div>

              {/* Quick Lens Switch & Webcam Toggle Overlays */}
              <div className="absolute bottom-2 right-2 flex items-center gap-1">
                <button
                  onClick={onToggleTorch}
                  className={`p-1.5 rounded-lg text-xs backdrop-blur-md transition-all ${
                    torchEnabled ? 'bg-amber-500 text-slate-950 font-semibold' : 'bg-black/60 text-slate-300 hover:bg-black/80'
                  }`}
                  title="Torch"
                >
                  <Zap className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onSwitchCamera}
                  className="p-1.5 rounded-lg text-xs bg-black/60 text-slate-300 hover:bg-black/80 backdrop-blur-md transition-all"
                  title="Switch Front/Back Lens"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Real Browser Webcam Toggle Button */}
              <div className="absolute bottom-2 left-2">
                <button
                  onClick={() => setUseWebcam(!useWebcam)}
                  className="text-[10px] px-2 py-1 rounded bg-black/70 text-blue-400 hover:text-blue-300 border border-blue-500/30 flex items-center gap-1 backdrop-blur-md"
                >
                  {useWebcam ? 'Use Synthetic' : 'Use Device Camera'}
                </button>
              </div>
            </div>

            {/* Big Start / Stop Streaming Button */}
            <button
              onClick={onToggleServer}
              className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
                isServerRunning
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/30'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/30'
              }`}
            >
              {isServerRunning ? (
                <>
                  <Square className="w-4 h-4 fill-white" />
                  <span>Stop Streaming Service</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Streaming Service</span>
                </>
              )}
            </button>

            {/* Network Access & Credentials Card */}
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/70 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400">Wi-Fi Stream URL</span>
                <button
                  onClick={handleCopyUrl}
                  className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="font-mono text-xs text-blue-300 font-semibold bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800 flex items-center justify-between">
                <span>{streamUrl}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-950 text-blue-400 font-sans">HTTPS</span>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-200/90 space-y-1">
                <p className="font-medium flex items-center gap-1 text-amber-300">
                  <span>💡</span> PC Browser note:
                </p>
                <p className="leading-snug">
                  {streamUrl} is hosted by your physical Android phone running the APK on your local Wi-Fi. To test streaming right now on your computer, use the live viewer panel on the right or launch in a new tab:
                </p>
                <button
                  type="button"
                  onClick={() => window.open(window.location.origin + window.location.pathname + '?view=viewer', '_blank')}
                  className="mt-1 w-full py-1 px-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-[10px] flex items-center justify-center gap-1 transition-colors shadow-sm"
                >
                  <span>Open Web Viewer in Separate Browser Tab ↗</span>
                </button>
              </div>

              {/* Password Section */}
              <div className="pt-1 border-t border-slate-700/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium text-slate-400">Generated Password</span>
                  <button
                    onClick={handleCopyPassword}
                    className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    {copiedPwd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedPwd ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="font-mono text-sm text-emerald-400 font-bold bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800 tracking-wider">
                  {password}
                </div>
              </div>

              {/* SHA-256 Fingerprint */}
              <div className="pt-1 text-[10px] text-slate-400">
                <span className="font-medium text-slate-400">TLS Cert Fingerprint (SHA-256):</span>
                <p className="font-mono text-[9px] text-slate-300 break-all mt-0.5 leading-tight">
                  {certFingerprint}
                </p>
              </div>
            </div>

            {/* Active Viewers Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Connected Viewers ({activeViewers.length}/5)</span>
                <span className="text-[10px] text-slate-500 font-normal">Conflated SharedFlow</span>
              </div>

              {activeViewers.length === 0 ? (
                <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800 text-center text-xs text-slate-400">
                  No active clients. Open the stream URL in another tab.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {activeViewers.map((viewer) => (
                    <div
                      key={viewer.id}
                      className="p-2.5 rounded-lg bg-slate-800/90 border border-slate-700/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-mono text-slate-200 font-medium">{viewer.ip}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[170px]">{viewer.userAgent}</div>
                      </div>
                      <button
                        onClick={() => onDisconnectViewer(viewer.id)}
                        className="px-2 py-1 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-[11px] font-medium border border-rose-500/30 transition-colors"
                      >
                        Disconnect
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Android Navigation Bar */}
          <div className="h-6 flex items-center justify-center shrink-0">
            <div className="w-28 h-1 bg-slate-600 rounded-full" />
          </div>
        </div>
      </div>

      {/* Settings Modal (Compose ModalBottomSheet Simulation) */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">Stream & Security Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                Close
              </button>
            </div>

            {/* Change Password Form */}
            <form onSubmit={handleSavePassword} className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Change Password (Min 10 characters)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPwdInput}
                  onChange={(e) => { setNewPwdInput(e.target.value); setPwdError(null); }}
                  placeholder="New strong password..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-semibold text-white whitespace-nowrap"
                >
                  Save
                </button>
              </div>
              {pwdError && <p className="text-[11px] text-rose-400">{pwdError}</p>}
            </form>

            {/* Audio Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/60 border border-slate-800">
              <div>
                <span className="text-xs font-semibold text-slate-200 block">Microphone Audio Stream</span>
                <span className="text-[11px] text-slate-400">Stream 16-bit PCM WAV chunks via GET /audio</span>
              </div>
              <input
                type="checkbox"
                checked={audioEnabled}
                onChange={(e) => onToggleAudio(e.target.checked)}
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Public IP Override Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/60 border border-slate-800">
              <div>
                <span className="text-xs font-semibold text-slate-200 block">Allow Public Network IPs</span>
                <span className="text-[11px] text-rose-400">Warning: Bypasses RFC1918 subnet filtering</span>
              </div>
              <input
                type="checkbox"
                checked={allowPublicIps}
                onChange={(e) => onTogglePublicIps(e.target.checked)}
                className="w-4 h-4 accent-rose-600 cursor-pointer"
              />
            </div>

            <p className="text-[11px] text-slate-500 italic">
              Encrypted preferences are managed by Android Keystore and MasterKey AES256_GCM.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
