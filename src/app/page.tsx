
'use client';

import React from 'react';
import HomePageContent from '@/components/HomePageContent';
import { useAuth } from '@/hooks/use-auth';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { useRouter } from 'next/navigation';

export default function Page() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  // This component now only focuses on the HomePage experience.
  // The middleware is responsible for all route protection and initial redirects.

  if (isLoading || isAuthenticated === undefined) {
    return <LoadingOverlay isLoading={true} message="Mempersiapkan aplikasi..." />;
  }

  // New logic: After login, the user is redirected to '/' by the login page.
  // This effect on the homepage will then redirect admins/superadmins to their dashboards.
  if (isAuthenticated && user) {
      if (user.role === 1) {
          router.replace('/superadmin');
          return <LoadingOverlay isLoading={true} message="Mengarahkan ke dasbor Super Admin..." />;
      }
      if (user.role === 2) {
          router.replace('/admin');
          return <LoadingOverlay isLoading={true} message="Mengarahkan ke dasbor Admin..." />;
      }
  }

  // Render the main homepage content for guests or regular users.
  return <HomePageContent />;
}
