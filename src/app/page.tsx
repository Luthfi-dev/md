
'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import HomePageContent from '@/components/HomePageContent';

export default function Page() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // This effect runs after authentication status is determined.
    // It handles the initial redirection after a user lands on the homepage.
    if (isAuthenticated && user) {
      if (user.role === 1) { // Superadmin
        router.replace('/superadmin');
      } else if (user.role === 2) { // Admin
        router.replace('/admin');
      }
      // Regular users (role 3) will stay on the HomePageContent.
    }
  }, [isAuthenticated, user, router]);

  // Show a loading screen while authentication is in progress or redirecting.
  if (isLoading || (isAuthenticated && user && (user.role === 1 || user.role === 2))) {
    return <LoadingOverlay isLoading={true} message="Mengarahkan ke dasbor Anda..." />;
  }

  // Render the main homepage content for guests or regular users.
  return <HomePageContent />;
}
