
'use client';

import React, { useEffect } from 'react';
import HomePageContent from '@/components/HomePageContent';
import { useAuth } from '@/hooks/use-auth';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { useRouter } from 'next/navigation';

export default function Page() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only perform redirects if authentication is not loading and the user is authenticated.
    if (!isLoading && isAuthenticated && user) {
      if (user.role === 1) {
        router.replace('/superadmin');
      } else if (user.role === 2) {
        router.replace('/admin');
      }
    }
  }, [isLoading, isAuthenticated, user, router]);


  // Show a loading overlay while checking authentication or redirecting.
  if (isLoading || isAuthenticated === undefined) {
    return <LoadingOverlay isLoading={true} message="Mempersiapkan aplikasi..." />;
  }

  // Show a loading overlay for admin/superadmin while redirecting them
  if (isAuthenticated && user && (user.role === 1 || user.role === 2)) {
      const dashboard = user.role === 1 ? 'Super Admin' : 'Admin';
      return <LoadingOverlay isLoading={true} message={`Mengarahkan ke dasbor ${dashboard}...`} />;
  }

  // Render the main homepage content for guests or regular users.
  return <HomePageContent />;
}
