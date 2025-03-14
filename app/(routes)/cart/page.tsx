'use client';

import CartItems, { CartItem } from '@/app/components/cart/CartItems';
import { useCartStore } from '@/app/store/cart';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToastStore } from '@/app/store/toast';
// @ts-ignore - Handle import resolution issues
import CartTotal from '@/app/components/cart/CartTotal';
// @ts-ignore - Handle import resolution issues
import CartHeader from '@/app/components/cart/CartHeader';
// @ts-ignore - Handle import resolution issues
import EmptyCart from '@/app/components/cart/EmptyCart';
import { CartItem as CartItemType } from '@/app/types';

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
  
  const handleCheckout = () => {
    // Hide any existing toast before proceeding to checkout
    hideToast();
    router.push('/checkout');
  };
  
  const handleShopNow = () => {
    router.push('/');
  };
  
  const handleContinueShopping = () => {
    router.push('/');
  };
  
  if (!mounted) {
    return null; // Return nothing during SSR or before hydration
  }
  
  return (
    <div className="container mx-auto px-4 py-6 md:py-8 max-w-screen-lg">
      <CartHeader />

      {cart.items.length === 0 ? (
        <EmptyCart onShopNow={handleShopNow} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="space-y-4">
                {cart.items.map((item: CartItemType) => (
                  <CartItem key={item.product.id} item={item} />
                ))}
              </div>
            </div>
            <div className="md:col-span-1">
              <CartTotal 
                totalPrice={cart.total} 
                onCheckout={handleCheckout}
                onContinueShopping={handleContinueShopping}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
} 