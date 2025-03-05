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
        setOrders(data.orders);
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
        return 'در انتظار';
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
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center">
            <Link 
              href="/seller/dashboard" 
              className="text-gray-800 mr-4"
              aria-label="بازگشت به داشبورد"
              tabIndex={0}
            >
              <FiArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">سفارشات</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <FiPackage className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">هنوز سفارشی ندارید</h2>
            <p className="text-gray-600 mb-6">
              به محض دریافت سفارش، جزئیات آن در اینجا نمایش داده خواهد شد.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">لیست سفارشات</h2>
            
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm text-gray-500">شماره سفارش:</span>
                      <span className="font-medium text-gray-900 mr-2">{order.orderNumber}</span>
                    </div>
                    <div className="flex items-center">
                      {getStatusIcon(order.status)}
                      <span className="text-sm font-medium ml-2">{getStatusText(order.status)}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <span>تاریخ: {formatDate(order.createdAt)}</span>
                  </div>
                </div>
                
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-2">اطلاعات مشتری</h3>
                  <div className="text-sm text-gray-700">
                    <p>نام: {order.customer.fullName}</p>
                    <p>ایمیل: {order.customer.email}</p>
                    <p>تلفن: {order.customer.phone}</p>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 mb-2">محصولات</h3>
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <div>
                          <span className="text-gray-800">{item.title}</span>
                          <span className="text-gray-500 mx-2">×</span>
                          <span className="text-gray-800">{item.quantity}</span>
                        </div>
                        <span className="text-gray-900 font-medium">{formatPrice(item.totalPrice)}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
                    <span className="font-medium text-gray-900">مجموع</span>
                    <span className="font-bold text-gray-900">{formatPrice(order.total)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
} 