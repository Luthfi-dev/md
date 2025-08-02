
'use client';

import React, { useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2 } from 'lucide-react';
import { DesktopLayout } from '@/components/DesktopLayout';
import { MobileLayout } from '@/components/MobileLayout';
import HomePageContent from '@/components/HomePageContent';
import { usePathname } from 'next/navigation';

export default function Home() {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Exclude AppLayout wrapper for these specific pages
  const isLayoutExcluded = pathname.startsWith('/admin') || 
                           pathname.startsWith('/account') || 
                           pathname.startsWith('/messages') || 
                           pathname.startsWith('/surat/');

  if (isLayoutExcluded) {
    return <HomePageContent />;
  }

  if (!isClient) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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
