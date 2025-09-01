
'use client';

import BottomNavBar from './BottomNavBar';
import React from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Explicitly list pages that should have bottom padding
  const pagesWithBottomPadding = ['/notebook', '/explore', '/account/profile', '/account/edit-profile', '/account/security', '/account/settings', '/account/invite', '/account/notifications', '/wallet', '/wallet/transactions', '/wallet/report', '/wallet/budget'];
  const isHomePage = pathname === '/';
  
  const isLoginPage = pathname === '/login';
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/spa');

  // Show bottom nav on all pages except login and admin
  const showBottomNav = !isLoginPage && !isAdminRoute;

  // Apply bottom padding if nav is shown AND it's a page that needs it (not a full-screen one like /messages)
  const applyPadding = showBottomNav && (isHomePage || pagesWithBottomPadding.some(page => pathname.startsWith(page)));

  return (
    <div className="flex flex-col flex-1 min-h-screen">
      <main className={cn("flex-1", applyPadding ? "pb-24" : "")}>{children}</main>
      {showBottomNav && <BottomNavBar />}
    </div>
  );
}
