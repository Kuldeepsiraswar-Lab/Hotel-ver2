import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  WifiOff, 
  RefreshCw, 
  X, 
  Smartphone, 
  Monitor, 
  CheckCircle2, 
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { usePWA } from '../context/PWAContext';

export const PWAInstallBanner: React.FC = () => {
  const {
    isOnline,
    isInstalled,
    isStandalone,
    canInstall,
    hasUpdate,
    isIOS,
    promptInstall,
    updateApp,
    setIsInstallModalOpen
  } = usePWA();

  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('restopos_pwa_banner_dismissed') === 'true';
    }
    return false;
  });

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('restopos_pwa_banner_dismissed', 'true');
    } catch (e) {}
  };

  const handleInstallClick = () => {
    if (isIOS) {
      setIsInstallModalOpen(true);
    } else {
      promptInstall();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] pointer-events-none">
      
      {/* 1. Offline Mode Alert Toast */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto p-3.5 bg-amber-500 text-slate-950 rounded-xl shadow-xl border border-amber-400 flex items-start gap-3"
            id="pwa-offline-alert"
          >
            <div className="p-1.5 bg-slate-950 text-amber-400 rounded-lg shrink-0 mt-0.5">
              <WifiOff className="w-4 h-4 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-950">Offline POS Mode Active</h4>
                <span className="text-[10px] bg-slate-950/20 px-1.5 py-0.5 rounded font-mono font-bold">Local Sync</span>
              </div>
              <p className="text-xs mt-0.5 text-slate-900 font-medium leading-tight">
                All bills, orders, and tables remain 100% operational. Data is safely cached locally and will sync when internet returns.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. New Version Available Update Alert */}
      <AnimatePresence>
        {hasUpdate && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto p-3.5 bg-emerald-600 text-white rounded-xl shadow-xl border border-emerald-500 flex items-center justify-between gap-3"
            id="pwa-update-alert"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 bg-white/20 rounded-lg shrink-0">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight">POS Update Available</h4>
                <p className="text-[11px] text-emerald-100 leading-tight">New features ready</p>
              </div>
            </div>
            <button
              onClick={updateApp}
              className="px-3 py-1.5 bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-xs rounded-lg shadow-xs transition-all shrink-0 cursor-pointer"
            >
              Update Now
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Install PWA Prompt Banner (If not yet installed & not dismissed) */}
      <AnimatePresence>
        {!isStandalone && !isInstalled && canInstall && !isDismissed && isOnline && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-auto p-4 bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-amber-500/40 relative overflow-hidden"
            id="pwa-install-banner"
          >
            {/* Ambient gold glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            <button
              onClick={handleDismiss}
              className="absolute top-2.5 right-2.5 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Dismiss for this session"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3.5 pr-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20 shrink-0">
                <Download className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-slate-100">Install ZookaRestoPos</h4>
                  <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 font-bold rounded">PWA</span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-snug">
                  Install on your Desktop, iPad, or Android for 1-click fullscreen launch and offline billing.
                </p>
              </div>
            </div>

            <div className="mt-3.5 flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={handleInstallClick}
                className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isIOS ? 'How to Install on iOS' : 'Install App Now'}</span>
              </button>

              <button
                onClick={() => setIsInstallModalOpen(true)}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                title="View installation guide"
              >
                Guide
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
