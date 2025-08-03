
'use client';

import { usePathname } from 'next/navigation';
import React from 'react';
import { MobileLayout } from './MobileLayout';
import { DesktopLayout } from './DesktopLayout';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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
  
  // For all other pages, render both layouts and let CSS handle visibility.
  return (
    <>
      <MobileLayout>{children}</MobileLayout>
      <DesktopLayout>{children}</DesktopLayout>
    </>
  );
}