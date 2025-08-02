'use client';

import React, { useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2 } from 'lucide-react';
import { DesktopLayout } from '@/components/DesktopLayout';
import { MobileLayout } from '@/components/MobileLayout';
import HomePageContent from '@/components/HomePageContent';
import { usePathname } from 'next/navigation';

export default function Page() {
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
    '/surat/share-fallback',
    '/login'
  ];
  
  if (!isClient) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
           <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  // Handle pages that should not have the main app layout
  if (noLayoutPages.some(page => pathname.startsWith(page))) {
    // This is a special case for the root page if it ever gets caught here,
    // though the logic below should handle it.
    if (pathname === '/') {
       return isMobile ? (
        <MobileLayout><HomePageContent /></MobileLayout>
      ) : (
        <DesktopLayout><HomePageContent /></DesktopLayout>
      );
    }
    // For other special pages, the layout is handled by their own specific layout files
    // or they don't use a shared layout. We just return null here as they will be rendered
    // by their own route segments. This check is mostly a safeguard.
    // The actual content for those pages is in their respective page.tsx files.
    // This component (`src/app/page.tsx`) only renders for the '/' path.
    return null; 
  }

  // Default rendering for the home page ('/')
  if (isMobile) {
    return (
      <MobileLayout>
        <HomePageContent />
      </MobileLayout>
    );
  }

  return (
    <DesktopLayout>
      <HomePageContent />
    </DesktopLayout>
  );
}
