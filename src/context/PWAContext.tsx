import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface PWAContextType {
  isOnline: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  canInstall: boolean;
  hasUpdate: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isInstallModalOpen: boolean;
  setIsInstallModalOpen: (open: boolean) => void;
  promptInstall: () => Promise<boolean>;
  updateApp: () => void;
  swRegistration: ServiceWorkerRegistration | null;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [hasUpdate, setHasUpdate] = useState<boolean>(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);

  // Platform Detections
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isAndroid, setIsAndroid] = useState<boolean>(false);
  const [isSafari, setIsSafari] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroidDevice = /android/.test(ua);
    const isSafariBrowser = /safari/.test(ua) && !/chrome|chromium|edg|crios|fxios/.test(ua);

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);
    setIsSafari(isSafariBrowser);

    // Check standalone mode (PWA installed and running in window)
    const checkStandalone = () => {
      const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
      const isStandaloneNavigator = (window.navigator as any).standalone === true;
      const isStandaloneDoc = document.referrer.includes('android-app://');
      const standalone = isStandaloneMedia || isStandaloneNavigator || isStandaloneDoc;
      setIsStandalone(standalone);
      if (standalone) {
        setIsInstalled(true);
      }
    };

    checkStandalone();

    // Listen for Online / Offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for BeforeInstallPrompt event (Chrome / Edge / Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    // Listen for AppInstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
      console.log('[PWA] ZookaRestoPos application was installed successfully.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Register Service Worker
    if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'test') {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          setSwRegistration(reg);
          console.log('[PWA] Service Worker registered with scope:', reg.scope);

          // Check if there is already a waiting worker (update available)
          if (reg.waiting) {
            setHasUpdate(true);
          }

          // Listen for new updates
          reg.addEventListener('updatefound', () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setHasUpdate(true);
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });

      // Reload window when new service worker takes over
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Trigger Native Install Prompt
  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setCanInstall(false);
          setDeferredPrompt(null);
          return true;
        }
      } catch (err) {
        console.error('[PWA] Error during install prompt:', err);
      }
      return false;
    } else {
      // Open modal with iOS Safari / Manual install instructions
      setIsInstallModalOpen(true);
      return false;
    }
  }, [deferredPrompt]);

  // Activate Waiting Service Worker
  const updateApp = useCallback(() => {
    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  }, [swRegistration]);

  return (
    <PWAContext.Provider
      value={{
        isOnline,
        isInstalled,
        isStandalone,
        canInstall: canInstall || isIOS, // iOS users can always install via Add to Home Screen
        hasUpdate,
        isIOS,
        isAndroid,
        isSafari,
        isInstallModalOpen,
        setIsInstallModalOpen,
        promptInstall,
        updateApp,
        swRegistration,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
};

export const usePWA = (): PWAContextType => {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
};
