import React from 'react';
import { AlertCircle, ExternalLink, Wifi, Smartphone, Monitor, ShieldCheck, CheckCircle2, X } from 'lucide-react';

interface ConnectionDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSeparateTab: () => void;
  currentIp: string;
}

export const ConnectionDiagnosticModal: React.FC<ConnectionDiagnosticModalProps> = ({
  isOpen,
  onClose,
  onOpenSeparateTab,
  currentIp,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 text-slate-200 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Why did {currentIp} time out in your PC browser?</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Resolution guide for <code className="text-amber-300">ERR_CONNECTION_TIMED_OUT</code>
            </p>
          </div>
        </div>

        {/* Two Case Scenarios */}
        <div className="space-y-4 text-xs">
          {/* Case A: Testing in PC Browser */}
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-2.5">
            <div className="flex items-center gap-2 text-blue-300 font-bold text-sm">
              <Monitor className="w-4 h-4" />
              <span>Case 1: You are testing in your computer's browser right now</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              <code className="text-amber-300 font-mono">{currentIp}</code> is an example IP address for an Android phone. If you haven't compiled and installed the app on a physical phone yet, your home router has nothing running at that IP address.
            </p>
            <div className="pt-1">
              <button
                onClick={() => {
                  onOpenSeparateTab();
                  onClose();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-md"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Live Web Viewer in a Real Separate Browser Tab</span>
              </button>
            </div>
            <p className="text-[11px] text-blue-300/80">
              * This opens a real standalone browser tab on your PC that streams live video and sends commands across tabs in real time using BroadcastChannel.
            </p>
          </div>

          {/* Case B: Testing on Real Physical Phone */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Smartphone className="w-4 h-4" />
              <span>Case 2: You already installed the app on your physical Android phone</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              If the app is installed on your physical device and you get a timeout, check these 4 items:
            </p>
            <div className="space-y-2 text-slate-400">
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-white shrink-0 mt-0.5">1</span>
                <div>
                  <strong className="text-slate-200">Check Your Phone's Actual IP:</strong> Your Wi-Fi router might have assigned <code className="text-blue-300 font-mono">192.168.1.45</code> or <code className="text-blue-300 font-mono">192.168.0.104</code>. Look at the exact IP displayed on your phone's screen.
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-white shrink-0 mt-0.5">2</span>
                <div>
                  <strong className="text-slate-200">Both Devices on Same Wi-Fi:</strong> Make sure your PC is not on a mobile hotspot, VPN, or Guest network while your phone is on the home Wi-Fi.
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-white shrink-0 mt-0.5">3</span>
                <div>
                  <strong className="text-slate-200">Disable "AP Isolation / Client Isolation" on Router:</strong> Some routers block Wi-Fi devices from talking to each other for security.
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-white shrink-0 mt-0.5">4</span>
                <div>
                  <strong className="text-slate-200">Must Include https:// and Port 8443:</strong> Type <code className="text-emerald-400 font-mono">https://YOUR_PHONE_IP:8443</code> (e.g. <code className="text-emerald-400 font-mono">https://192.168.1.25:8443</code>).
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
