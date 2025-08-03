
'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import HomePageContent from '@/components/HomePageContent';
import { MobileLayout } from '@/components/MobileLayout';

export default function Page() {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <MobileLayout>
        <HomePageContent />
    </MobileLayout>
  );
}
