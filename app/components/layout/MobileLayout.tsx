'use client';

import React from 'react';
import { IoChevronBackOutline } from 'react-icons/io5';
import { useRouter } from 'next/navigation';

interface MobileLayoutProps {
  children: React.ReactNode;
  title: string;
  showBackButton?: boolean;
  headerClassName?: string;
}

export default function MobileLayout({
  children,
  title,
  showBackButton = true,
  headerClassName = '',
}: MobileLayoutProps) {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleBack();
    }
  };

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-white">
      {/* Header */}
      <header className={`sticky top-0 z-10 bg-white border-b border-gray-200 ${headerClassName}`}>
        <div className="flex items-center h-14 px-4">
          {showBackButton && (
            <button
              onClick={handleBack}
              onKeyDown={handleKeyDown}
              className="p-2 -mr-2 ml-2 rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="بازگشت"
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
    </div>
  );
} 