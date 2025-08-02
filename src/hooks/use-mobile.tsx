
'use client';

import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768; // md breakpoint in Tailwind

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Handler untuk memeriksa ukuran window
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Panggil handler sekali saat komponen dimuat untuk set state awal
    handleResize();

    // Tambahkan event listener untuk resize
    window.addEventListener('resize', handleResize);

    // Cleanup: hapus event listener saat komponen dilepas
    return () => window.removeEventListener('resize', handleResize);
  }, []); 

  return isMobile;
}
