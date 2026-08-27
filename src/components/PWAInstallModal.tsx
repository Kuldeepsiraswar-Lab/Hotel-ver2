import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  X, 
  Smartphone, 
  Monitor, 
  Tablet, 
  Wifi, 
  WifiOff, 
  Zap, 
  CheckCircle2, 
  Sparkles, 
  Share2, 
  PlusSquare, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { usePWA } from '../context/PWAContext';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const {
    isOnline,
    isInstalled,
    isStandalone,
    canInstall,
    isIOS,
    isAndroid,
    promptInstall
  } = usePWA();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const success = await promptInstall();
    if (success) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          id="pwa-install-modal"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white relative flex items-start justify-between border-b border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/30 shrink-0">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    Install RestoPOS App
                  </h3>
                  <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-[10px] rounded-full uppercase tracking-wider">
                    PWA Ready
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                  Launch RestoPOS in full-screen window with offline billing support
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200">
            
            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-2">
                  <Zap className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Zero Latency</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Instant launch from Home Screen without address bar clutter.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2">
                  <WifiOff className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">100% Offline POS</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Process orders and print receipts even if Wi-Fi disconnects.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-2">
                  <Tablet className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Multi-Device</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Ideal for iPads, Android tablets, touch monitors, and Windows PCs.
                </p>
              </div>
            </div>

            {/* Platform Instructions */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Installation Instructions
              </h4>

              {/* iOS Safari Guide */}
              <div className={`p-4 rounded-2xl border ${isIOS ? 'bg-amber-500/5 border-amber-500/30' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'}`}>
                <div className="flex items-center gap-2 mb-2.5">
                  <Smartphone className="w-4 h-4 text-amber-500" />
                  <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Apple iPad & iPhone (Safari)
                  </h5>
                  {isIOS && (
                    <span className="text-[10px] bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded font-bold">
                      Your Device
                    </span>
                  )}
                </div>
                <ol className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                    <span>Tap the <strong>Share</strong> icon <Share2 className="w-3.5 h-3.5 inline mx-1 text-blue-500" /> at the bottom or top of Safari.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                    <span>Scroll down and tap <strong>Add to Home Screen</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-slate-700 dark:text-slate-300" />.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                    <span>Tap <strong>Add</strong> in the top right corner. The RestoPOS app icon will appear on your home screen!</span>
                  </li>
                </ol>
              </div>

              {/* Chrome, Edge & Android Guide */}
              <div className={`p-4 rounded-2xl border ${!isIOS ? 'bg-amber-500/5 border-amber-500/30' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'}`}>
                <div className="flex items-center gap-2 mb-2.5">
                  <Monitor className="w-4 h-4 text-amber-500" />
                  <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Desktop PC, Mac & Android (Chrome / Edge / Brave)
                  </h5>
                  {!isIOS && (
                    <span className="text-[10px] bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded font-bold">
                      Supported
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
                  Click the <strong>Install App</strong> button below, or click the download icon in your browser's address bar to install RestoPOS as a dedicated application window.
                </p>

                {canInstall && !isInstalled && (
                  <button
                    onClick={handleInstallClick}
                    className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install RestoPOS on this Device</span>
                  </button>
                )}

                {isInstalled && (
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>RestoPOS is installed and ready on this device!</span>
                  </div>
                )}
              </div>
            </div>

            {/* Offline Sync Assurance Note */}
            <div className="flex items-start gap-2.5 p-3 bg-slate-100 dark:bg-slate-800/70 rounded-xl text-[11px] text-slate-600 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                <strong>Cloud & Local Dual-Sync:</strong> Even if your internet connection drops during peak dinner rush, cashiers can continue taking orders and printing thermal receipts smoothly.
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-end gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
