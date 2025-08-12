
'use client';

import React, { useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { Loader2 } from 'lucide-react';
import { DesktopLayout } from '@/components/DesktopLayout';
import { MobileLayout } from '@/components/MobileLayout';
import { usePathname } from 'next/navigation';

export default function RootLayoutComponent({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/superadmin');

  if (!isClient) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Use a simpler div for admin routes to avoid conflicts with nested layouts
  if (isAdminRoute) {
    return <div className="min-h-screen flex flex-col">{children}</div>;
  }

  if (isMobile) {
    return <MobileLayout>{children}</MobileLayout>;
  }

  return <DesktopLayout>{children}</DesktopLayout>;
}
