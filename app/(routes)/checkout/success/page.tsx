'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { FiCheckCircle, FiShoppingBag, FiArrowLeft, FiClipboard } from 'react-icons/fi';
import MobileLayout from '@/app/components/layout/MobileLayout';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToastStore } from '@/app/store/toast';

// Client component that uses useSearchParams
const CheckoutSuccessContent = () => {
  const [mounted, setMounted] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [hasValidAccess, setHasValidAccess] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const showToast = useToastStore(state => state.showToast);
  const hideToast = useToastStore(state => state.hideToast);
  
  // Fix hydration issues and check for valid access
  useEffect(() => {
    setMounted(true);
    
    // Hide any toast notifications
    hideToast();
    
    // Get the order ID from URL params or order number from session storage
    const orderId = searchParams.get('orderId');
    const storedOrder = sessionStorage.getItem('last_order');
    
    if (storedOrder || orderId) {
      setOrderNumber(storedOrder);
      setHasValidAccess(true);
      
      // Start animation after a short delay
      setTimeout(() => {
        setAnimationComplete(true);
      }, 800);
    } else {
      // If no stored order or order ID, redirect to home page
      setHasValidAccess(false);
    }
    
    // Modify browser history to prevent going back to checkout
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/checkout/success');
    }
  }, [hideToast, searchParams]);
  
  // Redirect if accessing directly without valid access
  useEffect(() => {
    if (mounted && !hasValidAccess) {
      router.push('/');
    }
  }, [mounted, hasValidAccess, router]);
  
  // Handle order number copy
  const copyOrderNumber = () => {
    if (orderNumber) {
      navigator.clipboard.writeText(orderNumber);
      showToast('شماره سفارش کپی شد', undefined, 'success', 2000);
    }
  };
  
  if (!mounted || !hasValidAccess) {
    return null; // Don't render anything before hydration or during redirect
  }
  
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center min-h-[calc(100vh-56px)] bg-white">
      <div className="relative mb-8">
        <div className={`w-24 h-24 rounded-full bg-green-100 flex items-center justify-center 
          transition-all duration-700 ${animationComplete ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
          <FiCheckCircle className={`h-12 w-12 text-green-500 
            transition-all duration-700 ${animationComplete ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} />
        </div>
        <svg className="absolute top-0 left-0 w-24 h-24" viewBox="0 0 100 100">
          <circle 
            className={`text-green-500 ${animationComplete ? 'animate-circle-completion' : ''}`} 
            stroke="currentColor" 
            strokeWidth="5" 
            fill="transparent" 
            r="47" 
            cx="50" 
            cy="50" 
            strokeDasharray="295.31" 
            strokeDashoffset="295.31" 
            style={{ 
              transition: 'stroke-dashoffset 1s ease-in-out', 
              strokeDashoffset: animationComplete ? '0' : '295.31' 
            }}
          />
        </svg>
      </div>
      
      <h1 className={`text-2xl font-bold mb-4 text-gray-900 
        transition-all duration-700 ${animationComplete ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        با تشکر از خرید شما!
      </h1>
      
      <p className={`text-gray-700 mb-6 
        transition-all duration-700 delay-200 ${animationComplete ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        سفارش شما با موفقیت ثبت شد. اطلاعات سفارش و روند ارسال از طریق پیامک به شما اطلاع‌رسانی خواهد شد.
      </p>
      
      <div className={`flex flex-col w-full max-w-xs space-y-4 
        transition-all duration-700 delay-400 ${animationComplete ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        <Link
          href="/"
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center shadow-sm"
          aria-label="ادامه خرید"
          tabIndex={0}
        >
          <FiShoppingBag className="ml-2" />
          ادامه خرید
        </Link>
        
        <Link
          href="/customer/orders"
          className="w-full bg-white text-gray-700 border border-gray-200 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center"
          aria-label="مشاهده سفارش‌ها"
          tabIndex={0}
        >
          <FiArrowLeft className="ml-2" />
          مشاهده سفارش‌ها
        </Link>
      </div>
      
      <div className={`mt-8 p-4 bg-gray-50 rounded-lg w-full max-w-sm border border-gray-200 
        transition-all duration-700 delay-600 ${animationComplete ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        <h2 className="font-semibold mb-3 text-gray-900">جزئیات سفارش</h2>
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm text-gray-700">شماره سفارش:</p>
          <div className="flex items-center">
            <p className="text-sm text-gray-900 font-medium ml-1 dir-ltr">{orderNumber}</p>
            <button 
              onClick={copyOrderNumber}
              className="text-blue-500 hover:text-blue-700 focus:outline-none"
              aria-label="کپی شماره سفارش"
            >
              <FiClipboard className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-700">تاریخ سفارش:</p>
          <p className="text-sm text-gray-900">{new Date().toLocaleDateString('fa-IR')}</p>
        </div>
      </div>
    </div>
  );
};

// Simple fallback component
const CheckoutSuccessLoading = () => (
  <div className="flex flex-col items-center justify-center p-6 text-center min-h-[calc(100vh-56px)] bg-white">
    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-8"></div>
    <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
    <div className="h-4 w-64 bg-gray-200 rounded mb-6"></div>
    <div className="w-full max-w-xs space-y-4">
      <div className="h-12 bg-gray-200 rounded-lg w-full"></div>
      <div className="h-12 bg-gray-200 rounded-lg w-full"></div>
    </div>
  </div>
);

// Main page component with Suspense boundary
export default function CheckoutSuccessPage() {
  return (
    <MobileLayout title="سفارش ثبت شد" showBackButton={false}>
      <Suspense fallback={<CheckoutSuccessLoading />}>
        <CheckoutSuccessContent />
      </Suspense>
    </MobileLayout>
  );
} 