
'use client';

import React from 'react';
import HomePageContent from '@/components/HomePageContent';
import { useAuth } from '@/hooks/use-auth';
import { LoadingOverlay } from '@/components/ui/loading-overlay';

export default function Page() {
  const { isLoading, isAuthenticated } = useAuth();

  // Hanya tampilkan loading saat status autentikasi belum ditentukan.
  // Setelah ditentukan (baik login maupun tidak), middleware akan memastikan
  // pengguna berada di halaman yang benar.
  if (isAuthenticated === undefined) {
    return <LoadingOverlay isLoading={true} message="Mempersiapkan aplikasi..." />;
  }

  // Render konten halaman utama untuk semua orang.
  // Middleware sudah menangani perlindungan rute.
  return <HomePageContent />;
}
