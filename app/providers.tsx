'use client';

import { SessionProvider } from 'next-auth/react';
import React, { useEffect, useState } from 'react';
import Toast from './components/ui/Toast';
import { useToastStore } from './store/toast';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { NetworkStatus } from './components/NetworkStatus';

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Client-side providers wrapper
 * This component is needed because we're using 'use client' components with state management
 * that need to be wrapped in client-side providers
 */
export default function Providers({ children }: ProvidersProps) {
  // For client-side hydration
  const [mounted, setMounted] = useState(false);
  const { message, isVisible, actionButtons, hideToast } = useToastStore();

  useEffect(() => {
    setMounted(true);
    
    // تنظیم متغیر دیباگ برای کامپوننت‌های PWA
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('PWA Debug Mode Enabled');
      (window as any).enablePWA = () => {
        console.log('Manually enabling PWA prompt');
        if ((window as any).debugPWA) {
          (window as any).debugPWA.clearDismissed();
          (window as any).debugPWA.showPrompt();
        } else {
          console.warn('PWA debug module not ready yet. Try again in a few seconds.');
        }
      };
    }
  }, []);

  return (
    <SessionProvider>
      {children}
      {mounted && (
        <>
          <Toast 
            message={message} 
            isVisible={isVisible} 
            onClose={hideToast} 
            actionButtons={actionButtons}
          />
          <PWAInstallPrompt />
          <NetworkStatus />
        </>
      )}
    </SessionProvider>
  );
} 