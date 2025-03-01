'use client';

import Link from 'next/link';
import { FiArrowLeft, FiShoppingBag } from 'react-icons/fi';
import CartItems from '@/app/components/cart/CartItems';
import { useCartStore } from '@/app/store/cart';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { cart, hydrate } = useCartStore();
  const [mounted, setMounted] = useState(false);
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
  }, [hydrate]);
  
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
  
  if (!mounted) {
    return null; // Return nothing during SSR or before hydration
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-white max-w-md mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <button 
            onClick={handleBackButton} 
            className="text-gray-800"
            aria-label="بازگشت به صفحه قبل"
            tabIndex={0}
          >
            <FiArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">سبد خرید</h1>
          <div className="w-6"></div>
        </div>
      </header>

      <div className="flex-grow">
        <CartItems items={cart.items} total={cart.total} />
      </div>

      {cart.items.length > 0 && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <Link
            href="/checkout"
            className="flex items-center justify-center bg-blue-500 text-white py-3 px-4 rounded-lg font-semibold"
            aria-label="ادامه و پرداخت"
            tabIndex={0}
          >
            <FiShoppingBag className="ml-2" />
            ادامه و پرداخت - {formatPrice(cart.total)}
          </Link>
        </div>
      )}
    </div>
  );
} 