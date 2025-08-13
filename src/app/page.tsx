
'use client';

import React from 'react';
import HomePageContent from '@/components/HomePageContent';
import { useAuth } from '@/hooks/use-auth';
import { LoadingOverlay } from '@/components/ui/loading-overlay';

export default function Page() {
  const { isAuthenticated } = useAuth();

  // Show a loading screen while the authentication status is being determined.
  // This prevents content flashing and ensures middleware has time to process.
  if (isAuthenticated === undefined) {
    return <LoadingOverlay isLoading={true} message="Mempersiapkan aplikasi..." />;
  }

  // Once auth status is known, render the main content.
  // The middleware is the single source of truth for protecting routes and redirecting.
  // This page no longer needs to handle any redirection logic.
  return <HomePageContent />;
}
