'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { Edit, Trash2, Search, Plus, Loader2, AlertTriangle, XCircle } from 'lucide-react';
import { ensureValidImageUrl } from "@/utils/s3-storage";
import { useRouter } from 'next/navigation';

// Define types
interface ProductImage {
  id: string;
  imageUrl: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  inventory: number;
  isActive: boolean;
  images: ProductImage[];
  createdAt?: string;
  shopId: string;
}

interface Shop {
  id: string;
  shopName: string;
  isDefault: boolean;
}

export default function SellerProductsPage() {
  const { status, data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [hasPendingSubscription, setHasPendingSubscription] = useState<boolean>(false);
  const [pendingSubscriptionStatus, setPendingSubscriptionStatus] = useState<string | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [loadingShops, setLoadingShops] = useState(true);
  const router = useRouter();

  // Fetch shops
  useEffect(() => {
    const fetchShops = async () => {
      if (status === 'authenticated') {
        try {
          setLoadingShops(true);
          const response = await fetch('/api/seller/shops');
          const data = await response.json();
          
          if (data.shops && data.shops.length > 0) {
            setShops(data.shops);
            
            // Find default shop or use the first one
            const defaultShop = data.shops.find((shop: Shop) => shop.isDefault) || data.shops[0];
            setSelectedShopId(defaultShop.id);
          }
        } catch (error) {
          console.error('Error fetching shops:', error);
        } finally {
          setLoadingShops(false);
        }
      }
    };
    
    fetchShops();
  }, [status]);

  // Check subscription status
  useEffect(() => {
    const checkSubscription = async () => {
      if (status === 'authenticated') {
        try {
          const response = await fetch('/api/seller/subscription/check');
          const data = await response.json();
          
          setHasSubscription(data.hasActiveSubscription);
          setHasPendingSubscription(data.hasPendingSubscription || false);
          setPendingSubscriptionStatus(data.pendingPaymentStatus);
        } catch (error) {
          console.error('Error checking subscription:', error);
          setHasSubscription(false);
          setHasPendingSubscription(false);
        } finally {
          setCheckingSubscription(false);
        }
      }
    };
    
    if (status === 'authenticated') {
      checkSubscription();
    }
  }, [status]);

  // Update fetchProducts to filter by selected shop
  useEffect(() => {
    const fetchProducts = async () => {
      if (status === 'authenticated' && selectedShopId) {
        try {
          setIsLoading(true);
          setError(null);
          
          const response = await fetch(`/api/seller/products?shopId=${selectedShopId}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch products');
          }
          
          const data = await response.json();
          setProducts(data.products || []);
        } catch (err) {
          setError((err as Error).message);
          console.error('Error fetching products:', err);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    if (!loadingShops && selectedShopId) {
      fetchProducts();
    }
  }, [status, selectedShopId, loadingShops]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleDeleteClick = (productId: string) => {
    setConfirmDelete(productId);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;

    try {
      // Soft delete the product via API
      const response = await fetch(`/api/seller/products/${confirmDelete}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      // Update local state by removing the deleted product from the list
      setProducts(products.filter((product) => product.id !== confirmDelete));
    } catch (error) {
      console.error('Error deleting product:', error);
      setError('خطا در حذف محصول. لطفا دوباره تلاش کنید.');
    } finally {
      setConfirmDelete(null);
    }
  };

  const cancelDelete = () => {
    setConfirmDelete(null);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const filteredProducts = products.filter((product) =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handler for shop selection change
  const handleShopChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedShopId(e.target.value);
  };

  if (status === 'loading' || (isLoading && products.length === 0) || checkingSubscription) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  // Show subscription message if user doesn't have an active subscription
  if (hasSubscription === false) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">محصولات من</h1>
        </div>
        
        {hasPendingSubscription ? (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 text-center">
            <div className="mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="text-xl font-bold text-gray-900 mb-2">اشتراک در انتظار تایید</h2>
              <p className="text-gray-700 mb-4">
                {pendingSubscriptionStatus === 'pending' ? 
                  'اشتراک شما در انتظار تایید پرداخت است. پس از تایید پرداخت توسط ادمین، می‌توانید محصولات خود را اضافه کنید.' :
                  pendingSubscriptionStatus === 'rejected' ?
                  'متاسفانه پرداخت شما تایید نشده است. لطفا با پشتیبانی تماس بگیرید یا مجددا اقدام به خرید اشتراک نمایید.' :
                  'اشتراک شما هنوز فعال نشده است. لطفا مجددا تلاش کنید یا با پشتیبانی تماس بگیرید.'}
              </p>
              
              <button
                onClick={() => router.push('/seller/dashboard')}
                className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium mx-2"
              >
                بازگشت به داشبورد
              </button>
              
              {pendingSubscriptionStatus === 'rejected' && (
                <button
                  onClick={() => router.push('/seller/plans')}
                  className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium mx-2 mt-2 sm:mt-0"
                >
                  خرید اشتراک جدید
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 text-center">
            <div className="mb-4">
              <XCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">نیاز به اشتراک فعال</h2>
              <p className="text-gray-700 mb-6">
                برای مدیریت محصولات، شما نیاز به یک اشتراک فعال دارید. لطفا ابتدا یک پلن اشتراک را انتخاب کنید.
              </p>
              
              <button
                onClick={() => router.push('/seller/plans')}
                className="px-5 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                مشاهده پلن‌های اشتراک
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // UI for no shops case
  if (!loadingShops && shops.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">محصولات</h1>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 ml-2" />
            <p>شما هنوز هیچ فروشگاهی ندارید. ابتدا یک فروشگاه ایجاد کنید.</p>
          </div>
        </div>
        <Link 
          href="/seller/shops/new"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
        >
          <Plus className="h-4 w-4 ml-2" />
          ایجاد فروشگاه جدید
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">محصولات</h1>
        <div className="flex flex-col md:flex-row md:items-center">
          {/* Shop Selection Dropdown */}
          {!loadingShops && shops.length > 0 && (
            <div className="mb-4 md:mb-0 md:ml-4">
              <select
                value={selectedShopId || ''}
                onChange={handleShopChange}
                className="block w-full md:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {shops.map(shop => (
                  <option key={shop.id} value={shop.id}>
                    {shop.shopName} {shop.isDefault ? '(پیش‌فرض)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Search Input */}
          <div className="relative mb-4 md:mb-0">
            <input
              type="text"
              placeholder="جستجو..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="block w-full px-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-5 w-5" />
              </button>
            )}
          </div>
          
          {/* Add Product Button */}
          {hasSubscription === true && selectedShopId && (
            <Link 
              href={`/seller/products/new?shopId=${selectedShopId}`} 
              className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
            >
              <Plus className="h-4 w-4 ml-2" />
              افزودن محصول
            </Link>
          )}
        </div>
      </div>
      
      {/* Error Alert */}
      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="mr-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Products Table/Cards */}
      <div className="mt-8 flex flex-col">
        {filteredProducts.length > 0 ? (
          <>
            {/* Table for desktop */}
            <div className="hidden md:block">
              <div className="-my-2 -mx-4 sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle">
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="py-3.5 pr-4 pl-3 text-right text-sm font-semibold text-gray-900 sm:pr-6">
                              محصول
                            </th>
                            <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                              قیمت
                            </th>
                            <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                              موجودی
                            </th>
                            <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                              وضعیت
                            </th>
                            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                              <span className="sr-only">عملیات</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {filteredProducts.map((product) => (
                            <tr key={product.id}>
                              <td className="whitespace-nowrap py-4 pr-4 pl-3 text-sm sm:pr-6">
                                <div className="flex items-center">
                                  <div className="h-10 w-10 flex-shrink-0 relative overflow-hidden rounded-full">
                                    {product.images && product.images.length > 0 ? (
                                      <Image
                                        src={ensureValidImageUrl(product.images[0].imageUrl)}
                                        alt={product.title}
                                        width={40}
                                        height={40}
                                        className="object-cover h-10 w-10"
                                        unoptimized={true}
                                      />
                                    ) : (
                                      <div className="h-10 w-10 bg-gray-200 flex items-center justify-center rounded-full">
                                        <span className="text-xs text-gray-500">بدون تصویر</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="mr-4">
                                    <div className="font-medium text-gray-900 break-words max-w-[120px] sm:max-w-full">{product.title}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700">
                                {formatPrice(product.price)}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700">
                                {product.inventory}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm">
                                <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${product.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                  {product.isActive ? 'فعال' : 'غیرفعال'}
                                </span>
                              </td>
                              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-left text-sm font-medium sm:pr-6">
                                <div className="flex items-center justify-end space-x-3 space-x-reverse">
                                  <Link href={`/seller/products/${product.id}/edit`} className="text-blue-600 hover:text-blue-900">
                                    <Edit className="h-5 w-5" />
                                    <span className="sr-only">ویرایش</span>
                                  </Link>
                                  <button
                                    onClick={() => handleDeleteClick(product.id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    <Trash2 className="h-5 w-5" />
                                    <span className="sr-only">حذف</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card view for mobile */}
            <div className="md:hidden">
              <div className="grid grid-cols-1 gap-4">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                    <div className="p-4">
                      <div className="flex items-center">
                        <div className="h-14 w-14 flex-shrink-0 relative overflow-hidden rounded-full">
                          {product.images && product.images.length > 0 ? (
                            <Image
                              src={ensureValidImageUrl(product.images[0].imageUrl)}
                              alt={product.title}
                              width={56}
                              height={56}
                              className="object-cover h-14 w-14"
                              unoptimized={true}
                            />
                          ) : (
                            <div className="h-14 w-14 bg-gray-200 flex items-center justify-center rounded-full">
                              <span className="text-xs text-gray-500">بدون تصویر</span>
                            </div>
                          )}
                        </div>
                        <div className="mr-4 flex-1">
                          <h3 className="font-medium text-gray-900 text-base">{product.title}</h3>
                        </div>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-3 text-sm">
                        <div className="col-span-1">
                          <div className="text-gray-500">قیمت</div>
                          <div className="font-medium text-gray-900 mt-1">{formatPrice(product.price)}</div>
                        </div>
                        <div className="col-span-1">
                          <div className="text-gray-500">موجودی</div>
                          <div className="font-medium text-gray-900 mt-1">{product.inventory}</div>
                        </div>
                        <div className="col-span-1">
                          <div className="text-gray-500">وضعیت</div>
                          <div className="mt-1">
                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${product.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {product.isActive ? 'فعال' : 'غیرفعال'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex justify-end border-t border-gray-100 pt-4">
                        <div className="flex space-x-2 space-x-reverse">
                          <Link 
                            href={`/seller/products/${product.id}/edit`}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                          >
                            <Edit className="ml-1.5 h-4 w-4" />
                            ویرایش
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(product.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-red-700 bg-white hover:bg-gray-50 focus:outline-none"
                          >
                            <Trash2 className="ml-1.5 h-4 w-4" />
                            حذف
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center p-12 bg-white shadow rounded-lg">
            <div className="text-gray-700">هیچ محصولی پیدا نشد</div>
            {searchQuery ? (
              <button
                className="mt-2 text-blue-600 hover:text-blue-800"
                onClick={() => setSearchQuery('')}
              >
                پاک کردن جستجو
              </button>
            ) : (
              <Link
                href="/seller/products/new"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                افزودن اولین محصول
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center text-red-600 mb-4">
              <AlertTriangle className="h-6 w-6 ml-2" />
              <h3 className="text-lg font-medium">تایید حذف</h3>
            </div>
            <p className="text-gray-700 mb-4">
              آیا از حذف این محصول اطمینان دارید؟ این عمل غیرقابل بازگشت است.
            </p>
            <div className="flex justify-end space-x-3 space-x-reverse">
              <button 
                onClick={cancelDelete}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition text-gray-700"
              >
                انصراف
              </button>
              <button 
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 