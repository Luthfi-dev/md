
'use client';

import BottomNavBar from './BottomNavBar';
import React from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  
  // Conditionally show the nav bar.
  // Hide it on the login page itself or if the user is not authenticated and on an account page.
  const isLoginPage = pathname === '/account' && !isAuthenticated;
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/superadmin');

  const showBottomNav = !isLoginPage && !isAdminRoute;
  
  return (
    <div className="flex flex-col flex-1 min-h-screen">
      <main className={cn("flex-1", showBottomNav ? "pb-16" : "")}>{children}</main>
      {showBottomNav && <BottomNavBar />}
    </div>
  );
}
