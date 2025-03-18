'use client';

import { useState } from 'react';
import OrdersClient from './OrdersClient';
import SubscriptionsClient from './SubscriptionsClient';

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'subscriptions'>('orders');

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">پنل مدیریت سفارش‌ها</h1>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-8 space-x-reverse">
          <button
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'orders'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('orders')}
          >
            سفارش‌های فروشگاه‌ها
          </button>
          <button
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'subscriptions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('subscriptions')}
          >
            اشتراک‌های خریداری شده
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'orders' ? <OrdersClient /> : <SubscriptionsClient />}
    </div>
  )
} 