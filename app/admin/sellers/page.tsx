'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TbEdit, TbTrash, TbPlus, TbSearch, TbEye } from 'react-icons/tb';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToastStore } from '@/app/store/toast';

type PaymentInfo = {
  id: string;
  status: string;
  amount: number;
  createdAt: string;
};

type SubscriptionInfo = {
  id: string;
  planId: string;
  planName: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  maxProducts: number;
};

type PendingSubscriptionInfo = {
  id: string;
  planId: string;
  planName: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  maxProducts: number;
  paymentId: string;
  paymentStatus?: 'pending' | 'approved' | 'rejected';
  payment?: PaymentInfo;
};

type Seller = {
  id: string;
  username: string;
  email: string;
  shopName: string;
  isActive: boolean;
  createdAt: string;
  subscription?: SubscriptionInfo;
  activeSubscription?: SubscriptionInfo;
  pendingSubscription?: PendingSubscriptionInfo;
};

export default function SellersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [reviewSeller, setReviewSeller] = useState<Seller | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingSubscription, setProcessingSubscription] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Handle authentication
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    
    if (status === 'authenticated' && session?.user?.type !== 'admin') {
      router.push('/');
      return;
    }
    
    if (status === 'authenticated' && session?.user?.type === 'admin') {
      fetchSellers();
    }
  }, [status, session, router]);

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
            id: 's1',
            planId: 'p1',
            planName: 'حرفه‌ای',
            startDate: '2023-08-15T10:00:00Z',
            endDate: '2024-08-15T10:00:00Z',
            isActive: true,
            maxProducts: 100
          }
        },
        {
          id: '2',
          username: 'nikan_studio',
          email: 'contact@nikanstudio.com',
          shopName: 'استودیو عکاسی نیکان',
          isActive: true,
          createdAt: '2023-09-20T14:30:00Z',
          pendingSubscription: {
            id: 's2',
            planId: 'p2',
            planName: 'پایه',
            startDate: '2023-09-20T14:30:00Z',
            endDate: '2024-03-20T14:30:00Z',
            isActive: false,
            maxProducts: 50,
            paymentId: 'pay1',
            paymentStatus: 'pending'
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
            id: 's3',
            planId: 'p3',
            planName: 'ویژه',
            startDate: '2023-01-05T09:15:00Z',
            endDate: '2023-12-05T09:15:00Z',
            isActive: false,
            maxProducts: 200
          }
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleDeleteClick = (sellerId: string) => {
    setConfirmDelete(sellerId);
  };

  const handleConfirmDelete = async () => {
    // Implementation for delete confirmation
  };

  const handleCancelDelete = () => {
    setConfirmDelete(null);
  };

  const openReviewModal = (seller: Seller) => {
    setReviewSeller(seller);
    setIsReviewModalOpen(true);
  };

  const closeReviewModal = () => {
    setIsReviewModalOpen(false);
    setReviewSeller(null);
    setReviewNotes('');
    setError(null);
  };

  const handleReviewAction = async (sellerId: string, subscriptionId: string, paymentId: string, status: 'approved' | 'rejected', notes?: string) => {
    setProcessingSubscription(true);
    setError(null);
    
    try {
      if (!subscriptionId || !paymentId) {
        throw new Error('Invalid subscription information');
      }
      
      if (!session) {
        throw new Error('Your session has expired. Please refresh the page.');
      }
      
      const response = await fetch(`/api/admin/subscriptions/${paymentId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, notes: notes || '' }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `Failed to ${status} subscription`);
      }
      
      // Success handling
      if (data.success) {
        // Show success message
        const message = status === 'approved' ? 'اشتراک تایید شد!' : 'اشتراک رد شد';
        useToastStore.getState().showToast(message);
        
        // Close the modal
        closeReviewModal();
        
        // Refresh the data to ensure UI is in sync with database
        fetchSellers();
      } else {
        throw new Error(data.message || `Error processing subscription: ${status}`);
      }
      
    } catch (error) {
      console.error('Error processing subscription:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process subscription';
      setError(errorMessage);
      
      // Show error message
      useToastStore.getState().showToast(errorMessage, undefined, 'error');
    } finally {
      setProcessingSubscription(false);
    }
  };

  const filteredSellers = sellers.filter(
    seller => 
      seller.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">مدیریت فروشندگان</h1>
        <div className="text-center py-10">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">مدیریت فروشندگان</h1>
        <Link href="/admin/sellers/new" className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center">
          <TbPlus className="mr-2" /> فروشنده جدید
        </Link>
      </div>
      
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <TbSearch className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="جستجو براساس نام، ایمیل یا نام فروشگاه..."
          className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>
      
      {filteredSellers.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          هیچ فروشنده‌ای یافت نشد.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-md">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-right text-sm font-medium text-gray-500 tracking-wider">نام فروشگاه</th>
                <th className="py-3 px-4 text-right text-sm font-medium text-gray-500 tracking-wider">نام کاربری</th>
                <th className="py-3 px-4 text-right text-sm font-medium text-gray-500 tracking-wider">ایمیل</th>
                <th className="py-3 px-4 text-right text-sm font-medium text-gray-500 tracking-wider">وضعیت</th>
                <th className="py-3 px-4 text-right text-sm font-medium text-gray-500 tracking-wider">اشتراک</th>
                <th className="py-3 px-4 text-right text-sm font-medium text-gray-500 tracking-wider">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSellers.map((seller) => (
                <tr key={seller.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4 text-sm">{seller.shopName}</td>
                  <td className="py-4 px-4 text-sm">{seller.username}</td>
                  <td className="py-4 px-4 text-sm">{seller.email}</td>
                  <td className="py-4 px-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${seller.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {seller.isActive ? 'فعال' : 'غیرفعال'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm">
                    {seller.subscription ? (
                      <span className="text-green-600">
                        {seller.subscription.planName} (تا {new Date(seller.subscription.endDate).toLocaleDateString('fa-IR')})
                      </span>
                    ) : seller.pendingSubscription ? (
                      <div>
                        <span className="text-yellow-600">
                          در انتظار تایید: {seller.pendingSubscription.planName}
                        </span>
                        <button
                          onClick={() => openReviewModal(seller)}
                          className="mx-2 text-blue-600 hover:text-blue-800 underline text-xs"
                        >
                          بررسی
                        </button>
                      </div>
                    ) : (
                      <span className="text-red-600">بدون اشتراک</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-sm whitespace-nowrap">
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <Link href={`/admin/sellers/${seller.id}`} className="text-blue-600 hover:text-blue-800">
                        <TbEye size={20} />
                      </Link>
                      <Link href={`/admin/sellers/${seller.id}/edit`} className="text-yellow-600 hover:text-yellow-800">
                        <TbEdit size={20} />
                      </Link>
                      <button 
                        onClick={() => handleDeleteClick(seller.id)} 
                        className="text-red-600 hover:text-red-800"
                      >
                        <TbTrash size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">تایید حذف</h3>
            <p className="mb-6">آیا از حذف این فروشنده اطمینان دارید؟ این عمل قابل بازگشت نیست.</p>
            <div className="flex justify-end space-x-2 rtl:space-x-reverse">
              <button
                onClick={handleConfirmDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-md"
              >
                حذف
              </button>
              <button
                onClick={handleCancelDelete}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Review Subscription Modal */}
      {isReviewModalOpen && reviewSeller && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">بررسی درخواست اشتراک</h3>
            
            <div className="mb-4">
              <p className="mb-2">
                فروشنده <span className="font-bold">{reviewSeller.shopName}</span> برای پلن <span className="font-bold">{reviewSeller.pendingSubscription?.planName}</span> درخواست داده است.
              </p>
              
              {reviewSeller.pendingSubscription?.payment && 
                <div className="mt-2 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm font-medium">وضعیت پرداخت: 
                    <span className={`mr-2 px-2 py-0.5 rounded-full text-xs ${
                      reviewSeller.pendingSubscription.paymentStatus === 'approved' 
                        ? 'bg-green-100 text-green-800' 
                        : reviewSeller.pendingSubscription.paymentStatus === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {reviewSeller.pendingSubscription.paymentStatus === 'approved' 
                        ? 'تأیید شده' 
                        : reviewSeller.pendingSubscription.paymentStatus === 'rejected'
                          ? 'رد شده'
                          : 'در انتظار بررسی'}
                    </span>
                  </p>
                  <p className="text-sm mt-1">مبلغ: {reviewSeller.pendingSubscription.payment.amount.toLocaleString()} تومان</p>
                  <p className="text-sm mt-1">تاریخ پرداخت: {new Date(reviewSeller.pendingSubscription.payment.createdAt).toLocaleDateString('fa-IR')}</p>
                </div>
              }
              
              {error && (
                <div className="bg-red-100 text-red-800 p-2 rounded mb-4">
                  {error}
                </div>
              )}
              
              <div className="mt-4">
                <label htmlFor="review-notes" className="block text-sm font-medium text-gray-700">
                  یادداشت بررسی (اختیاری)
                </label>
                <textarea
                  id="review-notes"
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="توضیحات یا دلایل تایید/رد را اینجا بنویسید..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 rtl:space-x-reverse">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                onClick={() => handleReviewAction(reviewSeller.id, reviewSeller.pendingSubscription?.id || '', reviewSeller.pendingSubscription?.paymentId || '', 'approved', reviewNotes)}
                disabled={processingSubscription}
              >
                {processingSubscription ? 'در حال ثبت...' : 'تایید اشتراک'}
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                onClick={() => handleReviewAction(reviewSeller.id, reviewSeller.pendingSubscription?.id || '', reviewSeller.pendingSubscription?.paymentId || '', 'rejected', reviewNotes)}
                disabled={processingSubscription}
              >
                {processingSubscription ? 'در حال ثبت...' : 'رد درخواست'}
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={closeReviewModal}
                disabled={processingSubscription}
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 