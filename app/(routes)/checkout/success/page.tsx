'use client';

import Link from 'next/link';
import { FiCheckCircle } from 'react-icons/fi';
import MobileLayout from '@/app/components/layout/MobileLayout';

export default function CheckoutSuccessPage() {
  return (
    <MobileLayout title="Order Confirmed" showFooter={false}>
      <div className="flex flex-col items-center justify-center p-6 text-center h-[calc(100vh-56px)]">
        <div className="mb-6 text-green-500">
          <FiCheckCircle className="h-24 w-24" />
        </div>
        
        <h1 className="text-2xl font-bold mb-4">Thank You for Your Order!</h1>
        
        <p className="text-gray-600 mb-6">
          Your order has been placed successfully. We&apos;ll send you a confirmation email shortly.
        </p>
        
        <div className="flex flex-col w-full max-w-xs space-y-4">
          <Link
            href="/"
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold"
            aria-label="Continue shopping"
            tabIndex={0}
          >
            Continue Shopping
          </Link>
          
          <button 
            className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold"
            aria-label="Track your order"
            tabIndex={0}
          >
            Track Your Order
          </button>
        </div>
        
        <div className="mt-8 p-4 bg-gray-50 rounded-lg w-full max-w-sm">
          <h2 className="font-semibold mb-2">Order Details</h2>
          <p className="text-sm text-gray-600 mb-1">Order #: {Math.floor(Math.random() * 10000000)}</p>
          <p className="text-sm text-gray-600">Date: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </MobileLayout>
  );
} 