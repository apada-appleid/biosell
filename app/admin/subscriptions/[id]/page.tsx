'use client';

import React, { useEffect, useState } from 'react';
import { formatDate, formatPrice } from '@/lib/utils';
import Image from 'next/image';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Pencil, 
  Check, 
  X, 
  CalendarDays, 
  Store, 
  Wallet, 
  Clock, 
  Receipt 
} from 'lucide-react';
import Link from 'next/link';

interface Seller {
  id: string;
  username: string;
  shopName: string;
  email: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  maxProducts: number;
}

interface ReceiptInfo {
  key: string;
  url: string;
  bucket: string;
  filename?: string;
  size?: number;
  contentType?: string;
}

interface Subscription {
  id: string;
  sellerId: string;
  planId: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  seller: Seller;
  plan: Plan;
  receiptInfo?: ReceiptInfo;
}

export default function SubscriptionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [updatePlanLoading, setUpdatePlanLoading] = useState(false);

  // Fetch subscription data
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoading(true);
        const subscriptionId = (await params).id;
        const res = await fetch(`/api/admin/subscriptions/${subscriptionId}`);
        
        if (!res.ok) {
          throw new Error('خطا در دریافت اطلاعات اشتراک');
        }
        
        const data = await res.json();
        setSubscription(data);
        setSelectedPlanId(data.planId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'خطای ناشناخته رخ داده است');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubscription();
  }, [params]);

  // Fetch all available plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch('/api/admin/plans');
        
        if (!res.ok) {
          throw new Error('خطا در دریافت لیست پلن‌ها');
        }
        
        const data = await res.json();
        setPlans(data);
      } catch (err) {
        console.error('Error fetching plans:', err);
      }
    };
    
    fetchPlans();
  }, []);

  // Toggle subscription status
  const handleToggleStatus = async () => {
    if (!subscription) return;
    
    try {
      setUpdateLoading(true);
      const subscriptionId = (await params).id;
      const res = await fetch(`/api/admin/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !subscription.isActive,
        }),
      });
      
      if (!res.ok) {
        throw new Error('خطا در بروزرسانی وضعیت اشتراک');
      }
      
      const updatedSubscription = await res.json();
      setSubscription(updatedSubscription);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در بروزرسانی اشتراک');
    } finally {
      setUpdateLoading(false);
    }
  };

  // Update subscription plan
  const handleUpdatePlan = async () => {
    if (!subscription || selectedPlanId === subscription.planId) return;
    
    try {
      setUpdatePlanLoading(true);
      const subscriptionId = (await params).id;
      const res = await fetch(`/api/admin/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: selectedPlanId,
        }),
      });
      
      if (!res.ok) {
        throw new Error('خطا در بروزرسانی پلن اشتراک');
      }
      
      const updatedSubscription = await res.json();
      setSubscription(updatedSubscription);
      setIsEditingPlan(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در بروزرسانی پلن');
    } finally {
      setUpdatePlanLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  if (error || !subscription) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">خطا</h1>
          <p className="text-red-500 mb-6">{error || 'اشتراک یافت نشد'}</p>
          <Link href="/admin/subscriptions" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="h-4 w-4 ml-1" />
            بازگشت به لیست اشتراک‌ها
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (!subscription) return null;

    if (!subscription.isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
          <XCircle className="h-5 w-5 ml-1 text-gray-600" />
          غیرفعال
        </span>
      );
    }

    const now = new Date();
    const endDate = new Date(subscription.endDate);
    
    if (endDate < now) {
      return (
        <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-800">
          <XCircle className="h-5 w-5 ml-1 text-red-600" />
          منقضی شده
        </span>
      );
    }
    
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 7) {
      return (
        <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
          <CheckCircle className="h-5 w-5 ml-1 text-yellow-600" />
          {daysLeft} روز مانده
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
        <CheckCircle className="h-5 w-5 ml-1 text-green-600" />
        فعال
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <div className="flex items-center mb-4 sm:mb-0">
          <Link
            href="/admin/subscriptions"
            className="inline-flex items-center ml-4 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 ml-1" />
            بازگشت به لیست
          </Link>
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900">جزئیات اشتراک</h1>
        </div>
        {getStatusBadge()}
      </div>
      
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 border-b border-blue-100 pb-4">
          <div className="flex items-center mb-4 sm:mb-0">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 ml-3">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-900">{subscription.seller.shopName}</h2>
              <p className="text-sm text-gray-600">{subscription.seller.username}</p>
            </div>
          </div>
          <button
            onClick={handleToggleStatus}
            disabled={updateLoading}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              subscription.isActive
                ? 'bg-red-50 text-red-700 hover:bg-red-100'
                : 'bg-green-50 text-green-700 hover:bg-green-100'
            } flex items-center`}
          >
            {updateLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin h-4 w-4 ml-2 text-current" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                در حال پردازش...
              </span>
            ) : subscription.isActive ? (
              <>
                <XCircle className="h-4 w-4 ml-2" />
                غیرفعال کردن
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 ml-2" />
                فعال کردن
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plan Information */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Receipt className="h-5 w-5 ml-2 text-blue-600" />
                اطلاعات پلن
              </h3>
              <button
                onClick={() => setIsEditingPlan(true)}
                className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium"
                disabled={updatePlanLoading}
              >
                {isEditingPlan ? (
                  <>
                    <X className="h-4 w-4 ml-1" />
                    انصراف
                  </>
                ) : (
                  <>
                    <Pencil className="h-4 w-4 ml-1" />
                    تغییر پلن
                  </>
                )}
              </button>
            </div>

            {isEditingPlan ? (
              <div className="bg-blue-50 p-3 rounded-md">
                <div className="mb-4">
                  <label htmlFor="planSelect" className="block text-sm font-medium text-gray-700 mb-1">
                    انتخاب پلن جدید:
                  </label>
                  <select
                    id="planSelect"
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                  >
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} - {formatPrice(plan.price)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex space-x-2 space-x-reverse">
                  <button
                    onClick={handleUpdatePlan}
                    disabled={updatePlanLoading || selectedPlanId === subscription.planId}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updatePlanLoading ? (
                      <svg className="animate-spin h-4 w-4 ml-2 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <Check className="h-4 w-4 ml-1" />
                    )}
                    ذخیره
                  </button>
                  <button
                    onClick={() => setIsEditingPlan(false)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <X className="h-4 w-4 ml-1" />
                    انصراف
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start">
                  <span className="text-gray-500 ml-2 w-32">نام پلن:</span>
                  <span className="font-medium">{subscription.plan.name}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-gray-500 ml-2 w-32">قیمت:</span>
                  <span className="font-medium">{formatPrice(subscription.plan.price)}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-gray-500 ml-2 w-32">تعداد محصولات:</span>
                  <span className="font-medium">{subscription.plan.maxProducts} محصول</span>
                </div>
              </div>
            )}
          </div>

          {/* Subscription Information */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 flex items-center mb-4">
              <Clock className="h-5 w-5 ml-2 text-blue-600" />
              اطلاعات دوره
            </h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <span className="text-gray-500 ml-2 w-32">تاریخ شروع:</span>
                <span className="font-medium flex items-center">
                  <CalendarDays className="h-4 w-4 ml-1 text-gray-400" />
                  {formatDate(subscription.startDate)}
                </span>
              </div>
              <div className="flex items-start">
                <span className="text-gray-500 ml-2 w-32">تاریخ پایان:</span>
                <span className="font-medium flex items-center">
                  <CalendarDays className="h-4 w-4 ml-1 text-gray-400" />
                  {formatDate(subscription.endDate)}
                </span>
              </div>
              <div className="flex items-start">
                <span className="text-gray-500 ml-2 w-32">وضعیت:</span>
                {getStatusBadge()}
              </div>
            </div>
          </div>
        </div>

        {/* Receipt Information */}
        {subscription.receiptInfo && (
          <div className="mt-6 bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 flex items-center mb-4">
              <Wallet className="h-5 w-5 ml-2 text-blue-600" />
              تصویر رسید پرداخت
            </h3>
            <div className="overflow-hidden rounded-lg max-w-lg mx-auto border border-gray-200">
              <Image
                src={subscription.receiptInfo.url}
                alt="رسید پرداخت"
                width={800}
                height={800}
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 