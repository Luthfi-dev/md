
'use client';

import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { MobileLayout } from './MobileLayout';
import { DesktopLayout } from './DesktopLayout';
import { Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-is-mobile';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Halaman-halaman ini memiliki layout sendiri dan tidak boleh dibungkus oleh Mobile/DesktopLayout
  const noLayoutPages = [
    '/admin', 
    '/account', 
    '/messages', 
    '/surat/share',
    '/surat/share-fallback'
  ];
  const needsAppLayout = !noLayoutPages.some(page => pathname.startsWith(page));

  if (!isClient) {
    // Tampilkan loader saat SSR atau sebelum client-side hydration
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
           <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  if (!needsAppLayout) {
    return <>{children}</>;
  }

  if (isMobile) {
    return <MobileLayout>{children}</MobileLayout>;
  }

  return <DesktopLayout>{children}</DesktopLayout>;
}
