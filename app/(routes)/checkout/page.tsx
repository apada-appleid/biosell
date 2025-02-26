'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import CheckoutForm from '@/app/components/checkout/CheckoutForm';
import { useCartStore } from '@/app/store/cart';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart } = useCartStore();
  
  // If cart is empty, redirect to cart page
  useEffect(() => {
    if (cart.items.length === 0) {
      router.push('/cart');
    }
  }, [cart.items.length, router]);
  
  if (cart.items.length === 0) {
    return null; // Don't render anything while redirecting
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-white max-w-md mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link 
            href="/cart" 
            className="text-gray-800"
            aria-label="Back to cart"
            tabIndex={0}
          >
            <FiArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">Checkout</h1>
          <div className="w-6"></div>
        </div>
      </header>
      
      <div className="p-4">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Complete Your Order</h2>
        <CheckoutForm />
      </div>
    </div>
  );
} 