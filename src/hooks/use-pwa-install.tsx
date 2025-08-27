
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
    // Check if the app is already installed
    if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
    
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
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
    // prompt() is a one-time use event.
    setDeferredPrompt(null);
  }, [deferredPrompt, toast]);

  const value = {
    canInstall: !!deferredPrompt,
    isInstalled,
    promptInstall,
  };

  return <PWAInstallContext.Provider value={value}>{children}</PWAInstallContext.Provider>;
};
