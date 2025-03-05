'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { useCartStore } from '@/app/store/cart';
import { Product, ProductImage as ProductImageType } from '@/app/types';
import { 
  User, 
  Heart, 
  MessageCircle, 
  ExternalLink, 
  Grid, 
  ChevronLeft, 
  X, 
  Share2, 
  Minus, 
  Plus, 
  ShoppingBag,
  Loader2
} from 'lucide-react';
import { useToastStore } from '@/app/store/toast';

// تعریف انواع داده
interface Seller {
  id: string;
  username: string;
  shopName: string;
  bio?: string;
  profileImage?: string;
  isActive: boolean;
}

// Debug info type
interface DebugInfoType {
  productsResponse?: any;
  [key: string]: any;
}

/**
 * ShopPage component displays a seller's profile and products
 * 
 * This component now uses the path segments from Next.js routing
 * instead of directly accessing params to avoid the Next.js warning
 * about synchronously accessing params properties.
 */
export default function ShopPage() {
  const router = useRouter();
  const pathname = usePathname();
  const addToCart = useCartStore((state) => state.addToCart);
  const hydrate = useCartStore((state) => state.hydrate);
  const showToast = useToastStore((state) => state.showToast);
  
  // Extract username from pathname more reliably
  const username = pathname.split('/shop/')[1]?.split('/')[0];
  
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [debugInfo, setDebugInfo] = useState<DebugInfoType>({});
  const [mounted, setMounted] = useState(false);

  // Hydrate cart from localStorage on initial load
  useEffect(() => {
    const hydrateData = async () => {
      await Promise.resolve();
      hydrate();
      setMounted(true);
    };
    
    hydrateData();
  }, [hydrate]);

  // دریافت اطلاعات فروشنده
  useEffect(() => {
    const fetchSeller = async () => {
      if (!username) {
        console.error('No username found in URL');
        setError('خطا در بارگیری اطلاعات فروشنده: نام کاربری نامعتبر');
        setLoading(false);
        return;
      }
      
      try {
        console.log('Fetching seller data for username:', username);
        const response = await fetch(`/api/shop/seller?username=${username}`);
        if (!response.ok) {
          setError('فروشنده یافت نشد');
          setLoading(false);
          return;
        }
        const data = await response.json();
        console.log('Seller data received:', data);
        setSeller(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching seller:', error);
        setError('خطا در بارگیری اطلاعات فروشنده');
        setLoading(false);
      }
    };

    fetchSeller();
  }, [username]);

  // دریافت محصولات
  useEffect(() => {
    const fetchProducts = async () => {
      if (!seller) return;

      try {
        console.log('Fetching products for seller ID:', seller.id);
        const response = await fetch(`/api/shop/products?sellerId=${seller.id}`);
        if (!response.ok) {
          throw new Error('خطا در بارگیری محصولات');
        }
        const data = await response.json();
        console.log('Products received:', data);
        setDebugInfo(prev => ({ ...prev as Record<string, any>, productsResponse: data }));
        
        // Make sure we're getting an array
        let productList: Product[] = [];
        if (Array.isArray(data)) {
          productList = data;
        } else if (data.products && Array.isArray(data.products)) {
          productList = data.products;
        } else {
          console.error('Unexpected products data format:', data);
        }
        
        // اطمینان از سازگاری داده‌های محصول با نوع Product
        const validProducts = productList.map(p => ({
          ...p,
          available: p.available !== undefined ? p.available : p.isActive ?? true,
          createdAt: p.createdAt || new Date().toISOString(),
          // اطمینان از اینکه هر دو فیلد likes_count و likesCount مقدار دارند
          likes_count: p.likes_count || p.likesCount || 0,
          likesCount: p.likesCount || p.likes_count || 0
        }));
        
        setProducts(validProducts);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('خطا در بارگیری محصولات');
        setLoading(false);
      }
    };

    if (seller) {
      fetchProducts();
    }
  }, [seller]);

  // توابع مربوط به محصول انتخاب شده
  const openProductDetails = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
  };

  const closeProductDetails = () => {
    setSelectedProduct(null);
  };

  // توابع مربوط به تعداد محصول
  const incrementQuantity = () => {
    if (selectedProduct?.inventory && quantity < selectedProduct.inventory) {
      setQuantity(prev => prev + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  // تابع افزودن به سبد خرید
  const handleAddToCart = () => {
    if (selectedProduct) {
      try {
        // استفاده از استور zustand برای مدیریت سبد خرید
        addToCart(selectedProduct, quantity);
        
        // Show toast with action buttons
        showToast(`${quantity} عدد ${selectedProduct.title} به سبد خرید اضافه شد`, [
          {
            label: 'تکمیل سفارش',
            onClick: () => router.push('/cart')
          },
          {
            label: 'ادامه خرید',
            onClick: () => {
              useToastStore.getState().hideToast();
              closeProductDetails();
            }
          }
        ]);
        
        // بستن مودال محصول
        closeProductDetails();
      } catch (error) {
        console.error('خطا در افزودن به سبد خرید:', error);
        alert('خطا در افزودن به سبد خرید. لطفاً دوباره تلاش کنید.');
      }
    }
  };

  // Debug component (visible only in development)
  const DebugInfo = () => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-black bg-opacity-80 text-white p-2 text-xs max-h-32 overflow-auto">
        <div>Username: {username}</div>
        <div>Seller: {seller ? `ID: ${seller.id}, Name: ${seller.shopName}` : 'Not loaded'}</div>
        <div>Products: {products.length}</div>
        <div>Loading: {loading ? 'Yes' : 'No'}</div>
        <div>Error: {error || 'None'}</div>
      </div>
    );
  };

  // نمایش بارگذاری
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-700 text-lg">در حال بارگذاری...</p>
        <DebugInfo />
      </div>
    );
  }

  // نمایش خطا
  if (error || !seller) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white border border-gray-200 shadow-md rounded-lg max-w-md w-full p-8 text-center">
          <div className="mx-auto w-20 h-20 flex items-center justify-center rounded-full bg-red-50 mb-6">
            <X className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">فروشنده یافت نشد</h2>
          <p className="text-gray-600 mb-6">
            {error === 'فروشنده یافت نشد' 
              ? 'متأسفانه فروشنده مورد نظر شما در سیستم وجود ندارد.' 
              : error || 'مشکلی در بارگذاری اطلاعات فروشنده رخ داده است.'}
          </p>
          <button 
            onClick={() => router.push('/')}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            بازگشت به صفحه اصلی
          </button>
        </div>
        <DebugInfo />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white max-w-6xl mx-auto">
      {/* هدر فروشگاه */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <h1 className="text-xl font-semibold text-gray-900">{seller.shopName}</h1>
          <Link href="/cart" className="relative">
            <ShoppingBag className="h-6 w-6 text-gray-800" />
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* بخش پروفایل */}
        <div className="p-4 border-b border-gray-200 md:px-8 md:py-6">
          <div className="md:max-w-4xl md:mx-auto">
            <div className="flex items-center">
              <div className="relative h-20 w-20 md:h-24 md:w-24 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                {seller.profileImage ? (
                  <Image 
                    src={seller.profileImage} 
                    alt={seller.shopName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <User className="h-10 w-10 md:h-12 md:w-12 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 mr-4 md:mr-6">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">@{seller.username}</h2>
                <p className="text-gray-700 text-sm md:text-base mt-1">
                  {seller.bio || `فروشگاه رسمی ${seller.shopName}`}
                </p>
              </div>
            </div>
            
            {/* آمار فروشگاه */}
            <div className="flex justify-around mt-5 md:w-1/2 md:justify-between">
              <div className="text-center">
                <div className="font-bold text-gray-900 md:text-lg">{products.length}</div>
                <div className="text-xs md:text-sm text-gray-600 font-medium">محصولات</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-gray-900 md:text-lg">0</div>
                <div className="text-xs md:text-sm text-gray-600 font-medium">مشتریان</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-gray-900 md:text-lg">0</div>
                <div className="text-xs md:text-sm text-gray-600 font-medium">نظرات</div>
              </div>
            </div>
            
            <div className="mt-4 md:mt-6 md:max-w-xs">
              <button className="w-full bg-blue-500 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-600 transition-colors">
                دنبال کردن
              </button>
            </div>
          </div>
        </div>
        
        {/* گرید محصولات */}
        <div className="p-1 md:p-4 md:max-w-6xl md:mx-auto">
          {products && products.length > 0 ? (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 md:gap-4">
              {products.map((product) => (
                <div 
                  key={product.id} 
                  className="aspect-square cursor-pointer relative md:rounded-md md:shadow-sm md:overflow-hidden"
                  onClick={() => openProductDetails(product)}
                >
                  {product.images && product.images.length > 0 ? (
                    <Image 
                      src={product.images[0].imageUrl} 
                      alt={product.title}
                      fill
                      className="object-cover"
                    />
                  ) : product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <Grid className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-xs md:text-sm font-medium">
                    {product.price.toLocaleString('fa-IR')} تومان
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Grid className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">این فروشگاه هنوز محصولی ندارد</p>
            </div>
          )}
        </div>
      </main>

      {/* فوتر */}
      <footer className="bg-white border-t border-gray-200 py-4 px-6 text-center">
        <p className="text-xs md:text-sm text-gray-600">
          قدرت گرفته از <span className="font-medium">بایوسل</span>
        </p>
      </footer>

      {/* In development debug info */}
      <DebugInfo />

      {/* مودال نمایش جزئیات محصول */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-75 flex justify-center items-start md:items-center">
          <div className="bg-white w-full h-full md:h-auto md:max-w-5xl md:max-h-[85vh] md:rounded-lg md:overflow-hidden flex flex-col">
            {/* هدر مودال */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <button 
                onClick={closeProductDetails}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
              <h2 className="text-lg font-semibold text-gray-900 truncate mx-2 text-center">
                {selectedProduct.title}
              </h2>
              <div className="w-6" />
            </div>
            
            {/* محتوای مودال */}
            <div className="flex-1 overflow-y-auto p-0 md:p-4">
              <div className="md:grid md:grid-cols-2 md:gap-8">
                {/* تصویر محصول */}
                <div className="md:sticky md:top-0">
                  <div className="aspect-square relative bg-gray-100 md:rounded-lg overflow-hidden">
                    {selectedProduct.images && selectedProduct.images.length > 0 ? (
                      <Image 
                        src={selectedProduct.images[0].imageUrl} 
                        alt={selectedProduct.title} 
                        fill 
                        className="object-contain"
                      />
                    ) : selectedProduct.imageUrl ? (
                      <Image 
                        src={selectedProduct.imageUrl} 
                        alt={selectedProduct.title} 
                        fill 
                        className="object-contain"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Grid className="h-16 w-16 text-gray-300" />
                      </div>
                    )}
                  </div>
                  
                  {/* نمایش تصاویر چندگانه */}
                  {selectedProduct.images && selectedProduct.images.length > 1 && (
                    <div className="mt-2 px-4 overflow-x-auto">
                      <div className="flex space-x-2 rtl:space-x-reverse">
                        {selectedProduct.images.map((image, index) => (
                          <div
                            key={index}
                            className="w-16 h-16 rounded-md overflow-hidden border border-gray-200 flex-shrink-0 cursor-pointer"
                          >
                            <Image
                              src={image.imageUrl}
                              alt={`${selectedProduct.title} - تصویر ${index + 1}`}
                              width={64}
                              height={64}
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* اطلاعات محصول */}
                <div className="p-4 md:p-0">
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                    {selectedProduct.title}
                  </h1>
                  
                  <div className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
                    {selectedProduct.price.toLocaleString('fa-IR')} تومان
                  </div>
                  
                  <div className="prose prose-sm text-gray-700 mb-6">
                    <p className="whitespace-pre-line">{selectedProduct.description}</p>
                  </div>
                  
                  {/* دکمه‌های عملیاتی */}
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-4 rtl:space-x-reverse">
                      <button className="text-gray-500 hover:text-red-500">
                        <Heart className="h-6 w-6" />
                      </button>
                      <button className="text-gray-500 hover:text-blue-500">
                        <MessageCircle className="h-6 w-6" />
                      </button>
                      <button className="text-gray-500 hover:text-black">
                        <Share2 className="h-6 w-6" />
                      </button>
                    </div>
                    <div className="text-sm text-gray-500">
                      {(selectedProduct.likes_count || selectedProduct?.likesCount || 0) > 0 
                        ? `${selectedProduct.likes_count || selectedProduct?.likesCount} لایک` 
                        : '0 لایک'}
                    </div>
                  </div>
                  
                  {/* انتخاب تعداد */}
                  {selectedProduct.inventory && selectedProduct.inventory > 0 && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        تعداد
                      </label>
                      <div className="flex items-center">
                        <button
                          className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-300 bg-white text-gray-500 hover:bg-gray-100"
                          onClick={decrementQuantity}
                          disabled={quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-12 text-center text-gray-900 font-medium">
                          {quantity}
                        </span>
                        <button
                          className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-300 bg-white text-gray-500 hover:bg-gray-100"
                          onClick={incrementQuantity}
                          disabled={!selectedProduct.inventory || quantity >= selectedProduct.inventory}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* دکمه افزودن به سبد خرید */}
                  {selectedProduct.inventory && selectedProduct.inventory > 0 ? (
                    <button 
                      className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                      onClick={handleAddToCart}
                    >
                      افزودن به سبد خرید
                    </button>
                  ) : (
                    <button 
                      className="w-full bg-gray-200 text-gray-500 py-3 rounded-lg font-semibold cursor-not-allowed"
                      disabled
                    >
                      ناموجود
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 