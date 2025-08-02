
'use client';

import React, { useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2 } from 'lucide-react';
import { DesktopLayout } from '@/components/DesktopLayout';
import { MobileLayout } from '@/components/MobileLayout';
import HomePageContent from '@/components/HomePageContent';

export default function Home() {
  const isMobile = useIsMobile();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
