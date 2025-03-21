'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

// Types
type Subscription = {
  id: string;
  planId: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  plan: {
    id: string;
    name: string;
    price: number;
    features: string[];
    maxProducts: number;
  };
  payments?: Array<{
    id: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected';
    receiptInfo?: any;
    createdAt: string;
  }>;
};

export default function SellerSubscriptionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [hasPendingSubscription, setHasPendingSubscription] = useState(false);
  
  useEffect(() => {
    // If not authenticated, redirect to login
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    
    if (status === 'authenticated' && session?.user?.type !== 'seller') {
      router.push('/');
      return;
    }
    
    if (status === 'authenticated') {
      fetchSubscriptions();
    }
  }, [status, session, router]);
  
  const fetchSubscriptions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/seller/subscriptions');
      const data = await response.json();
      
      if (data.success) {
        setSubscriptions(data.subscriptions);
        
        // Find current active subscription if any
        const active = data.subscriptions.find((sub: Subscription) => sub.isActive);
        if (active) {
          setCurrentSubscription(active);
        }
        
        // Check if there is any pending subscription
        const pending = data.subscriptions.find((sub: Subscription) => 
          sub.payments && 
          sub.payments.length > 0 && 
          sub.payments[0].status === 'pending'
        );
        
        setHasPendingSubscription(!!pending);
      } else {
        setError(data.message || 'خطا در دریافت اطلاعات اشتراک‌ها');
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
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
  
  const getRemainingDays = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-lg text-gray-700">در حال بارگذاری اطلاعات اشتراک...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">مدیریت اشتراک</h1>
        <p className="text-gray-600">
          در این بخش می‌توانید اطلاعات اشتراک فعال خود و سوابق پرداخت را مشاهده کنید.
        </p>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      {/* Current Subscription */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
        <div className="border-b px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">اشتراک فعلی</h2>
        </div>
        
        <div className="p-6">
          {currentSubscription ? (
            <div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{currentSubscription.plan.name}</h3>
                  <p className="text-gray-600 mt-1">
                    فعال از {formatDate(currentSubscription.startDate)} تا {formatDate(currentSubscription.endDate)}
                  </p>
                </div>
                
                <div className="mt-4 md:mt-0">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    اشتراک فعال
                  </span>
                </div>
              </div>
              
              <div className="bg-indigo-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-700 font-medium mb-1">زمان باقی‌مانده از اشتراک:</p>
                    <p className="text-2xl font-bold text-indigo-800">
                      {getRemainingDays(currentSubscription.endDate)} روز
                    </p>
                  </div>
                  
                  <div className="hidden md:block">
                    <div className="bg-white rounded-full h-20 w-20 flex items-center justify-center border-4 border-indigo-200">
                      <span className="text-xl font-bold text-indigo-600">
                        {Math.round((getRemainingDays(currentSubscription.endDate) / 30) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <h4 className="font-bold text-gray-900 mb-3">ویژگی‌های پلن:</h4>
              <div className="mt-4 space-y-2 text-sm">
                {Array.isArray(currentSubscription.plan.features) ? 
                  currentSubscription.plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 ml-2" />
                      <span>{feature}</span>
                    </div>
                  )) : (
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 ml-2" />
                      <span>دسترسی به ویژگی‌های پایه</span>
                    </div>
                  )
                }
              </div>
              
              <div className="flex justify-center mt-8">
                {hasPendingSubscription ? (
                  <div className="px-6 py-3 bg-yellow-100 text-yellow-800 font-medium rounded-lg border border-yellow-200 text-center">
                    <span className="flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      شما یک درخواست ارتقای پلن در انتظار بررسی دارید
                    </span>
                    <p className="text-sm mt-2">پس از تایید مدیر سیستم، اشتراک شما فعال خواهد شد</p>
                  </div>
                ) : (
                  <Link
                    href="/seller/plans"
                    className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    ارتقای پلن
                  </Link>
                )}
              </div>
            </div>
          ) : hasPendingSubscription ? (
            <div className="text-center py-6">
              <div className="bg-amber-50 rounded-xl p-6 border border-amber-200 mb-6">
                <div className="flex justify-center mb-4">
                  <div className="rounded-full bg-amber-100 p-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">اشتراک شما در انتظار بررسی است</h3>
                <p className="text-gray-700 mb-4">
                  درخواست اشتراک شما ثبت شده و در صف بررسی قرار دارد. پس از تایید توسط مدیر سیستم، اشتراک شما فعال خواهد شد.
                </p>
                <div className="flex items-center justify-center space-x-2 space-x-reverse">
                  <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse"></div>
                  <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse delay-150"></div>
                  <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse delay-300"></div>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                <div className="flex items-start text-right">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mt-0.5 ml-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-blue-700">
                    لطفاً تا زمان بررسی درخواست شکیبا باشید. در صورت نیاز به اطلاعات بیشتر، کارشناسان ما با شما تماس خواهند گرفت.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xl font-bold text-gray-900 mb-2">شما اشتراک فعالی ندارید</h3>
              <p className="text-gray-600 mb-6">
                برای استفاده از امکانات سایت، یکی از پلن‌های اشتراک را خریداری نمایید.
              </p>
              <Link
                href="/seller/plans"
                className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                مشاهده پلن‌ها
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Subscription History */}
      {subscriptions.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="border-b px-6 py-4">
            <h2 className="text-xl font-bold text-gray-900">تاریخچه اشتراک‌ها</h2>
          </div>
          
          {/* Desktop view - table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    پلن
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    تاریخ شروع
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    تاریخ پایان
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    مبلغ
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    وضعیت
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subscriptions.map((subscription) => (
                  <tr key={subscription.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {subscription.plan.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(subscription.startDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(subscription.endDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatPrice(subscription.plan.price)} تومان
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {subscription.payments && subscription.payments[0] ? (
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(subscription.payments[0].status)}`}>
                          {getStatusText(subscription.payments[0].status)}
                        </span>
                      ) : (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          {subscription.isActive ? 'فعال' : 'غیرفعال'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Mobile view - cards */}
          <div className="md:hidden">
            <div className="divide-y divide-gray-200">
              {subscriptions.map((subscription) => (
                <div key={subscription.id} className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-base font-semibold text-gray-900">{subscription.plan.name}</h3>
                    {subscription.payments && subscription.payments[0] ? (
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(subscription.payments[0].status)}`}>
                        {getStatusText(subscription.payments[0].status)}
                      </span>
                    ) : (
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        {subscription.isActive ? 'فعال' : 'غیرفعال'}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-gray-500">تاریخ شروع</div>
                      <div className="font-medium mt-1">{formatDate(subscription.startDate)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">تاریخ پایان</div>
                      <div className="font-medium mt-1">{formatDate(subscription.endDate)}</div>
                    </div>
                    <div className="col-span-2 mt-2">
                      <div className="text-gray-500">مبلغ</div>
                      <div className="font-medium mt-1">{formatPrice(subscription.plan.price)} تومان</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 