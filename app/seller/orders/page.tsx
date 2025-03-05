'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { FiArrowLeft, FiPackage, FiClock, FiCheck, FiX } from 'react-icons/fi';

interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  totalPrice: number;
}

interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
}

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  customer: Customer;
  items: OrderItem[];
}

export default function SellerOrdersPage() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch seller orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (status === 'loading') return;
      
      try {
        setIsLoading(true);
        // Use the API without explicitly passing sellerId
        // The backend will extract the seller ID from the session
        const response = await fetch('/api/orders');
        
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }
        
        const data = await response.json();
        // The API returns an array of orders directly, not wrapped in an 'orders' property
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('خطا در دریافت سفارشات. لطفا دوباره تلاش کنید.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrders();
  }, [status]);
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      maximumFractionDigits: 0
    }).format(price);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <FiClock className="text-yellow-500" />;
      case 'processing':
        return <FiPackage className="text-blue-500" />;
      case 'completed':
        return <FiCheck className="text-green-500" />;
      case 'cancelled':
        return <FiX className="text-red-500" />;
      default:
        return <FiClock className="text-gray-500" />;
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'در انتظار تأیید';
      case 'processing':
        return 'در حال پردازش';
      case 'completed':
        return 'تکمیل شده';
      case 'cancelled':
        return 'لغو شده';
      default:
        return status;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <h1 className="text-xl font-medium text-gray-900 mb-4">خطا</h1>
          <p className="text-gray-600 mb-6">{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">سفارش‌های دریافتی</h1>
      </div>
      
      {orders.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <h2 className="text-xl font-medium text-gray-900 mb-4">هنوز سفارشی ندارید</h2>
          <p className="text-gray-600">سفارش‌های جدید در اینجا نمایش داده خواهند شد.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <ul role="list" className="divide-y divide-gray-200">
            {orders.map((order) => (
              <li key={order.id} className="p-4 hover:bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      {getStatusIcon(order.status)}
                      <h3 className="text-lg font-medium text-gray-900 mr-2">
                        سفارش #{order.orderNumber}
                      </h3>
                      <span className={`mr-2 px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-500">
                      <p>تاریخ: {formatDate(order.createdAt)}</p>
                      <p>مشتری: {order.customer?.fullName || 'نامشخص'}</p>
                      <p>تعداد اقلام: {order.items.length}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 md:mt-0 flex flex-col items-end">
                    <p className="text-lg font-medium text-gray-900">
                      {formatPrice(order.total)}
                    </p>
                    <Link
                      href={`/seller/orders/${order.id}`}
                      className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      مشاهده جزئیات
                      <FiArrowLeft className="mr-1" />
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 