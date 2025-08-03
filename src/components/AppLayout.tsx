
'use client';

import { usePathname } from 'next/navigation';
import React from 'react';
import { MobileLayout } from './MobileLayout';
import { cn } from '@/lib/utils';
import BottomNavBar from './BottomNavBar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const noNavPages = ['/login', '/account', '/messages', '/admin', '/surat/share', '/surat/share-fallback'];

  const isFullPage = noNavPages.some(page => pathname.startsWith(page));

  if (isFullPage) {
    return <>{children}</>;
  }

  return (
    <MobileLayout>
      {children}
    </MobileLayout>
  );
}
