'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import MobileLayout from '@/app/components/layout/MobileLayout';
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
    <MobileLayout title="Checkout" showFooter={false}>
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <Link
          href="/cart"
          className="flex items-center text-blue-500"
          aria-label="Back to cart"
          tabIndex={0}
        >
          <FiArrowLeft className="mr-2" />
          Back to Cart
        </Link>
      </div>
      
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-6">Checkout</h1>
        <CheckoutForm />
      </div>
    </MobileLayout>
  );
} 