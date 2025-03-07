'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { Edit, Trash2, Search, Plus, Loader2, AlertTriangle } from 'lucide-react';
import { ensureValidImageUrl } from "@/utils/s3-storage";

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
}

export default function SellerProductsPage() {
  const { data: session, status } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Try to fetch products from API
        const response = await fetch('/api/seller/products');
        
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        } else {
          // If API fails, use mock data
          console.error('API returned error:', response.status);
          throw new Error('Failed to fetch products');
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('خطا در بارگذاری محصولات. لطفا دوباره تلاش کنید.');
        
        // Mock data as fallback
        setProducts([
          {
            id: '1',
            title: 'کفش اسپرت سفید',
            price: 450000,
            inventory: 12,
            isActive: true,
            images: [
              {
                id: 'img1',
                imageUrl: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb',
              },
            ],
            createdAt: new Date().toISOString(),
          },
          {
            id: '2',
            title: 'کیف دستی چرم',
            price: 780000,
            inventory: 5,
            isActive: true,
            images: [
              {
                id: 'img2',
                imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7',
              },
            ],
            createdAt: new Date().toISOString(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchProducts();
    }
  }, [status]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleDeleteClick = (productId: string) => {
    setConfirmDelete(productId);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;

    try {
      // Attempt to call API to delete product
      const response = await fetch(`/api/seller/products/${confirmDelete}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      // Update local state
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

  if (status === 'loading' || (isLoading && products.length === 0)) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold leading-tight text-gray-900">محصولات من</h1>
        <div className="mt-3 sm:mt-0 sm:mr-4">
          <Link
            href="/seller/products/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="ml-2 h-4 w-4" aria-hidden="true" />
            افزودن محصول
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="mt-6 max-w-lg">
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pr-10 py-2 text-gray-900 bg-white rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="جستجوی محصول..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
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