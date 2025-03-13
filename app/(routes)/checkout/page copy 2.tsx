'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CheckoutForm from '@/app/components/checkout/CheckoutForm';
import { useCartStore } from '@/app/store/cart';
import { useSession } from 'next-auth/react';
import { User } from '@/app/types';

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { cart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [localUser, setLocalUser] = useState<User | null>(null);
  
  // Handle hydration
  useEffect(() => {
    setMounted(true);
    
    // بررسی وجود کاربر محلی (لاگین شده با OTP)
    if (typeof window !== 'undefined') {
      try {
        const authToken = localStorage.getItem('auth_token');
        const userInfoStr = localStorage.getItem('user_info');
        
        if (authToken && userInfoStr) {
          const userInfo = JSON.parse(userInfoStr);
          setLocalUser({
            id: userInfo.id,
            name: userInfo.name || '',
            email: userInfo.email || '',
            mobile: userInfo.mobile
          });
          // No need to fill form data anymore as we've removed formData state
        }
      } catch (error) {
        console.error('Error getting local user:', error);
      }
    }
  }, []);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!mounted || status === 'loading') return;
    
    // Check if user is not a customer and handle redirection
    if (status === 'authenticated' && session?.user?.type !== 'customer') {
      console.log('User is not a customer, redirecting to customer login');
      // Remove auth tokens
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
      // Sign out from NextAuth
      router.push(`/auth/customer-login?callbackUrl=${encodeURIComponent('/checkout')}`);
      return;
    }
    
    // اگر با NextAuth احراز هویت شده نیست و کاربر محلی هم وجود ندارد
    if (status === 'unauthenticated' && !localUser) {
      console.log('User not authenticated, redirecting to login');
      // Store current page in query parameter for redirect after login
      router.push(`/auth/customer-login?callbackUrl=${encodeURIComponent('/checkout')}`);
      return;
    }
    
    // Redirect to cart if cart is empty
    if (cart.items.length === 0) {
      router.push('/cart');
    }
  }, [status, router, cart.items.length, mounted, localUser, session]);
  
  // Don't render component until we've checked authentication status
  if (!mounted || (status === 'loading' && !localUser) || 
      (status === 'unauthenticated' && !localUser) || 
      (status === 'authenticated' && session?.user?.type !== 'customer') || 
      cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  // استفاده از کاربر NextAuth یا کاربر محلی
  const user = session ? {
    id: session.user.id,
    name: session.user.name || '',
    email: session.user.email || '',
    mobile: session.user.mobile || ''
  } : localUser || undefined;
  
  // Function to update user data (like email)
  const updateUserData = (field: string, value: string) => {
    if (field === 'email') {
      if (localUser) {
        // Update local user state
        setLocalUser({
          ...localUser,
          email: value
        });
        
        // Save updated user info to localStorage
        try {
          const userInfoStr = localStorage.getItem('user_info');
          if (userInfoStr) {
            const userInfo = JSON.parse(userInfoStr);
            localStorage.setItem('user_info', JSON.stringify({
              ...userInfo,
              email: value
            }));
          }
        } catch (error) {
          console.error('Error updating local user email:', error);
        }
      }
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">تکمیل سفارش</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <CheckoutForm user={user} updateUserData={updateUserData} />
        </div>
        <div className="bg-gray-50 p-6 rounded-lg h-fit">
          <h2 className="text-lg font-medium mb-4">خلاصه سفارش</h2>
          <div className="space-y-4">
            {cart.items.map((item) => (
              <div key={`${item.product.id}-${item.quantity}`} className="flex justify-between">
                <div>
                  <p className="font-medium">{item.product.title}</p>
                  <p className="text-sm text-gray-500">تعداد: {item.quantity}</p>
                </div>
                <p className="font-medium">
                  {new Intl.NumberFormat('fa-IR', {
                    style: 'currency',
                    currency: 'IRR',
                    maximumFractionDigits: 0
                  }).format(item.product.price * item.quantity)}
                </p>
              </div>
            ))}
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between font-medium">
                <p>مجموع</p>
                <p>
                  {new Intl.NumberFormat('fa-IR', {
                    style: 'currency',
                    currency: 'IRR',
                    maximumFractionDigits: 0
                  }).format(cart.total)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 