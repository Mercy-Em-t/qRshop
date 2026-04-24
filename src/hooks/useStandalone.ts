import { useState, useEffect } from 'react';

/**
 * Hook to detect if the app is currently running in standalone (PWA) mode.
 */
export function useStandalone() {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    
    const updateStandalone = () => {
      setIsStandalone(mediaQuery.matches || (window.navigator as any).standalone === true);
    };

    updateStandalone();
    mediaQuery.addEventListener('change', updateStandalone);

    return () => {
      mediaQuery.removeEventListener('change', updateStandalone);
    };
  }, []);

  return isStandalone;
}
