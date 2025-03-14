'use client';

import React from 'react';
import { FiShoppingBag } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

interface EmptyCartProps {
  onShopNow: () => void;
}

const EmptyCart: React.FC<EmptyCartProps> = ({ onShopNow }) => {
  const router = useRouter();

  const handleBackToShopping = () => {
    router.push('/');
  };

  return (
    <div className="divide-y divide-gray-200 bg-white rounded-lg shadow-sm p-8 text-center">
      <div className="py-8 px-4">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FiShoppingBag className="h-12 w-12 text-gray-400" />
        </div>
        <h2 className="mt-4 text-xl font-medium text-gray-900">سبد خرید شما خالی است</h2>
        <p className="mt-2 text-sm text-gray-600 mb-6">
          شما می‌توانید با مراجعه به صفحه اصلی، محصولات مورد نظر خود را به سبد خرید اضافه کنید.
        </p>
        <button 
          onClick={handleBackToShopping}
          className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          aria-label="شروع خرید"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleBackToShopping()}
        >
          شروع خرید
        </button>
      </div>
    </div>
  );
};

export default EmptyCart; 