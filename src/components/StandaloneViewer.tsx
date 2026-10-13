import React, { useState, useEffect, useRef } from 'react';
import { Lock, Volume2, VolumeX, Camera, RotateCcw, Zap, Download, LogOut, ShieldCheck, AlertCircle, Play, ExternalLink } from 'lucide-react';
import { StreamChannel } from '../utils/streamChannel';

export const StandaloneViewer: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [passwordInput, setPasswordInput] = useState('');
  const [correctPassword, setCorrectPassword] = useState('K9#mQ4!vL9$x2w');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [fps, setFps] = useState<number>(26.4);
  const [resolution, setResolution] = useState('720p');
  const [jpegQuality, setJpegQuality] = useState(75);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'BACK' | 'FRONT'>('BACK');
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [isPhoneConnected, setIsPhoneConnected] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Subscribe to BroadcastChannel messages from main Phone tab
  useEffect(() => {
    const unsubscribe = StreamChannel.subscribe((msg) => {
      if (msg.type === 'STATUS_UPDATE') {
        const p = msg.payload;
        if (p.password) setCorrectPassword(p.password);
        if (p.resolution) setResolution(p.resolution);
        if (p.jpegQuality) setJpegQuality(p.jpegQuality);
        if (p.torchEnabled !== undefined) setTorchEnabled(p.torchEnabled);
        if (p.cameraFacing) setCameraFacing(p.cameraFacing);
        if (p.fps) setFps(p.fps);
        setIsPhoneConnected(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // Live Canvas Rendering
  useEffect(() => {
    if (!isAuthenticated) return;
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

          ctx.fillStyle = '#060a12';
          ctx.fillRect(0, 0, w, h);

          // Grid
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;
          const step = 40;
          for (let x = 0; x < w; x += step) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
          }
          for (let y = 0; y < h; y += step) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
          }

          // Animated tracking box
          const t = Date.now() / 1200;
          const cx = w / 2 + Math.sin(t) * 80;
          const cy = h / 2 + Math.cos(t * 0.9) * 40;

          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.strokeRect(cx - 55, cy - 55, 110, 110);

          const cLen = 16;
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(cx - 55, cy - 55 + cLen); ctx.lineTo(cx - 55, cy - 55); ctx.lineTo(cx - 55 + cLen, cy - 55); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx + 55 - cLen, cy - 55); ctx.lineTo(cx + 55, cy - 55); ctx.lineTo(cx + 55, cy - 55 + cLen); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx - 55, cy + 55 - cLen); ctx.lineTo(cx - 55, cy + 55); ctx.lineTo(cx - 55 + cLen, cy + 55); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx + 55 - cLen, cy + 55); ctx.lineTo(cx + 55, cy + 55); ctx.lineTo(cx + 55, cy + 55 - cLen); ctx.stroke();

          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 11px monospace';
          ctx.fillText(`STANDALONE BROWSER TAB · CONNECTED`, cx - 52, cy - 64);
          ctx.fillStyle = '#94a3b8';
          ctx.font = '10px monospace';
          ctx.fillText(`MJPEG STREAM · JPEG ${jpegQuality}%`, cx - 52, cy + 76);

          // Timestamp overlay
          const dateStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillRect(12, 12, 280, 48);
          ctx.strokeStyle = 'rgba(255,255,255,0.1)';
          ctx.strokeRect(12, 12, 280, 48);

          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 12px monospace';
          ctx.fillText(`● REC [TLS 1.3] · ${dateStr}`, 22, 30);
          ctx.fillStyle = '#cbd5e1';
          ctx.font = '11px monospace';
          ctx.fillText(`FRAME #${frameCount} · ${resolution} · ${cameraFacing} LENS`, 22, 48);

          // Torch glow
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
  }, [isAuthenticated, resolution, cameraFacing, torchEnabled, jpegQuality]);

  const sendCommand = (action: string, data?: any) => {
    StreamChannel.broadcast({
      type: 'COMMAND',
      payload: { action, data },
    });
  };

  const handleToggleTorch = () => {
    const next = !torchEnabled;
    setTorchEnabled(next);
    sendCommand('SET_TORCH', next);
  };

  const handleSwitchCamera = () => {
    const next = cameraFacing === 'BACK' ? 'FRONT' : 'BACK';
    setCameraFacing(next);
    sendCommand('SWITCH_CAMERA', next);
  };

  const handleChangeResolution = (res: string) => {
    setResolution(res);
    sendCommand('SET_RESOLUTION', res);
  };

  const handleChangeQuality = (q: number) => {
    setJpegQuality(q);
    sendCommand('SET_QUALITY', q);
  };

  const handleSnapshotDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/jpeg', jpegQuality / 100);
    const a = document.createElement('a');
    a.href = url;
    a.download = `localcam_snapshot_${Date.now()}.jpg`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="px-6 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm">
            LC
          </div>
          <div>
            <span className="font-bold text-white text-sm">LocalCam Streamer — Standalone Web Client</span>
            <span className="text-[10px] text-emerald-400 block font-mono">TLS 1.3 · Live Cross-Tab Channel</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            Linked to Phone Tab: <strong className="text-emerald-400">ACTIVE</strong>
          </span>
          <button
            onClick={() => window.close()}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
          >
            Close Tab
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stream Canvas */}
          <div className="lg:col-span-2 space-y-3">
            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
              <canvas
                ref={canvasRef}
                width={640}
                height={360}
                className="w-full h-full object-contain"
              />

              <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
                <div className="px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-[10px] font-mono text-emerald-300 border border-emerald-500/30">
                  FPS: {fps}
                </div>
                <div className="px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-[10px] font-mono text-slate-300 border border-white/10">
                  RES: {resolution}
                </div>
              </div>

              <div className="absolute bottom-3 right-3">
                <button
                  onClick={handleSnapshotDownload}
                  className="px-3 py-1.5 rounded-lg bg-black/80 hover:bg-black text-slate-200 border border-white/10 text-xs flex items-center gap-1.5 backdrop-blur-md transition-all shadow-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Snapshot</span>
                </button>
              </div>
            </div>

            {/* Audio Toggle */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>Microphone Audio Stream (16-bit PCM WAV)</span>
              </div>
              <button
                onClick={() => setAudioPlaying(!audioPlaying)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                  audioPlaying ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                }`}
              >
                {audioPlaying ? 'Mute Audio' : 'Play Live Audio'}
              </button>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Remote Controls</h4>
                <p className="text-[10px] text-slate-500">Commands sync live back to the phone simulator</p>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Flashlight / Torch</label>
                <button
                  onClick={handleToggleTorch}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                    torchEnabled
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{torchEnabled ? 'Torch: ON' : 'Torch: OFF'}</span>
                </button>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Camera Lens</label>
                <button
                  onClick={handleSwitchCamera}
                  className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 flex items-center justify-center gap-2 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Switch Lens ({cameraFacing === 'BACK' ? 'Back' : 'Front'})</span>
                </button>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Resolution Preset</label>
                <select
                  value={resolution}
                  onChange={(e) => handleChangeResolution(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="480p">480p (640×480)</option>
                  <option value="720p">720p (1280×720)</option>
                  <option value="1080p">1080p (1920×1080)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span>JPEG Compression Quality</span>
                  <span className="font-mono text-slate-200">{jpegQuality}%</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={95}
                  value={jpegQuality}
                  onChange={(e) => handleChangeQuality(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
