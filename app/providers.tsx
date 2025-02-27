'use client';

import { SessionProvider } from 'next-auth/react';
import React from 'react';

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Client-side providers wrapper
 * This component is needed because we're using 'use client' components with state management
 * that need to be wrapped in client-side providers
 */
export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>{children}</SessionProvider>
  );
} 