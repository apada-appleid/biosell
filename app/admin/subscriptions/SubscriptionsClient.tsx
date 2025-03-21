'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { CheckCircle, XCircle, Eye, Calendar, Package } from 'lucide-react';

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
}

export default function SubscriptionsClient() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/subscriptions');
        
        if (!res.ok) {
          throw new Error('خطا در دریافت لیست اشتراک‌ها');
        }
        
        const data = await res.json();
        setSubscriptions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'خطای ناشناخته رخ داده است');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubscriptions();
  }, []);

  const getStatusBadge = (subscription: Subscription) => {
    if (!subscription.isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <XCircle className="h-3 w-3 ml-1" />
          غیرفعال
        </span>
      );
    }

    const now = new Date();
    const endDate = new Date(subscription.endDate);
    
    if (endDate < now) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="h-3 w-3 ml-1" />
          منقضی شده
        </span>
      );
    }
    
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 7) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <CheckCircle className="h-3 w-3 ml-1" />
          {daysLeft} روز مانده
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 ml-1" />
        فعال
      </span>
    );
  };
  
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 my-4">
        <div className="flex">
          <div className="mr-3">
            <h3 className="text-sm font-medium text-red-800">خطا</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-10 border rounded-md border-dashed">
        <h3 className="text-sm font-medium text-gray-500">هیچ اشتراکی یافت نشد</h3>
        <p className="mt-1 text-sm text-gray-500">هیچ اشتراک فروشنده‌ای در سیستم ثبت نشده است.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow rounded-lg">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
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
                تاریخ‌ها
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                وضعیت
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                عملیات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {subscriptions.map((subscription) => (
              <tr key={subscription.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm font-medium text-gray-900">{subscription.seller.shopName}</div>
                  <div className="text-sm text-gray-500">{subscription.seller.username}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm font-medium text-gray-900">{subscription.plan.name}</div>
                  <div className="text-sm text-gray-500">{subscription.plan.price.toLocaleString()} تومان</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm text-gray-500">
                    <div>شروع: {formatDate(subscription.startDate)}</div>
                    <div>پایان: {formatDate(subscription.endDate)}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {getStatusBadge(subscription)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                  <Link
                    href={`/admin/subscriptions/${subscription.id}`}
                    className="inline-flex items-center px-3 py-1.5 text-indigo-600 hover:text-indigo-900 rounded-md hover:bg-indigo-50"
                  >
                    <Eye className="h-4 w-4 ml-1" />
                    مشاهده
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-gray-200">
        {subscriptions.map((subscription) => (
          <div key={subscription.id} className="p-4 hover:bg-gray-50">
            <div className="flex justify-between items-start mb-2">
              <div className="text-sm font-medium text-gray-900">{subscription.seller.shopName}</div>
              {getStatusBadge(subscription)}
            </div>
            <div className="text-xs text-gray-500 mb-3">{subscription.seller.username}</div>
            
            <div className="flex items-center text-xs text-gray-600 mb-2">
              <Package className="h-3.5 w-3.5 ml-1 text-gray-500" />
              <span className="font-medium">{subscription.plan.name}</span>
              <span className="mx-1">•</span>
              <span>{subscription.plan.price.toLocaleString()} تومان</span>
            </div>
            
            <div className="flex items-center text-xs text-gray-600 mb-3">
              <Calendar className="h-3.5 w-3.5 ml-1 text-gray-500" />
              <div className="flex flex-col">
                <span>شروع: {formatDate(subscription.startDate)}</span>
                <span>پایان: {formatDate(subscription.endDate)}</span>
              </div>
            </div>
            
            <div className="mt-3 flex justify-end">
              <Link
                href={`/admin/subscriptions/${subscription.id}`}
                className="inline-flex items-center px-3 py-1.5 text-indigo-600 bg-indigo-50 rounded-md text-sm"
              >
                <Eye className="h-3.5 w-3.5 ml-1" />
                مشاهده
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 