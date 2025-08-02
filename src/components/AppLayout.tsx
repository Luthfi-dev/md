
'use client';

import { useIsMobile } from '@/hooks/use-mobile';
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

  const noLayoutPages = [
    '/admin', 
    '/account', 
    '/messages', 
    '/surat/share',
    '/surat/share-fallback'
  ];
    
  if (noLayoutPages.some(page => pathname.startsWith(page))) {
    return <>{children}</>;
  }
  
  if (!isClient) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
           <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  if (isMobile) {
    return <MobileLayout>{children}</MobileLayout>;
  }

  return <DesktopLayout>{children}</DesktopLayout>;
}
