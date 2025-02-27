'use client';

import React from 'react';
import { IoChevronBackOutline } from 'react-icons/io5';
import { useRouter } from 'next/navigation';

interface MobileLayoutProps {
  children: React.ReactNode;
  title: string;
  showBackButton?: boolean;
  showFooter?: boolean;
  headerClassName?: string;
}

export default function MobileLayout({
  children,
  title,
  showBackButton = true,
  showFooter = true,
  headerClassName = '',
}: MobileLayoutProps) {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-white">
      {/* Header */}
      <header className={`sticky top-0 z-10 bg-white border-b border-gray-200 ${headerClassName}`}>
        <div className="flex items-center h-14 px-4">
          {showBackButton && (
            <button
              onClick={handleBack}
              className="p-2 -ml-2 mr-2 rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Go back"
              tabIndex={0}
            >
              <IoChevronBackOutline className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-lg font-semibold flex-1 text-center">{title}</h1>
          <div className="w-10" /> {/* Spacer for alignment */}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer - conditionally rendered */}
      {showFooter && (
        <footer className="bg-white border-t border-gray-200 py-4 px-6 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} ShopGram. All rights reserved.</p>
        </footer>
      )}
    </div>
  );
} 