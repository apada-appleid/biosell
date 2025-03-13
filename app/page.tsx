'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { FiShoppingBag, FiUser, FiZap, FiCreditCard, FiBarChart2 } from 'react-icons/fi';
import { useProductsStore } from './store/products';
import { useCartStore } from './store/cart';

export default function Home() {
  const { fetchProducts } = useProductsStore();
  const cartItems = useCartStore(state => state.cart.items);
  
  // Client-side data fetching
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <h1 className="text-xl font-semibold text-gray-900">بایوسل</h1>
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <Link 
              href="/cart" 
              className="text-gray-700 hover:text-gray-900 relative"
              aria-label="سبد خرید"
              tabIndex={0}
            >
              <FiShoppingBag className="h-6 w-6" />
              {cartItems.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItems.length}
                </span>
              )}
            </Link>
            <Link 
              href="/auth/login" 
              className="text-gray-700 hover:text-gray-900"
              aria-label="User account"
              tabIndex={0}
            >
              <FiUser className="h-6 w-6" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-blue-50 py-12 md:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col items-center justify-center mb-10">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <FiShoppingBag className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-blue-600">بایوسل</h3>
            <p className="text-gray-600 mt-2">فروشگاه آنلاین اینستاگرام شما</p>
          </div>
          
          <div className="md:flex md:items-center md:justify-between">
            <div className="md:w-full lg:w-2/3 mx-auto mb-8 md:mb-0">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-force-dark text-center md:text-right">
                فروشگاه آنلاین خودتان را در چند دقیقه بسازید
              </h2>
              <p className="text-lg text-gray-700 mb-6 text-force-dark text-center md:text-right">
                با بایوسل به راحتی محصولات خود را به مشتریان‌تان در اینستاگرام بفروشید. 
                بدون نیاز به دانش فنی، در چند دقیقه فروشگاه آنلاین خود را راه‌اندازی کنید.
              </p>
              <div className="flex justify-center md:justify-start">
                <Link 
                  href="/seller/register" 
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  aria-label="Start now"
                  tabIndex={0}
                >
                  همین حالا شروع کنید
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 md:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center text-force-dark">
            ویژگی‌های بایوسل
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md text-center flex flex-col items-center">
              <div className="text-blue-600 mb-4 flex justify-center">
                <FiZap className="w-12 h-12" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-force-dark">راه‌اندازی سریع</h3>
              <p className="text-gray-700 text-force-dark">در کمتر از ۵ دقیقه فروشگاه آنلاین خود را راه‌اندازی کنید.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center flex flex-col items-center">
              <div className="text-blue-600 mb-4 flex justify-center">
                <FiCreditCard className="w-12 h-12" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-force-dark">پرداخت امن</h3>
              <p className="text-gray-700 text-force-dark">درگاه پرداخت امن و مطمئن برای مشتریان شما.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center flex flex-col items-center">
              <div className="text-blue-600 mb-4 flex justify-center">
                <FiBarChart2 className="w-12 h-12" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-force-dark">مدیریت آسان</h3>
              <p className="text-gray-700 text-force-dark">پنل مدیریت ساده و کاربرپسند برای کنترل فروشگاه.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 py-12 md:py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            آماده‌اید تا فروش خود را افزایش دهید؟
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            همین امروز با بایوسل شروع کنید و تجربه فروش آنلاین جدیدی را برای خود و مشتریانتان رقم بزنید.
          </p>
          <Link 
            href="/seller/register" 
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            aria-label="Seller registration"
            tabIndex={0}
          >
            ثبت نام فروشندگان
          </Link>
        </div>
      </div>
    </div>
  );
}
