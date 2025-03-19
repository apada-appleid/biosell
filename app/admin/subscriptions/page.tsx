'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Types
type PlanPayment = {
  id: string;
  subscriptionId: string;
  sellerId: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  receiptInfo?: {
    key: string;
    url: string;
    bucket: string;
    filename?: string;
    contentType?: string;
  } | string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
  createdAt: string;
  seller: {
    id: string;
    username: string;
    shopName: string;
    email: string;
  };
  subscription: {
    id: string;
    planId: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    plan: {
      id: string;
      name: string;
      price: number;
    };
  };
};

export default function AdminSubscriptionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [payments, setPayments] = useState<PlanPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PlanPayment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  
  // Fetch payments
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    
    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/');
      return;
    }
    
    fetchPayments();
  }, [status, session, router]);
  
  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/subscriptions');
      const data = await response.json();
      
      if (data.success) {
        setPayments(data.payments);
      } else {
        setError(data.message || 'خطا در دریافت اطلاعات پرداخت‌ها');
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('خطا در ارتباط با سرور');
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };
  
  const handleViewPayment = (payment: PlanPayment) => {
    setSelectedPayment(payment);
    setIsModalOpen(true);
  };
  
  const handleReviewPayment = async (status: 'approved' | 'rejected') => {
    if (!selectedPayment) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/admin/subscriptions/${selectedPayment.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          notes: reviewNotes,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Close modal and refresh data
        setIsModalOpen(false);
        setSelectedPayment(null);
        setReviewNotes('');
        fetchPayments();
      } else {
        setError(data.message || 'خطا در ثبت بررسی');
      }
    } catch (err) {
      console.error('Error reviewing payment:', err);
      setError('خطا در ارتباط با سرور');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'در انتظار بررسی';
      case 'approved':
        return 'تأیید شده';
      case 'rejected':
        return 'رد شده';
      default:
        return status;
    }
  };
  
  const filteredPayments = currentFilter === 'all' 
    ? payments 
    : payments.filter(payment => payment.status === currentFilter);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <span className="mr-4 text-lg">در حال بارگذاری اطلاعات...</span>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">مدیریت اشتراک‌های فروشندگان</h1>
        <p className="text-gray-600">
          در این بخش می‌توانید درخواست‌های خرید پلن فروشندگان را مشاهده و بررسی نمایید.
        </p>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
        <div className="flex flex-wrap items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">لیست درخواست‌ها</h2>
          
          <div className="flex mt-4 md:mt-0">
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                onClick={() => setCurrentFilter('all')}
                className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                  currentFilter === 'all' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                همه
              </button>
              <button
                type="button"
                onClick={() => setCurrentFilter('pending')}
                className={`px-4 py-2 text-sm font-medium border-y ${
                  currentFilter === 'pending' 
                    ? 'bg-indigo-600 text-white border-indigo-600' 
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                }`}
              >
                در انتظار بررسی
              </button>
              <button
                type="button"
                onClick={() => setCurrentFilter('approved')}
                className={`px-4 py-2 text-sm font-medium border-y ${
                  currentFilter === 'approved' 
                    ? 'bg-indigo-600 text-white border-indigo-600' 
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                }`}
              >
                تأیید شده
              </button>
              <button
                type="button"
                onClick={() => setCurrentFilter('rejected')}
                className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                  currentFilter === 'rejected' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                رد شده
              </button>
            </div>
            
            <button
              type="button"
              onClick={fetchPayments}
              className="mr-3 flex items-center px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              بروزرسانی
            </button>
          </div>
        </div>
        
        {filteredPayments.length === 0 ? (
          <div className="p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600">هیچ درخواستی با فیلتر انتخاب شده یافت نشد.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    فروشنده
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    پلن
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    مبلغ
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    تاریخ درخواست
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    وضعیت
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.seller.shopName}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {payment.seller.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {payment.subscription.plan.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatPrice(payment.amount)} تومان
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(payment.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(payment.status)}`}>
                        {getStatusText(payment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewPayment(payment)}
                        className="text-indigo-600 hover:text-indigo-900 ml-4"
                      >
                        مشاهده
                      </button>
                      
                      {payment.status === 'pending' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedPayment(payment);
                              setReviewNotes('');
                              setIsModalOpen(true);
                            }}
                            className="text-green-600 hover:text-green-900 ml-4"
                          >
                            بررسی
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Modal for viewing and reviewing payment */}
      {isModalOpen && selectedPayment && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">
                جزئیات درخواست اشتراک
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedPayment(null);
                  setReviewNotes('');
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-10rem)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="mb-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">اطلاعات فروشنده</h4>
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">نام فروشگاه</dt>
                        <dd className="mt-1 text-sm text-gray-900">{selectedPayment.seller.shopName}</dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">نام کاربری</dt>
                        <dd className="mt-1 text-sm text-gray-900">{selectedPayment.seller.username}</dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">ایمیل</dt>
                        <dd className="mt-1 text-sm text-gray-900">{selectedPayment.seller.email}</dd>
                      </div>
                    </dl>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">اطلاعات پلن</h4>
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">نام پلن</dt>
                        <dd className="mt-1 text-sm text-gray-900">{selectedPayment.subscription.plan.name}</dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">مبلغ</dt>
                        <dd className="mt-1 text-sm text-gray-900">{formatPrice(selectedPayment.amount)} تومان</dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">تاریخ شروع</dt>
                        <dd className="mt-1 text-sm text-gray-900">{formatDate(selectedPayment.subscription.startDate)}</dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">تاریخ پایان</dt>
                        <dd className="mt-1 text-sm text-gray-900">{formatDate(selectedPayment.subscription.endDate)}</dd>
                      </div>
                    </dl>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">وضعیت درخواست</h4>
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">وضعیت</dt>
                        <dd className="mt-1">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(selectedPayment.status)}`}>
                            {getStatusText(selectedPayment.status)}
                          </span>
                        </dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">تاریخ درخواست</dt>
                        <dd className="mt-1 text-sm text-gray-900">{formatDate(selectedPayment.createdAt)}</dd>
                      </div>
                      
                      {selectedPayment.reviewedAt && (
                        <>
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">تاریخ بررسی</dt>
                            <dd className="mt-1 text-sm text-gray-900">{formatDate(selectedPayment.reviewedAt)}</dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">بررسی کننده</dt>
                            <dd className="mt-1 text-sm text-gray-900">{selectedPayment.reviewedBy || '-'}</dd>
                          </div>
                        </>
                      )}
                      
                      {selectedPayment.notes && (
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-gray-500">توضیحات</dt>
                          <dd className="mt-1 text-sm text-gray-900">{selectedPayment.notes}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                  
                  {selectedPayment.status === 'pending' && (
                    <div className="mt-8">
                      <h4 className="text-lg font-bold text-gray-900 mb-4">بررسی درخواست</h4>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                            توضیحات (اختیاری)
                          </label>
                          <textarea
                            id="notes"
                            rows={3}
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="توضیحات خود را در مورد این درخواست وارد کنید..."
                          />
                        </div>
                        
                        <div className="flex space-x-reverse space-x-4">
                          <button
                            type="button"
                            onClick={() => handleReviewPayment('approved')}
                            disabled={isSubmitting}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            تأیید درخواست
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReviewPayment('rejected')}
                            disabled={isSubmitting}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            رد درخواست
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-4">تصویر فیش پرداخت</h4>
                  {typeof selectedPayment.receiptInfo === 'string' ? (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-yellow-700">اطلاعات فیش در قالب نامعتبر ذخیره شده است.</p>
                    </div>
                  ) : selectedPayment.receiptInfo ? (
                    <div className="border rounded-lg overflow-hidden">
                      <img 
                        src={selectedPayment.receiptInfo.url}
                        alt="تصویر فیش پرداخت"
                        className="w-full h-auto max-h-[500px] object-contain bg-gray-100"
                      />
                      <div className="p-4 bg-gray-50 border-t">
                        <p className="text-sm text-gray-500 mb-1">نام فایل: {selectedPayment.receiptInfo.filename || 'بدون نام'}</p>
                        {selectedPayment.receiptInfo.contentType && (
                          <p className="text-sm text-gray-500">نوع فایل: {selectedPayment.receiptInfo.contentType}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 p-4 rounded-lg text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-yellow-700">تصویر فیش یافت نشد.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="border-t px-6 py-4 bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedPayment(null);
                  setReviewNotes('');
                }}
                className="py-2 px-4 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 