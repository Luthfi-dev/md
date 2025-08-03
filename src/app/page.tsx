
'use client';

import React, { useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { Loader2 } from 'lucide-react';
import { DesktopLayout } from '@/components/DesktopLayout';
import { MobileLayout } from '@/components/MobileLayout';
import HomePageContent from '@/components/HomePageContent';
import RootLayout from '@/src/app/layout';

export default function Page() {
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
