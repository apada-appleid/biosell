'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiCheckCircle, FiShoppingBag } from 'react-icons/fi';
import MobileLayout from '@/app/components/layout/MobileLayout';
import { useRouter } from 'next/navigation';

export default function CheckoutSuccessPage() {
  const [mounted, setMounted] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [hasValidAccess, setHasValidAccess] = useState(false);
  const router = useRouter();
  
  // Fix hydration issues and check for valid access
  useEffect(() => {
    setMounted(true);
    
    // Get the order number from session storage
    const storedOrder = sessionStorage.getItem('last_order');
    
    if (storedOrder) {
      setOrderNumber(storedOrder);
      setHasValidAccess(true);
    } else {
      // If no stored order, redirect to home page
      setHasValidAccess(false);
    }
    
    // Modify browser history to prevent going back to checkout
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/checkout/success');
    }
  }, []);
  
  // Redirect if accessing directly without valid access
  useEffect(() => {
    if (mounted && !hasValidAccess) {
      router.push('/');
    }
  }, [mounted, hasValidAccess, router]);
  
  if (!mounted || !hasValidAccess || !orderNumber) {
    return null; // Don't render anything before hydration or during redirect
  }
  
  return (
    <MobileLayout title="سفارش ثبت شد" showBackButton={false}>
      <div className="flex flex-col items-center justify-center p-6 text-center min-h-[calc(100vh-56px)] bg-white">
        <div className="mb-6 text-green-500">
          <FiCheckCircle className="h-24 w-24" />
        </div>
        
        <h1 className="text-2xl font-bold mb-4 text-gray-900">با تشکر از خرید شما!</h1>
        
        <p className="text-gray-700 mb-6">
          سفارش شما با موفقیت ثبت شد. به زودی ایمیل تأییدیه برای شما ارسال خواهد شد.
        </p>
        
        <div className="flex flex-col w-full max-w-xs space-y-4">
          <Link
            href="/"
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center"
            aria-label="ادامه خرید"
            tabIndex={0}
          >
            <FiShoppingBag className="ml-2" />
            ادامه خرید
          </Link>
        </div>
        
        <div className="mt-8 p-4 bg-gray-50 rounded-lg w-full max-w-sm border border-gray-200">
          <h2 className="font-semibold mb-2 text-gray-900">جزئیات سفارش</h2>
          <p className="text-sm text-gray-700 mb-1">شماره سفارش: {orderNumber}</p>
          <p className="text-sm text-gray-700">تاریخ: {new Date().toLocaleDateString('fa-IR')}</p>
        </div>
      </div>
    </MobileLayout>
  );
} 