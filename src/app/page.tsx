
'use client';

import React from 'react';
import HomePageContent from '@/components/HomePageContent';
import { useAuth } from '@/hooks/use-auth';
import { LoadingOverlay } from '@/components/ui/loading-overlay';

export default function Page() {
  const { isLoading, isAuthenticated } = useAuth();

  // Show a loading overlay while checking authentication.
  // The middleware now handles all redirection logic, so this page
  // no longer needs to perform any redirects. It just waits for the
  // auth status and then renders the homepage.
  if (isLoading || isAuthenticated === undefined) {
    return <LoadingOverlay isLoading={true} message="Mempersiapkan aplikasi..." />;
  }

  // Render the main homepage content for all users (guests or authenticated).
  // The middleware has already ensured the user is in the right place.
  return <HomePageContent />;
}
