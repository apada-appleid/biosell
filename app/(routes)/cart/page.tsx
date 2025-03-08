'use client';

import Link from 'next/link';
import { FiArrowLeft, FiShoppingBag, FiCreditCard } from 'react-icons/fi';
import CartItems from '@/app/components/cart/CartItems';
import { useCartStore } from '@/app/store/cart';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToastStore } from '@/app/store/toast';

export default function CartPage() {
  const { cart, hydrate } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const hideToast = useToastStore(state => state.hideToast);
  const router = useRouter();
  
  // Fix hydration issues by only rendering on client-side
  // and hydrating cart from localStorage
  useEffect(() => {
    // Manual hydration from localStorage on client side
    const hydrateCart = async () => {
      try {
        await Promise.resolve();
        hydrate();
        setMounted(true);
      } catch (e) {
        console.error("Failed to hydrate cart:", e);
        setMounted(true);
      }
    };
    
    hydrateCart();
    
    // Hide any active toast notifications when navigating to cart
    hideToast();
  }, [hydrate, hideToast]);
  
  const handleBackButton = () => {
    // Go back to the previous page
    window.history.back();
  };
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      maximumFractionDigits: 0
    }).format(price);
  };
  
  const handleCheckout = () => {
    // Hide any existing toast before proceeding to checkout
    hideToast();
    router.push('/checkout');
  };
  
  if (!mounted) {
    return null; // Return nothing during SSR or before hydration
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 md:bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 md:py-4 md:px-6">
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

      <div className="flex-grow md:max-w-7xl md:mx-auto md:px-6 md:py-8 md:flex md:space-x-8 md:space-x-reverse">
        {/* Cart Items Container */}
        <div className="flex-1">
          <CartItems items={cart.items} total={cart.total} />
        </div>
        
        {/* Checkout Summary for Desktop */}
        {cart.items.length > 0 && (
          <div className="hidden md:block md:w-96 h-fit">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 sticky top-24">
              <h2 className="font-bold text-lg mb-4 pb-3 border-b border-gray-200">خلاصه سفارش</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">تعداد محصولات</span>
                  <span className="font-medium">{cart.items.length} مورد</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">جمع سبد خرید</span>
                  <span className="font-medium">{formatPrice(cart.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">هزینه ارسال</span>
                  <span className="font-medium text-green-600">رایگان</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-200 font-bold">
                  <span>مبلغ قابل پرداخت</span>
                  <span className="text-lg">{formatPrice(cart.total)}</span>
                </div>
              </div>
              
              <button
                onClick={handleCheckout}
                className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 animate-pulse-button"
                aria-label="ادامه و پرداخت"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleCheckout()}
              >
                <FiCreditCard className="ml-2" />
                ادامه و پرداخت
              </button>
              
              <p className="text-xs text-gray-500 text-center mt-4">
                 با کلیک روی این دکمه، به صفحه تکمیل سفارش و پرداخت هدایت خواهید شد
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Checkout Button */}
      {cart.items.length > 0 && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <button
            onClick={handleCheckout}
            className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white w-full py-3 px-4 rounded-lg font-medium transition-colors animate-pulse-button"
            aria-label="ادامه و پرداخت"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleCheckout()}
          >
            <FiShoppingBag className="ml-2" />
            ادامه و پرداخت - {formatPrice(cart.total)}
          </button>
        </div>
      )}
    </div>
  );
} 