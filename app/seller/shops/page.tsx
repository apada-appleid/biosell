"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";
import Link from "next/link";
import { PlusIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

interface Shop {
  id: string;
  shopName: string;
  instagramId: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: {
    products: number;
  };
}

export default function ShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchShops = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/seller/shops");
        
        if (!response.ok) {
          throw new Error("Failed to fetch shops");
        }
        
        const data = await response.json();
        setShops(data.shops || []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchShops();
  }, []);

  const navigateToEdit = (shopId: string) => {
    router.push(`/seller/shops/${shopId}`);
  };

  if (isLoading && shops.length === 0) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-8 text-gray-800">فروشگاه‌های من</h1>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-8 text-gray-800">فروشگاه‌های من</h1>
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-5 shadow-sm">
          <p>خطا در بارگذاری اطلاعات: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-3 text-red-600 hover:text-red-800 font-medium transition-colors duration-200 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">فروشگاه‌های من</h1>
        <motion.div 
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Link 
            href="/seller/shops/new"
            className="bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 focus:ring-opacity-50 text-white px-4 py-2.5 rounded-lg flex items-center shadow-sm transition-all duration-200"
          >
            <PlusIcon className="w-5 h-5 ml-2" />
            <span>افزودن فروشگاه جدید</span>
          </Link>
        </motion.div>
      </div>
      
      {shops.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white border rounded-xl p-8 text-center shadow-sm"
        >
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">هنوز هیچ فروشگاهی ندارید</h3>
          <p className="text-gray-500 mb-6">برای شروع فروش، یک فروشگاه جدید ایجاد کنید.</p>
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Link 
              href="/seller/shops/new"
              className="bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 focus:ring-opacity-50 text-white px-5 py-2.5 rounded-lg inline-flex items-center shadow-sm transition-all duration-200"
            >
              <PlusIcon className="w-5 h-5 ml-2" />
              <span>ایجاد فروشگاه جدید</span>
            </Link>
          </motion.div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop, index) => (
            <motion.div 
              key={shop.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-white border rounded-xl overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col h-full"
            >
              <div className="p-5 border-b bg-gradient-to-l from-gray-50 to-white">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">{shop.shopName}</h2>
                </div>
                {shop.instagramId && (
                  <p className="text-sm text-gray-500 mt-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1.5 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>اینستاگرام: </span>
                    <a 
                      href={`https://instagram.com/${shop.instagramId}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 hover:underline transition-colors duration-200"
                    >
                      @{shop.instagramId}
                    </a>
                  </p>
                )}
              </div>
              
              <div className="p-5 flex-grow">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center text-sm text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    تعداد محصولات:
                  </div>
                  <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded-md">
                    {shop._count?.products || 0}
                  </span>
                </div>
                
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center text-sm text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    وضعیت:
                  </div>
                  <span className={`text-sm font-medium px-2.5 py-0.5 rounded-md ${
                    shop.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {shop.isActive ? 'فعال' : 'غیرفعال'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-sm text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    تاریخ ایجاد:
                  </div>
                  <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded-md">
                    {new Date(shop.createdAt).toLocaleDateString('fa-IR')}
                  </span>
                </div>
              </div>
              
              <div className="p-4 border-t bg-gray-50 mt-auto">
                <div className="grid grid-cols-2 gap-2 rtl">
                  <motion.button 
                    onClick={() => navigateToEdit(shop.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex justify-center items-center bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    ویرایش
                  </motion.button>
                  
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link 
                      href={`/seller/products?shopId=${shop.id}`}
                      className="flex justify-center items-center bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      محصولات
                    </Link>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
} 