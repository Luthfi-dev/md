
'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useToast } from './use-toast';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallContextType {
  canInstall: boolean;
  isInstalled: boolean;
  promptInstall: () => void;
}

const PWAInstallContext = createContext<PWAInstallContextType | undefined>(undefined);

export const usePWAInstall = () => {
  const context = useContext(PWAInstallContext);
  if (!context) {
    throw new Error('usePWAInstall must be used within a PWAInstallProvider');
  }
  return context;
};

export const PWAInstallProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
     // Register the service worker and handle versioning
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
          
          // Send version ID to the service worker
          const metaElement = document.querySelector('meta[name="app-version"]');
          const versionId = metaElement ? metaElement.getAttribute('content') : 'unknown';

          if (registration.active) {
            registration.active.postMessage({ type: 'SET_VERSION', versionId });
          }
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            console.log('New service worker found, installing...');
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New content is available and waiting to be activated.
                    // You can show a notification to the user here.
                    console.log('New version is available. Please refresh.');
                    toast({
                      title: "Pembaruan Tersedia",
                      description: "Tutup dan buka kembali aplikasi untuk menggunakan versi terbaru."
                    })
                }
              });
            }
          });

        }).catch(error => {
          console.error('Service Worker registration failed:', error);
        });
      });
    }

    // Check if the app is already installed
    if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
    
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      toast({
        title: "Instalasi Berhasil!",
        description: "Aplikasi Maudigi telah ditambahkan ke layar utama Anda.",
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [toast]);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      toast({ variant: 'destructive', title: 'Tidak Dapat Menginstal', description: 'Prompt instalasi tidak tersedia.'});
      return;
    }
    await deferredPrompt.prompt();
    setDeferredPrompt(null);
  }, [deferredPrompt, toast]);

  const value = {
    canInstall: !!deferredPrompt,
    isInstalled,
    promptInstall,
  };

  return <PWAInstallContext.Provider value={value}>{children}</PWAInstallContext.Provider>;
};
