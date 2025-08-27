
'use client';
import { useEffect } from 'react';
import { useToast } from './use-toast';

const VERSION_STORAGE_KEY = 'app-version';

async function clearCaches() {
    console.log('Clearing caches...');
    // 1. Clear standard browser cache
    const keys = await caches.keys();
    await Promise.all(keys.map(key => caches.delete(key)));

    // 2. Unregister service workers
    if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(registration => registration.unregister()));
    }
    console.log('Caches cleared.');
}


export function useCacheBuster() {
    const { toast } = useToast();

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const serverVersion = document.querySelector('meta[name="app-version"]')?.getAttribute('content');
        const localVersion = localStorage.getItem(VERSION_STORAGE_KEY);

        if (serverVersion && localVersion && serverVersion !== localVersion) {
            console.log(`Version mismatch detected. Server: ${serverVersion}, Local: ${localVersion}. Updating...`);
            
            toast({
                title: "Aplikasi Diperbarui!",
                description: "Membersihkan cache dan memuat versi terbaru...",
                duration: 60000, // Keep toast open while reloading
            });

            clearCaches().then(() => {
                localStorage.setItem(VERSION_STORAGE_KEY, serverVersion);
                // Force a hard reload to fetch all new assets
                window.location.reload(true);
            });
        } else if (!localVersion && serverVersion) {
            // First visit, just set the version
            localStorage.setItem(VERSION_STORAGE_KEY, serverVersion);
        }
    }, [toast]);
}
