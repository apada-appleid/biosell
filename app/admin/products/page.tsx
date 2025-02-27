'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { TbEdit, TbTrash, TbSearch, TbEye, TbFilter } from 'react-icons/tb';
import authOptions from '@/lib/auth';

type Product = {
  id: string;
  title: string;
  price: number;
  inventory: number;
  isActive: boolean;
  seller: {
    id: string;
    shopName: string;
  };
  images: {
    id: string;
    imageUrl: string;
  }[];
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/admin/products');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
        // Mock data for development
        setProducts([
          {
            id: '1',
            title: 'کفش اسپرت سفید',
            price: 450000,
            inventory: 12,
            isActive: true,
            seller: {
              id: '1',
              shopName: 'گالری مد آنلاین',
            },
            images: [
              {
                id: 'img1',
                imageUrl: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb',
              },
            ],
          },
          {
            id: '2',
            title: 'ساعت مچی کلاسیک',
            price: 1200000,
            inventory: 5,
            isActive: true,
            seller: {
              id: '2',
              shopName: 'استودیو عکاسی نیکان',
            },
            images: [
              {
                id: 'img2',
                imageUrl: 'https://images.unsplash.com/photo-1539874754764-5a96559165b0',
              },
            ],
          },
          {
            id: '3',
            title: 'عینک آفتابی گرد',
            price: 350000,
            inventory: 0,
            isActive: false,
            seller: {
              id: '1',
              shopName: 'گالری مد آنلاین',
            },
            images: [
              {
                id: 'img3',
                imageUrl: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f',
              },
            ],
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleDeleteClick = (productId: string) => {
    setConfirmDelete(productId);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;

    try {
      // API call would go here
      // await fetch(`/api/admin/products/${confirmDelete}`, {
      //   method: 'DELETE',
      // });

      // Update local state for now
      setProducts(products.filter((product) => product.id !== confirmDelete));
    } catch (error) {
      console.error('Error deleting product:', error);
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

  const filteredProducts = products
    .filter((product) => {
      // Apply active/inactive filter
      if (filter === 'active') return product.isActive;
      if (filter === 'inactive') return !product.isActive;
      return true;
    })
    .filter((product) =>
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.seller.shopName.toLowerCase().includes(searchQuery.toLowerCase())
    );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold leading-tight text-gray-900">محصولات</h1>
      </div>

      {/* Filters and search */}
      <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
        <div className="relative rounded-md shadow-sm col-span-2">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <TbSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pr-10 py-2 text-gray-900 bg-white rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="جستجو بر اساس نام محصول یا نام فروشگاه..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>

        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <TbFilter className="h-5 w-5 text-gray-400" />
          </div>
          <select
            className="block w-full pr-10 py-2 text-gray-900 bg-white rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'active' | 'inactive')}
          >
            <option value="all">همه محصولات</option>
            <option value="active">محصولات فعال</option>
            <option value="inactive">محصولات غیرفعال</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pr-4 pl-3 text-right text-sm font-semibold text-gray-900 sm:pr-6">
                      محصول
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      فروشگاه
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
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <tr key={product.id}>
                        <td className="whitespace-nowrap py-4 pr-4 pl-3 text-sm sm:pr-6">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 relative overflow-hidden rounded-full">
                              {product.images.length > 0 && (
                                <Image
                                  src={product.images[0].imageUrl}
                                  alt={product.title}
                                  fill
                                  className="object-cover"
                                />
                              )}
                            </div>
                            <div className="mr-4">
                              <div className="font-medium text-gray-900">{product.title}</div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <Link href={`/admin/sellers/${product.seller.id}`} className="text-blue-600 hover:text-blue-900">
                            {product.seller.shopName}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {formatPrice(product.price)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {product.inventory} عدد
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              product.isActive && product.inventory > 0
                                ? 'bg-green-100 text-green-800'
                                : !product.isActive
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {product.isActive && product.inventory > 0
                              ? 'فعال'
                              : !product.isActive
                              ? 'غیرفعال'
                              : 'ناموجود'}
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex justify-end space-x-2 space-x-reverse">
                            <Link
                              href={`/admin/products/${product.id}`}
                              className="text-gray-500 hover:text-gray-700"
                              aria-label="نمایش"
                            >
                              <TbEye className="h-5 w-5" />
                            </Link>
                            <Link
                              href={`/admin/products/${product.id}/edit`}
                              className="text-blue-500 hover:text-blue-700"
                              aria-label="ویرایش"
                            >
                              <TbEdit className="h-5 w-5" />
                            </Link>
                            <button
                              onClick={() => handleDeleteClick(product.id)}
                              className="text-red-500 hover:text-red-700"
                              aria-label="حذف"
                            >
                              <TbTrash className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-3 py-4 text-sm text-center text-gray-500">
                        محصولی یافت نشد
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-right overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full px-4 pt-5 pb-4 sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <TbTrash className="h-6 w-6 text-red-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:mr-4 sm:text-right">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    حذف محصول
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      آیا از حذف این محصول اطمینان دارید؟ این عمل غیرقابل بازگشت است.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleConfirmDelete}
                >
                  حذف
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={cancelDelete}
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 