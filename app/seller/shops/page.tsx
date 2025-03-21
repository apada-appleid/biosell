"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";
import Link from "next/link";
import { PlusIcon } from "@heroicons/react/24/outline";

interface Shop {
  id: string;
  shopName: string;
  instagramId: string | null;
  isDefault: boolean;
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

  const handleSetDefault = async (shopId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/seller/shops/${shopId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isDefault: true,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update shop");
      }
      
      // Update the local state
      const updatedShops = shops.map(shop => ({
        ...shop,
        isDefault: shop.id === shopId
      }));
      
      setShops(updatedShops);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToEdit = (shopId: string) => {
    router.push(`/seller/shops/${shopId}`);
  };

  if (isLoading && shops.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">فروشگاه‌های من</h1>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">فروشگاه‌های من</h1>
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <p>خطا در بارگذاری اطلاعات: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 text-red-600 hover:text-red-800 font-medium"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">فروشگاه‌های من</h1>
        <Link 
          href="/seller/shops/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-1" />
          <span>افزودن فروشگاه جدید</span>
        </Link>
      </div>
      
      {shops.length === 0 ? (
        <div className="bg-white border rounded-lg p-6 text-center">
          <p className="text-gray-500 mb-4">هنوز هیچ فروشگاهی ندارید.</p>
          <Link 
            href="/seller/shops/new"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg inline-flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-1" />
            <span>ایجاد فروشگاه جدید</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop) => (
            <div 
              key={shop.id} 
              className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-4 border-b bg-gray-50">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">{shop.shopName}</h2>
                  {shop.isDefault && (
                    <span className="bg-green-100 text-green-800 text-xs px-2.5 py-0.5 rounded-full">
                      پیش‌فرض
                    </span>
                  )}
                </div>
                {shop.instagramId && (
                  <p className="text-sm text-gray-500 mt-1">
                    <span>اینستاگرام: </span>
                    <a 
                      href={`https://instagram.com/${shop.instagramId}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline"
                    >
                      @{shop.instagramId}
                    </a>
                  </p>
                )}
              </div>
              
              <div className="p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-500">تعداد محصولات:</span>
                  <span className="text-sm font-medium">{shop._count?.products || 0}</span>
                </div>
                
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-500">وضعیت:</span>
                  <span className={`text-sm font-medium ${shop.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {shop.isActive ? 'فعال' : 'غیرفعال'}
                  </span>
                </div>
                
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-500">تاریخ ایجاد:</span>
                  <span className="text-sm font-medium">
                    {new Date(shop.createdAt).toLocaleDateString('fa-IR')}
                  </span>
                </div>
              </div>
              
              <div className="p-4 border-t bg-gray-50">
                <div className="flex space-x-2 space-x-reverse">
                  <button 
                    onClick={() => navigateToEdit(shop.id)}
                    className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded text-sm font-medium"
                  >
                    ویرایش
                  </button>
                  
                  <Link 
                    href={`/seller/products?shopId=${shop.id}`}
                    className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded text-sm font-medium text-center"
                  >
                    محصولات
                  </Link>
                  
                  {!shop.isDefault && (
                    <button 
                      onClick={() => handleSetDefault(shop.id)}
                      className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded text-sm font-medium"
                      disabled={isLoading}
                    >
                      انتخاب به عنوان پیش‌فرض
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 