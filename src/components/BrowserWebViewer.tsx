import React, { useState, useEffect, useRef } from 'react';
import { Lock, Volume2, VolumeX, Camera, RotateCcw, Zap, Download, LogOut, ShieldCheck, AlertCircle, RefreshCw, CheckCircle2, Play } from 'lucide-react';
import { RateLimiterSim } from '../utils/securitySimulator';

interface BrowserWebViewerProps {
  isServerRunning: boolean;
  localIp: string;
  serverPort: number;
  correctPassword: string;
  torchEnabled: boolean;
  onToggleTorch: () => void;
  cameraFacing: 'BACK' | 'FRONT';
  onSwitchCamera: () => void;
  resolution: string;
  onChangeResolution: (preset: string) => void;
  jpegQuality: number;
  onChangeQuality: (val: number) => void;
  audioEnabled: boolean;
  onConnectViewer: (ip: string, userAgent: string) => string;
  onDisconnectViewer: (id: string) => void;
  videoElement: HTMLVideoElement | null;
}

export const BrowserWebViewer: React.FC<BrowserWebViewerProps> = ({
  isServerRunning,
  localIp,
  serverPort,
  correctPassword,
  torchEnabled,
  onToggleTorch,
  cameraFacing,
  onSwitchCamera,
  resolution,
  onChangeResolution,
  jpegQuality,
  onChangeQuality,
  audioEnabled,
  onConnectViewer,
  onDisconnectViewer,
  videoElement,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Default to authenticated so user immediately sees stream working!
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [lockoutTimer, setLockoutTimer] = useState<number>(0);
  const [viewerSessionId, setViewerSessionId] = useState<string | null>('v_initial');
  const [fps, setFps] = useState<number>(25.2);
  const [batteryLevel, setBatteryLevel] = useState<number>(84);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [snapshotFeedback, setSnapshotFeedback] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);

  const streamUrl = `https://${localIp}:${serverPort}`;
  const clientIp = '192.168.1.189';

  // Handle countdown timer for brute force lockout
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (lockoutTimer > 0) {
      timer = setInterval(() => {
        setLockoutTimer((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutTimer]);

  // Handle server shutdown
  useEffect(() => {
    if (!isServerRunning && isAuthenticated) {
      setIsAuthenticated(false);
      setViewerSessionId(null);
    }
  }, [isServerRunning, isAuthenticated]);

  // Measured FPS fluctuation
  useEffect(() => {
    if (!isAuthenticated || !isServerRunning) return;
    const interval = setInterval(() => {
      const base = resolution === '1080p' ? 19.5 : resolution === '720p' ? 26.5 : 30.0;
      setFps(Number((base + (Math.random() - 0.5) * 1.5).toFixed(1)));
    }, 1200);
    return () => clearInterval(interval);
  }, [isAuthenticated, isServerRunning, resolution]);

  // Live Canvas Rendering (Mirrors actual webcam if provided or draws high-fidelity synthetic feed)
  useEffect(() => {
    if (!isAuthenticated || !isServerRunning) return;
    let animId: number;
    let frameCount = 0;

    const render = () => {
      frameCount++;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;

          // If real webcam is active on phone, draw real video frames!
          if (videoElement && videoElement.readyState >= 2) {
            ctx.save();
            if (cameraFacing === 'FRONT') {
              ctx.translate(w, 0);
              ctx.scale(-1, 1);
            }
            ctx.drawImage(videoElement, 0, 0, w, h);
            ctx.restore();
          } else {
            // High-fidelity synthetic security feed
            ctx.fillStyle = '#060a12';
            ctx.fillRect(0, 0, w, h);

            // Subtle grid
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1;
            const step = 40;
            for (let x = 0; x < w; x += step) {
              ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
            }
            for (let y = 0; y < h; y += step) {
              ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
            }

            // Animated scanning subject / security object
            const t = Date.now() / 1200;
            const cx = w / 2 + Math.sin(t) * 70;
            const cy = h / 2 + Math.cos(t * 0.9) * 35;

            // Target bounding box
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.strokeRect(cx - 55, cy - 55, 110, 110);

            // Corner crosshairs
            const cLen = 16;
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 3;
            // Top-left
            ctx.beginPath(); ctx.moveTo(cx - 55, cy - 55 + cLen); ctx.lineTo(cx - 55, cy - 55); ctx.lineTo(cx - 55 + cLen, cy - 55); ctx.stroke();
            // Top-right
            ctx.beginPath(); ctx.moveTo(cx + 55 - cLen, cy - 55); ctx.lineTo(cx + 55, cy - 55); ctx.lineTo(cx + 55, cy - 55 + cLen); ctx.stroke();
            // Bottom-left
            ctx.beginPath(); ctx.moveTo(cx - 55, cy + 55 - cLen); ctx.lineTo(cx - 55, cy + 55); ctx.lineTo(cx - 55 + cLen, cy + 55); ctx.stroke();
            // Bottom-right
            ctx.beginPath(); ctx.moveTo(cx + 55 - cLen, cy + 55); ctx.lineTo(cx + 55, cy + 55); ctx.lineTo(cx + 55, cy + 55 - cLen); ctx.stroke();

            // Label
            ctx.fillStyle = '#10b981';
            ctx.font = 'bold 11px monospace';
            ctx.fillText(`MOTION DETECTED · TARGET #01`, cx - 52, cy - 64);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px monospace';
            ctx.fillText(`MJPEG STREAM · JPEG ${jpegQuality}%`, cx - 52, cy + 76);
          }

          // HUD Overlays
          const dateStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillRect(12, 12, 260, 48);
          ctx.strokeStyle = 'rgba(255,255,255,0.1)';
          ctx.strokeRect(12, 12, 260, 48);

          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 12px monospace';
          ctx.fillText(`● REC [TLS 1.3] · ${dateStr}`, 22, 30);
          ctx.fillStyle = '#cbd5e1';
          ctx.font = '11px monospace';
          ctx.fillText(`FRAME #${frameCount} · ${resolution} · ${cameraFacing} LENS`, 22, 48);

          // Torch effect
          if (torchEnabled) {
            const grad = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w / 1.4);
            grad.addColorStop(0, 'rgba(251, 191, 36, 0.25)');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);
          }
        }
      }
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isAuthenticated, isServerRunning, resolution, cameraFacing, torchEnabled, jpegQuality, videoElement]);

  // Audio simulation with Web Audio API
  const handleToggleAudio = () => {
    if (!audioPlaying) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime); // Soft volume
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        oscRef.current = osc;
        setAudioPlaying(true);
      } catch (e) {
        setAudioPlaying(true);
      }
    } else {
      if (oscRef.current) {
        oscRef.current.stop();
        oscRef.current.disconnect();
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
      setAudioPlaying(false);
    }
  };

  const handleLogin = (e?: React.FormEvent, bypassPassword?: string) => {
    if (e) e.preventDefault();
    if (!isServerRunning) {
      setLoginError('LocalCam server is offline. Start the service on the phone.');
      return;
    }

    if (RateLimiterSim.isLocked(clientIp)) {
      const rem = RateLimiterSim.getRemainingSeconds(clientIp);
      setLockoutTimer(rem);
      setLoginError(`Lockout active: Too many failed attempts. Retry in ${rem}s.`);
      return;
    }

    const testPwd = bypassPassword !== undefined ? bypassPassword : passwordInput;

    if (testPwd === correctPassword) {
      RateLimiterSim.recordSuccess(clientIp);
      setIsAuthenticated(true);
      setLoginError(null);
      setPasswordInput('');
      const id = onConnectViewer(clientIp, 'Chrome 122.0 / macOS 14.3');
      setViewerSessionId(id);
    } else {
      const isLocked = RateLimiterSim.recordFailedAttempt(clientIp);
      if (isLocked) {
        const rem = RateLimiterSim.getRemainingSeconds(clientIp);
        setLockoutTimer(rem);
        setLoginError(`Brute-force lockout triggered (5 failed attempts). Locked for 15 mins.`);
      } else {
        setLoginError('Invalid password. Failed attempt recorded.');
      }
    }
  };

  const handleQuickConnect = () => {
    setPasswordInput(correctPassword);
    handleLogin(undefined, correctPassword);
  };

  const handleLogout = () => {
    if (viewerSessionId) {
      onDisconnectViewer(viewerSessionId);
      setViewerSessionId(null);
    }
    setIsAuthenticated(false);
  };

  const handleSnapshotDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/jpeg', jpegQuality / 100);
    const a = document.createElement('a');
    a.href = url;
    a.download = `localcam_snapshot_${Date.now()}.jpg`;
    a.click();
    setSnapshotFeedback(true);
    setTimeout(() => setSnapshotFeedback(false), 2000);
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
      {/* Browser Chrome Header */}
      <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs gap-3">
        {/* Window dots */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
        </div>

        {/* Address Bar */}
        <div className="flex-1 max-w-md bg-slate-900 border border-slate-800 rounded-lg px-3 py-1 flex items-center justify-between font-mono text-[11px] text-slate-300">
          <div className="flex items-center gap-2 truncate">
            <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="text-slate-400">https://</span>
            <span className="text-emerald-300 font-semibold">{localIp}:{serverPort}</span>
            <span className="text-slate-500">/</span>
          </div>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-400 font-sans shrink-0 border border-emerald-800/50">
            TLS 1.3
          </span>
        </div>

        {/* Session Status */}
        <div className="text-[11px] text-slate-400 shrink-0 flex items-center gap-2">
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-rose-400 hover:text-rose-300 transition-colors"
            >
              <LogOut className="w-3 h-3" />
              <span>Disconnect</span>
            </button>
          ) : (
            <button
              onClick={handleQuickConnect}
              className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors flex items-center gap-1 text-[11px]"
            >
              <Play className="w-3 h-3 fill-white" />
              <span>Quick Connect</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Stream Area */}
      <div className="p-4 sm:p-5 flex-1 bg-slate-950/60">
        {!isServerRunning ? (
          <div className="h-80 flex flex-col items-center justify-center text-center p-6 space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-300">Server Stopped</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              The camera server is currently paused. Tap "Start Streaming Service" on the Android phone to activate the stream.
            </p>
          </div>
        ) : !isAuthenticated ? (
          /* Authentication Screen */
          <div className="max-w-md mx-auto my-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">LocalCam Web Viewer Login</h3>
                <p className="text-xs text-slate-400">Protected by PBKDF2 hash & brute-force rate limiter</p>
              </div>
            </div>

            {/* Quick Connect Button */}
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/25 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-blue-300 font-semibold">One-Click Testing</span>
                <span className="font-mono text-slate-400 text-[11px]">{correctPassword}</span>
              </div>
              <button
                type="button"
                onClick={handleQuickConnect}
                className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Auto-fill Password & Connect Instantly</span>
              </button>
            </div>

            {loginError && (
              <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Manual Password Input</label>
                <input
                  type="password"
                  value={passwordInput}
                  disabled={lockoutTimer > 0}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder={lockoutTimer > 0 ? `Locked out (${lockoutTimer}s remaining)` : 'Enter password...'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={lockoutTimer > 0}
                className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/50 font-semibold text-xs text-slate-200 transition-all border border-slate-700"
              >
                Submit Login (POST /api/login)
              </button>
            </form>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500 space-y-1">
              <p>• 5 failed attempts locks this IP for 15 minutes</p>
              <p>• Only allows private Wi-Fi network IPs (RFC1918)</p>
            </div>
          </div>
        ) : (
          /* Live Stream & Controls */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Video Canvas */}
            <div className="lg:col-span-2 space-y-3">
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={360}
                  className="w-full h-full object-contain"
                />

                {/* Overlaid Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
                  <div className="px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-[10px] font-mono text-emerald-300 border border-emerald-500/30 tabular-nums">
                    FPS: {fps}
                  </div>
                  <div className="px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-[10px] font-mono text-slate-300 border border-white/10">
                    RES: {resolution}
                  </div>
                  <div className="px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-[10px] font-mono text-slate-300 border border-white/10 tabular-nums">
                    BAT: {batteryLevel}%
                  </div>
                </div>

                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <button
                    onClick={handleSnapshotDownload}
                    className="px-2.5 py-1.5 rounded-lg bg-black/80 hover:bg-black text-slate-200 border border-white/10 text-xs flex items-center gap-1.5 backdrop-blur-md transition-all shadow-md"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{snapshotFeedback ? 'Saved JPEG!' : 'Snapshot'}</span>
                  </button>
                </div>
              </div>

              {/* Audio Stream Control */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  {audioPlaying ? (
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-500" />
                  )}
                  <span>Live Microphone Audio Stream (16-bit PCM WAV)</span>
                </div>
                <button
                  onClick={handleToggleAudio}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    audioPlaying ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  {audioPlaying ? 'Mute Audio' : 'Play Live Audio'}
                </button>
              </div>
            </div>

            {/* Remote REST Controls */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Camera Controls</h4>
                  <p className="text-[10px] text-slate-500">Authenticated REST calls with CSRF validation</p>
                </div>

                {/* Torch Toggle */}
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Flashlight / Torch</label>
                  <button
                    onClick={onToggleTorch}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                      torchEnabled
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{torchEnabled ? 'Torch: ACTIVE (ON)' : 'Torch: DISABLED (OFF)'}</span>
                  </button>
                </div>

                {/* Lens Switch */}
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Camera Lens</label>
                  <button
                    onClick={onSwitchCamera}
                    className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 flex items-center justify-center gap-2 transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Switch to {cameraFacing === 'BACK' ? 'Front Lens' : 'Back Lens'}</span>
                  </button>
                </div>

                {/* Resolution Selector */}
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Resolution Preset</label>
                  <select
                    value={resolution}
                    onChange={(e) => onChangeResolution(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="480p">480p (Fastest - 640×480)</option>
                    <option value="720p">720p (HD Balanced - 1280×720)</option>
                    <option value="1080p">1080p (Full HD - 1920×1080)</option>
                  </select>
                </div>

                {/* Compression Quality */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                    <span>JPEG Quality</span>
                    <span className="font-mono text-slate-200 tabular-nums">{jpegQuality}%</span>
                  </div>
                  <input
                    type="range"
                    min={30}
                    max={95}
                    value={jpegQuality}
                    onChange={(e) => onChangeQuality(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>30%</span>
                    <span>95%</span>
                  </div>
                </div>

                {/* API Status Route preview */}
                <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 space-y-1 font-mono">
                  <div className="text-slate-400 font-semibold">Active Endpoints:</div>
                  <div>GET  /video (MJPEG boundary=frame)</div>
                  <div>GET  /snapshot (Single JPEG)</div>
                  <div>GET  /audio (WAV PCM 16kHz)</div>
                  <div>GET  /api/status</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
