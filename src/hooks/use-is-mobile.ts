
'use client';

import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768; // md tailwind breakpoint

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Initial check
    const checkDevice = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    
    // Check only after the component has mounted on the client
    checkDevice();

    // Listen for window resize
    window.addEventListener('resize', checkDevice);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

  return isMobile;
}
