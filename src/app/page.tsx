
'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import HomePageContent from '@/components/HomePageContent';

export default function Page() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // This component now only focuses on the HomePage experience.
  // The middleware is responsible for all route protection and initial redirects.

  if (isLoading || isAuthenticated === undefined) {
    return <LoadingOverlay isLoading={true} message="Mempersiapkan aplikasi..." />;
  }

  // Render the main homepage content for guests or regular users.
  return <HomePageContent />;
}
