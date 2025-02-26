'use client';

import Link from 'next/link';
import { FiArrowLeft, FiShoppingBag } from 'react-icons/fi';
import MobileLayout from '@/app/components/layout/MobileLayout';
import CartItems from '@/app/components/cart/CartItems';
import { useCartStore } from '@/app/store/cart';

export default function CartPage() {
  const { cart } = useCartStore();
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };
  
  return (
    <MobileLayout title="Shopping Cart" showFooter={false}>
      <div className="flex flex-col min-h-[calc(100vh-56px)]">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <Link
            href="/"
            className="flex items-center text-blue-500"
            aria-label="Continue shopping"
            tabIndex={0}
          >
            <FiArrowLeft className="mr-2" />
            Continue Shopping
          </Link>
        </div>

        <div className="flex-grow">
          <CartItems items={cart.items} total={cart.total} />
        </div>

        {cart.items.length > 0 && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
            <Link
              href="/checkout"
              className="flex items-center justify-center bg-blue-500 text-white py-3 px-4 rounded-lg font-semibold"
              aria-label="Proceed to checkout"
              tabIndex={0}
            >
              <FiShoppingBag className="mr-2" />
              Checkout - {formatPrice(cart.total)}
            </Link>
          </div>
        )}
        
        {cart.items.length === 0 && (
          <div className="flex-grow flex flex-col items-center justify-center p-4">
            <div className="bg-gray-100 rounded-full p-6 mb-4">
              <FiShoppingBag className="h-12 w-12 text-gray-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6 text-center">
              Looks like you haven't added any products to your cart yet.
            </p>
            <Link
              href="/"
              className="bg-blue-500 text-white py-3 px-6 rounded-lg"
              aria-label="Start shopping"
              tabIndex={0}
            >
              Start Shopping
            </Link>
          </div>
        )}
      </div>
    </MobileLayout>
  );
} 