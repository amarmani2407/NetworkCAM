/**
 * LocalCam Streamer - Android Security Camera & Web Viewer Studio
 * Senior Android Security & Systems Engineering Workspace
 */

import React, { useState, useEffect } from 'react';
import { AndroidPhoneSimulator } from './components/AndroidPhoneSimulator';
import { BrowserWebViewer } from './components/BrowserWebViewer';
import { StandaloneViewer } from './components/StandaloneViewer';
import { ConnectionDiagnosticModal } from './components/ConnectionDiagnosticModal';
import { TestRunner } from './components/TestRunner';
import { SecurityArchitecture } from './components/SecurityArchitecture';
import { UserGuide } from './components/UserGuide';
import { Download, ExternalLink, Video, AlertCircle, HelpCircle, Check, Copy } from 'lucide-react';
import JSZip from 'jszip';
import { ANDROID_PROJECT_FILES } from './data/androidProject';
import { StreamChannel } from './utils/streamChannel';

export default function App() {
  // If user opened this in a separate browser tab (?view=viewer), render standalone viewer!
  const isStandalone = typeof window !== 'undefined' && window.location.search.includes('view=viewer');
  if (isStandalone) {
    return <StandaloneViewer />;
  }

  const [activeTab, setActiveTab] = useState<'simulator' | 'guide' | 'security' | 'tests'>('simulator');
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);

  // Shared state between Android Device and Web Viewer
  const [isServerRunning, setIsServerRunning] = useState(true);
  const [localIp, setLocalIp] = useState('192.168.1.142');
  const [serverPort, setServerPort] = useState(8443);
  const [password, setPassword] = useState('K9#mQ4!vL9$x2w');
  const [certFingerprint, setCertFingerprint] = useState(
    'D4:8F:A1:39:B2:7C:E6:01:8A:2F:5D:90:3E:44:11:A7:6B:88:99:C3:02:14:FE:5A:6D:88:31:AA:BC:DE:F0:12'
  );
  const [activeViewers, setActiveViewers] = useState<Array<{ id: string; ip: string; userAgent: string; connectedAt: number }>>([
    { id: 'v1', ip: '192.168.1.189', userAgent: 'Chrome 122.0 / macOS 14.3', connectedAt: Date.now() - 45000 },
  ]);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [allowPublicIps, setAllowPublicIps] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'BACK' | 'FRONT'>('BACK');
  const [resolution, setResolution] = useState('720p');
  const [jpegQuality, setJpegQuality] = useState(75);
  const [sharedVideoElement, setSharedVideoElement] = useState<HTMLVideoElement | null>(null);

  const [isExporting, setIsExporting] = useState(false);

  // Broadcast state changes to any separate browser tabs
  useEffect(() => {
    StreamChannel.broadcast({
      type: 'STATUS_UPDATE',
      payload: {
        isServerRunning,
        localIp,
        serverPort,
        password,
        torchEnabled,
        cameraFacing,
        resolution,
        jpegQuality,
        fps: 26.5,
      },
    });
  }, [isServerRunning, localIp, serverPort, password, torchEnabled, cameraFacing, resolution, jpegQuality]);

  // Listen to remote commands from separate browser tabs
  useEffect(() => {
    const unsubscribe = StreamChannel.subscribe((msg) => {
      if (msg.type === 'COMMAND') {
        const { action, data } = msg.payload || {};
        if (action === 'SET_TORCH') setTorchEnabled(Boolean(data));
        if (action === 'SWITCH_CAMERA') setCameraFacing(data);
        if (action === 'SET_RESOLUTION') setResolution(data);
        if (action === 'SET_QUALITY') setJpegQuality(data);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleToggleServer = () => {
    if (isServerRunning) {
      setIsServerRunning(false);
      setActiveViewers([]);
    } else {
      setIsServerRunning(true);
      setActiveViewers([{ id: 'v1', ip: '192.168.1.189', userAgent: 'Chrome 122.0 / macOS 14.3', connectedAt: Date.now() }]);
    }
  };

  const handleUpdatePassword = (newPwd: string): boolean => {
    if (newPwd.length < 10) return false;
    setPassword(newPwd);
    return true;
  };

  const handleConnectViewer = (ip: string, userAgent: string): string => {
    const id = 'v_' + Math.random().toString(36).substring(2, 8);
    setActiveViewers((prev) => [...prev, { id, ip, userAgent, connectedAt: Date.now() }]);
    return id;
  };

  const handleDisconnectViewer = (id: string) => {
    setActiveViewers((prev) => prev.filter((v) => v.id !== id));
  };

  const handleOpenSeparateTab = () => {
    const url = window.location.origin + window.location.pathname + '?view=viewer';
    window.open(url, '_blank');
  };

  const handleDownloadZip = async () => {
    setIsExporting(true);
    try {
      const zip = new JSZip();
      ANDROID_PROJECT_FILES.forEach((file) => {
        zip.file(file.path, file.content);
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'LocalCamStreamer-Android-Project.zip';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to create zip:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-900 border-b border-slate-800 shrink-0 sticky top-0 z-40">
        {/* Zone 1: Brand wordmark */}
        <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm shadow-md shadow-blue-900/30">
            LC
          </div>
          <span className="text-base font-bold tracking-tight text-white">LocalCam Streamer</span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors ${
              activeTab === 'simulator' ? 'text-white border-b-2 border-blue-500 font-semibold' : 'hover:text-white'
            }`}
          >
            Live Streamer & Viewer
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors ${
              activeTab === 'guide' ? 'text-white border-b-2 border-blue-500 font-semibold' : 'hover:text-white'
            }`}
          >
            User Guide & Setup
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors ${
              activeTab === 'security' ? 'text-white border-b-2 border-blue-500 font-semibold' : 'hover:text-white'
            }`}
          >
            Security Architecture
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors ${
              activeTab === 'tests' ? 'text-white border-b-2 border-blue-500 font-semibold' : 'hover:text-white'
            }`}
          >
            Unit Tests
          </button>
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleDownloadZip}
            disabled={isExporting}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 shadow-md shadow-blue-900/30 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Exporting...' : 'Export Android ZIP'}</span>
          </button>
        </div>
      </header>

      {/* Mobile Nav Bar */}
      <div className="md:hidden flex items-center gap-1 overflow-x-auto px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab('simulator')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap ${activeTab === 'simulator' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'}`}
        >
          Live Streamer & Viewer
        </button>
        <button
          onClick={() => setActiveTab('guide')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap ${activeTab === 'guide' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'}`}
        >
          User Guide & Setup
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap ${activeTab === 'security' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'}`}
        >
          Security Architecture
        </button>
        <button
          onClick={() => setActiveTab('tests')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap ${activeTab === 'tests' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'}`}
        >
          Unit Tests
        </button>
      </div>

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Important Connection Helper Banner */}
        {activeTab === 'simulator' && (
          <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-blue-950/60 to-slate-900 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white block">
                  Got "ERR_CONNECTION_TIMED_OUT" when pasting {localIp}?
                </span>
                <span className="text-slate-400">
                  {localIp} is an example local IP for physical Android hardware. If testing in your computer's browser right now, launch the Web Viewer in a separate tab!
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleOpenSeparateTab}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors flex items-center gap-1.5 text-xs shadow-md whitespace-nowrap"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Viewer in Separate Browser Tab</span>
              </button>
              <button
                onClick={() => setShowDiagnosticModal(true)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-xs whitespace-nowrap"
              >
                Learn More
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: LIVE SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Video className="w-4 h-4 text-emerald-400" />
                  <span>Interactive LocalCam Streamer & Web Client</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Left: Android Phone Camera Service · Right: Live Browser Web Viewer on Local Wi-Fi
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Server State:</span>
                <span className={`px-2.5 py-0.5 rounded font-mono font-semibold text-[11px] ${
                  isServerRunning ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                }`}>
                  {isServerRunning ? `STREAMING on ${localIp}:${serverPort}` : 'STOPPED'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              {/* Left Column: Android Phone (5 Cols) */}
              <div className="xl:col-span-5 flex justify-center">
                <AndroidPhoneSimulator
                  isServerRunning={isServerRunning}
                  onToggleServer={handleToggleServer}
                  localIp={localIp}
                  serverPort={serverPort}
                  password={password}
                  onUpdatePassword={handleUpdatePassword}
                  certFingerprint={certFingerprint}
                  activeViewers={activeViewers}
                  onDisconnectViewer={handleDisconnectViewer}
                  audioEnabled={audioEnabled}
                  onToggleAudio={setAudioEnabled}
                  allowPublicIps={allowPublicIps}
                  onTogglePublicIps={setAllowPublicIps}
                  torchEnabled={torchEnabled}
                  onToggleTorch={() => setTorchEnabled(!torchEnabled)}
                  cameraFacing={cameraFacing}
                  onSwitchCamera={() => setCameraFacing(cameraFacing === 'BACK' ? 'FRONT' : 'BACK')}
                  resolution={resolution}
                  jpegQuality={jpegQuality}
                  onVideoElementReady={(el) => setSharedVideoElement(el)}
                />
              </div>

              {/* Right Column: Browser Web Viewer (7 Cols) */}
              <div className="xl:col-span-7 space-y-4">
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white">Browser Client (Same Wi-Fi Network)</span>
                    <span className="text-slate-500 block text-[11px]">
                      Accesses GET /video (MJPEG stream) and REST controls with session token & CSRF protection
                    </span>
                  </div>
                  <button
                    onClick={handleOpenSeparateTab}
                    className="text-blue-400 hover:text-blue-300 text-xs font-semibold flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Pop out to tab</span>
                  </button>
                </div>

                <BrowserWebViewer
                  isServerRunning={isServerRunning}
                  localIp={localIp}
                  serverPort={serverPort}
                  correctPassword={password}
                  torchEnabled={torchEnabled}
                  onToggleTorch={() => setTorchEnabled(!torchEnabled)}
                  cameraFacing={cameraFacing}
                  onSwitchCamera={() => setCameraFacing(cameraFacing === 'BACK' ? 'FRONT' : 'BACK')}
                  resolution={resolution}
                  onChangeResolution={setResolution}
                  jpegQuality={jpegQuality}
                  onChangeQuality={setJpegQuality}
                  audioEnabled={audioEnabled}
                  onConnectViewer={handleConnectViewer}
                  onDisconnectViewer={handleDisconnectViewer}
                  videoElement={sharedVideoElement}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USER GUIDE & SETUP */}
        {activeTab === 'guide' && (
          <UserGuide onExportZip={handleDownloadZip} isExporting={isExporting} />
        )}

        {/* TAB 3: SECURITY ARCHITECTURE */}
        {activeTab === 'security' && (
          <SecurityArchitecture />
        )}

        {/* TAB 4: UNIT TESTS */}
        {activeTab === 'tests' && (
          <div className="space-y-4">
            <TestRunner />
          </div>
        )}
      </main>

      {/* Connection Diagnostic Modal */}
      <ConnectionDiagnosticModal
        isOpen={showDiagnosticModal}
        onClose={() => setShowDiagnosticModal(false)}
        onOpenSeparateTab={handleOpenSeparateTab}
        currentIp={localIp}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 px-6 py-4 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <span>LocalCam Streamer</span>
          <span>·</span>
          <span>Android 14 Foreground Service & Ktor CIO Server</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[11px] text-emerald-400/90">TLS 1.2+ Only · RFC1918 Enforced</span>
        </div>
      </footer>
    </div>
  );
}
