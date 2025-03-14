'use client';

import React from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

const CartHeader: React.FC = () => {
  const router = useRouter();

  const handleBackButton = () => {
    // Get referrer from document.referrer
    const referrer = document.referrer;
    
    // Check if we have a referrer from the same domain
    if (referrer && referrer.includes(window.location.hostname)) {
      // Use the browser's back functionality
      window.history.back();
    } else {
      // If no valid referrer, go to home page
      router.push('/');
    }
  };

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 md:py-4 md:px-6 mb-6 -mx-4 rounded-t-lg">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <button 
          onClick={handleBackButton} 
          className="text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="بازگشت به صفحه قبل"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleBackButton()}
        >
          <FiArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">سبد خرید</h1>
        <div className="w-9"></div>
      </div>
    </header>
  );
};

export default CartHeader; 