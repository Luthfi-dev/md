
'use client';

import { useIsMobile } from '@/hooks/use-is-mobile';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { MobileLayout } from './MobileLayout';
import { DesktopLayout } from './DesktopLayout';
import { Loader2 } from 'lucide-react';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Define routes that should NOT use the visual layouts.
  const noLayoutPages = [
    '/admin',
    '/login',
    '/account',
    '/messages',
    '/surat/share',
    '/surat/share-fallback'
  ];

  // If the current path is one of the no-layout pages, just render the children.
  if (noLayoutPages.some(page => pathname.startsWith(page))) {
    return <>{children}</>;
  }
  
  // Show a loader until the client-side check is complete.
  if (!isClient) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
           <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  // Once client-side, choose the correct layout based on screen size.
  if (isMobile) {
    return <MobileLayout>{children}</MobileLayout>;
  }

  return <DesktopLayout>{children}</DesktopLayout>;
}
