'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TbEdit, TbTrash, TbPlus, TbSearch, TbEye } from 'react-icons/tb';

type Seller = {
  id: string;
  username: string;
  email: string;
  shopName: string;
  isActive: boolean;
  createdAt: string;
};

type SubscriptionInfo = {
  planName: string;
  endDate: string;
  isActive: boolean;
};

type SellerWithSubscription = Seller & {
  subscription?: SubscriptionInfo;
};

export default function SellersPage() {
  const [sellers, setSellers] = useState<SellerWithSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const response = await fetch('/api/admin/sellers');
        if (!response.ok) {
          throw new Error('Failed to fetch sellers');
        }
        const data = await response.json();
        setSellers(data);
      } catch (error) {
        console.error('Error fetching sellers:', error);
        // Mock data for initial development
        setSellers([
          {
            id: '1',
            username: 'fashion_gallery',
            email: 'info@fashiongallery.com',
            shopName: 'گالری مد آنلاین',
            isActive: true,
            createdAt: '2023-08-15T10:00:00Z',
            subscription: {
              planName: 'حرفه‌ای',
              endDate: '2024-08-15T10:00:00Z',
              isActive: true
            }
          },
          {
            id: '2',
            username: 'nikan_studio',
            email: 'contact@nikanstudio.com',
            shopName: 'استودیو عکاسی نیکان',
            isActive: true,
            createdAt: '2023-09-20T14:30:00Z',
            subscription: {
              planName: 'پایه',
              endDate: '2024-03-20T14:30:00Z',
              isActive: true
            }
          },
          {
            id: '3',
            username: 'shopestan',
            email: 'shop@shopestan.ir',
            shopName: 'شاپستان',
            isActive: false,
            createdAt: '2023-07-05T09:15:00Z',
            subscription: {
              planName: 'ویژه',
              endDate: '2023-12-05T09:15:00Z',
              isActive: false
            }
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSellers();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleDeleteClick = (sellerId: string) => {
    setConfirmDelete(sellerId);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;

    try {
      // API call would go here
      // await fetch(`/api/admin/sellers/${confirmDelete}`, {
      //   method: 'DELETE',
      // });

      // For now, just update the local state
      setSellers(sellers.filter(seller => seller.id !== confirmDelete));
    } catch (error) {
      console.error('Error deleting seller:', error);
    } finally {
      setConfirmDelete(null);
    }
  };

  const cancelDelete = () => {
    setConfirmDelete(null);
  };

  const filteredSellers = sellers.filter(seller => 
    seller.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    seller.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    seller.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fa-IR').format(date);
  };

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
        <h1 className="text-2xl font-bold leading-tight text-gray-900">فروشندگان</h1>
        <div className="mt-3 sm:mt-0 sm:ml-4">
          <Link
            href="/admin/sellers/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <TbPlus className="ml-2 -mr-1 h-5 w-5" />
            افزودن فروشنده جدید
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="mt-6 mb-6">
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <TbSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pr-10 py-2 text-gray-900 bg-white rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="جستجو بر اساس نام، ایمیل یا نام کاربری..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {/* Sellers Table/Cards */}
      <div className="mt-8 flex flex-col">
        {filteredSellers.length > 0 ? (
          <>
            {/* Table view for desktop */}
            <div className="hidden md:block">
              <div className="-my-2 -mx-4 sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle">
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="py-3.5 pr-4 pl-3 text-right text-sm font-semibold text-gray-900 sm:pr-6">
                              نام فروشگاه
                            </th>
                            <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                              نام کاربری
                            </th>
                            <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                              ایمیل
                            </th>
                            <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                              تاریخ ثبت‌نام
                            </th>
                            <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                              اشتراک
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
                          {filteredSellers.map((seller) => (
                            <tr key={seller.id}>
                              <td className="whitespace-nowrap py-4 pr-4 pl-3 text-sm font-medium text-gray-900 sm:pr-6">
                                <span className="break-words max-w-[120px] sm:max-w-full inline-block">{seller.shopName}</span>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {seller.username}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                <span className="break-all max-w-[120px] sm:max-w-full inline-block">{seller.email}</span>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {formatDate(seller.createdAt)}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {seller.subscription ? (
                                  <div>
                                    <span className="block">{seller.subscription.planName}</span>
                                    <span className="text-xs text-gray-400">
                                      تا {formatDate(seller.subscription.endDate)}
                                    </span>
                                  </div>
                                ) : (
                                  "بدون اشتراک"
                                )}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm">
                                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                  seller.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {seller.isActive ? 'فعال' : 'غیرفعال'}
                                </span>
                              </td>
                              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                <div className="flex justify-end space-x-2 space-x-reverse">
                                  <Link
                                    href={`/admin/sellers/${seller.id}`}
                                    className="text-gray-500 hover:text-gray-700"
                                    aria-label="نمایش"
                                  >
                                    <TbEye className="h-5 w-5" />
                                  </Link>
                                  <Link
                                    href={`/admin/sellers/${seller.id}/edit`}
                                    className="text-blue-500 hover:text-blue-700"
                                    aria-label="ویرایش"
                                  >
                                    <TbEdit className="h-5 w-5" />
                                  </Link>
                                  <button
                                    onClick={() => handleDeleteClick(seller.id)}
                                    className="text-red-500 hover:text-red-700"
                                    aria-label="حذف"
                                  >
                                    <TbTrash className="h-5 w-5" />
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
                {filteredSellers.map((seller) => (
                  <div key={seller.id} className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                    <div className="p-4">
                      <div className="border-b border-gray-100 pb-3">
                        <h3 className="font-bold text-gray-900 text-lg">{seller.shopName}</h3>
                        <div className="mt-1 flex items-center justify-between">
                          <div className="text-sm text-gray-500">{seller.username}</div>
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            seller.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {seller.isActive ? 'فعال' : 'غیرفعال'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="py-3 text-sm">
                        <div className="grid grid-cols-1 gap-2">
                          <div className="flex justify-between">
                            <span className="text-gray-500">ایمیل:</span>
                            <span className="text-gray-900 text-left">{seller.email}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">تاریخ ثبت‌نام:</span>
                            <span className="text-gray-900">{formatDate(seller.createdAt)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">اشتراک:</span>
                            <span className="text-gray-900">
                              {seller.subscription ? (
                                <div className="text-left">
                                  <span className="block">{seller.subscription.planName}</span>
                                  <span className="text-xs text-gray-400">
                                    تا {formatDate(seller.subscription.endDate)}
                                  </span>
                                </div>
                              ) : (
                                "بدون اشتراک"
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 border-t border-gray-100 pt-3 flex justify-end">
                        <div className="flex space-x-2 space-x-reverse">
                          <Link
                            href={`/admin/sellers/${seller.id}`}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                          >
                            <TbEye className="ml-1.5 h-4 w-4" />
                            نمایش
                          </Link>
                          <Link
                            href={`/admin/sellers/${seller.id}/edit`}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-blue-700 bg-white hover:bg-gray-50 focus:outline-none"
                          >
                            <TbEdit className="ml-1.5 h-4 w-4" />
                            ویرایش
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(seller.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-red-700 bg-white hover:bg-gray-50 focus:outline-none"
                          >
                            <TbTrash className="ml-1.5 h-4 w-4" />
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
          <tr>
            <td colSpan={7} className="px-3 py-4 text-sm text-center text-gray-500">
              فروشنده‌ای یافت نشد
            </td>
          </tr>
        )}
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
                    حذف فروشنده
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      آیا از حذف این فروشنده اطمینان دارید؟ این عمل غیرقابل بازگشت است و تمامی داده‌های مرتبط با این فروشنده حذف خواهد شد.
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