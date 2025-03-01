'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { TbHeart, TbShoppingCart, TbTrash, TbEye } from 'react-icons/tb';

type Product = {
  id: string;
  name: string;
  image: string;
  price: number;
  oldPrice?: number;
  category: string;
  inStock: boolean;
};

export default function CustomerFavorites() {
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<Product[]>([]);

  useEffect(() => {
    // در حالت واقعی، باید درخواست API را برای دریافت محصولات مورد علاقه انجام داد
    // اما در اینجا، از داده‌های شبیه‌سازی شده استفاده می‌کنیم
    setTimeout(() => {
      // برای نمایش حالت خالی، آرایه خالی را تنظیم می‌کنیم
      const mockFavorites: Product[] = [];
      setFavorites(mockFavorites);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleRemoveFromFavorites = (id: string) => {
    setFavorites(prev => prev.filter(item => item.id !== id));
  };

  // فرمت کردن مبلغ به صورت تومان
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">محصولات مورد علاقه</h1>
        <div className="mt-4 md:mt-0">
          <Link
            href="/customer/dashboard"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            بازگشت به داشبورد
          </Link>
        </div>
      </div>

      {favorites.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map((product) => (
            <div 
              key={product.id} 
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 flex flex-col"
            >
              <div className="relative h-60 overflow-hidden">
                <Link href={`/products/${product.id}`}>
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover hover:scale-105 transition-transform duration-300"
                    priority
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/placeholder.jpg';
                    }}
                  />
                </Link>
                <button
                  onClick={() => handleRemoveFromFavorites(product.id)}
                  className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-sm text-red-500 hover:text-red-600 transition-colors duration-200"
                  aria-label="حذف از علاقه‌مندی‌ها"
                >
                  <TbHeart className="h-5 w-5 fill-current" />
                </button>
                {!product.inStock && (
                  <div className="absolute top-0 left-0 right-0 bottom-0 bg-black bg-opacity-40 flex items-center justify-center">
                    <span className="bg-red-600 text-white px-3 py-1 text-sm font-medium rounded">
                      ناموجود
                    </span>
                  </div>
                )}
              </div>
              
              <div className="p-4 flex-1 flex flex-col">
                <div className="mb-2">
                  <span className="text-xs text-gray-500">{product.category}</span>
                </div>
                <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
                  {product.name}
                </h3>
                <div className="mt-auto">
                  <div className="flex items-center">
                    {product.oldPrice && (
                      <span className="text-xs text-gray-500 line-through ml-2">
                        {formatPrice(product.oldPrice)}
                      </span>
                    )}
                    <span className="text-md font-bold text-gray-900">
                      {formatPrice(product.price)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <Link
                      href={`/products/${product.id}`}
                      className="flex items-center justify-center py-2 px-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <TbEye className="ml-1 h-4 w-4" />
                      مشاهده
                    </Link>
                    
                    <button
                      disabled={!product.inStock}
                      className={`flex items-center justify-center py-2 px-2 border rounded-md text-sm font-medium ${
                        product.inStock
                          ? 'bg-blue-600 hover:bg-blue-700 text-white border-transparent'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                      }`}
                    >
                      <TbShoppingCart className="ml-1 h-4 w-4" />
                      {product.inStock ? 'خرید' : 'ناموجود'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-red-50 rounded-full text-red-500">
              <TbHeart className="h-12 w-12" />
            </div>
          </div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">لیست علاقه‌مندی‌های شما خالی است</h2>
          <p className="text-gray-600 mb-6">محصولات مورد علاقه خود را به این لیست اضافه کنید تا بتوانید آن‌ها را راحت‌تر پیدا کنید.</p>
          <Link
            href="/products"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <TbShoppingCart className="ml-2 h-5 w-5" />
            مشاهده محصولات فروشگاه
          </Link>
        </div>
      )}

      {favorites.length > 0 && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setFavorites([])}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-red-50 hover:border-red-300"
          >
            <TbTrash className="ml-2 -mr-1 h-5 w-5" />
            حذف همه موارد از لیست علاقه‌مندی‌ها
          </button>
        </div>
      )}
    </div>
  );
} 