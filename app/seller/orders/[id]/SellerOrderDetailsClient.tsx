'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { FiArrowLeft, FiUser, FiMail, FiPhone, FiCalendar, FiCreditCard } from 'react-icons/fi';

interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  totalPrice: number;
  product: {
    id: string;
    title: string;
    price: number;
    images: {
      id: string;
      imageUrl: string;
    }[];
  };
}

interface Customer {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
}

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  shippingAddress: string;
  customer: Customer;
  items: OrderItem[];
}

export default function SellerOrderDetailsClient({ params }: { params: { id: string } }) {
  const { status: sessionStatus } = useSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Fetch order details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (sessionStatus === 'loading') return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/seller/orders/${params.id}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'خطا در دریافت اطلاعات سفارش');
        }
        
        const orderData = await response.json();
        setOrder(orderData);
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError(err instanceof Error ? err.message : 'خطا در دریافت اطلاعات سفارش');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (params.id) {
      fetchOrderDetails();
    }
  }, [params.id, sessionStatus]);
  
  // Update order status
  const updateOrderStatus = async (newStatus: string) => {
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/seller/orders/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'خطا در بروزرسانی وضعیت سفارش');
      }
      
      const updatedOrder = await response.json();
      setOrder(updatedOrder);
    } catch (err) {
      console.error('Error updating order status:', err);
      alert(err instanceof Error ? err.message : 'خطا در بروزرسانی وضعیت سفارش');
    } finally {
      setIsUpdating(false);
    }
  };
  
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
  
  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'پرداخت شده';
      case 'pending':
        return 'در انتظار پرداخت';
      case 'failed':
        return 'ناموفق';
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
          <h1 className="text-xl font-medium text-gray-900 mb-4">خطا در دریافت اطلاعات</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/seller/orders"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            بازگشت به سفارش‌ها
          </Link>
        </div>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <h1 className="text-xl font-medium text-gray-900 mb-4">سفارش یافت نشد</h1>
          <p className="text-gray-600 mb-6">متاسفانه سفارش مورد نظر شما یافت نشد.</p>
          <Link
            href="/seller/orders"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            بازگشت به سفارش‌ها
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* هدر صفحه */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/seller/orders"
          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          <FiArrowLeft className="ml-1 h-5 w-5" />
          بازگشت به سفارش‌ها
        </Link>
        
        <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusColor(order.status)}`}>
          {getStatusText(order.status)}
        </span>
      </div>
      
      {/* اطلاعات اصلی سفارش */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            سفارش #{order.orderNumber}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 flex items-center">
            <FiCalendar className="inline-block ml-1" />
            تاریخ سفارش: {formatDate(order.createdAt)}
          </p>
        </div>
        
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">شماره سفارش</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{order.orderNumber}</dd>
            </div>
            <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <FiCreditCard className="ml-1" />
                روش پرداخت
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {order.paymentMethod === 'credit_card' ? 'پرداخت آنلاین' : 
                 order.paymentMethod === 'cash_on_delivery' ? 'پرداخت در محل' : 
                 order.paymentMethod}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">وضعیت پرداخت</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {getPaymentStatusText(order.paymentStatus)}
              </dd>
            </div>
            {order.shippingAddress && (
              <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">آدرس تحویل</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{order.shippingAddress}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
      
      {/* اطلاعات مشتری */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            اطلاعات مشتری
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <FiUser className="ml-1" />
                نام مشتری
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{order.customer.fullName}</dd>
            </div>
            <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <FiMail className="ml-1" />
                ایمیل
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{order.customer.email}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <FiPhone className="ml-1" />
                شماره تماس
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{order.customer.mobile}</dd>
            </div>
          </dl>
        </div>
      </div>
      
      {/* محصولات سفارش */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            محصولات سفارش
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <ul role="list" className="divide-y divide-gray-200">
            {order.items.map((item) => (
              <li key={item.id} className="p-4 sm:p-6">
                <div className="flex items-center flex-col sm:flex-row">
                  <div className="ml-4 flex-shrink-0 w-20 h-20 bg-gray-200 overflow-hidden rounded-md relative">
                    <Image
                      src={
                        item.product?.images?.[0]?.imageUrl || 
                        '/images/placeholder.jpg'
                      }
                      alt={item.title}
                      fill
                      sizes="80px"
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/placeholder.jpg';
                      }}
                    />
                  </div>
                  <div className="flex-1 mt-4 sm:mt-0">
                    <h4 className="text-md font-medium text-gray-900">{item.title}</h4>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {formatPrice(item.price)} × {item.quantity}
                        </p>
                      </div>
                      <div className="mt-2 sm:mt-0">
                        <p className="text-sm font-medium text-gray-900">
                          {formatPrice(item.totalPrice)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      {/* خلاصه سفارش و اقدامات */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            خلاصه سفارش
          </h3>
          <p className="text-lg font-bold text-gray-900">
            {formatPrice(order.total)}
          </p>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5">
          <h4 className="text-md font-medium text-gray-900 mb-4">تغییر وضعیت سفارش</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => updateOrderStatus('pending')}
              disabled={order.status === 'pending' || isUpdating}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                order.status === 'pending' 
                  ? 'bg-yellow-100 text-yellow-800 cursor-not-allowed' 
                  : 'bg-yellow-500 text-white hover:bg-yellow-600'
              }`}
            >
              در انتظار تأیید
            </button>
            
            <button
              onClick={() => updateOrderStatus('processing')}
              disabled={order.status === 'processing' || isUpdating}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                order.status === 'processing' 
                  ? 'bg-blue-100 text-blue-800 cursor-not-allowed' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              در حال پردازش
            </button>
            
            <button
              onClick={() => updateOrderStatus('completed')}
              disabled={order.status === 'completed' || isUpdating}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                order.status === 'completed' 
                  ? 'bg-green-100 text-green-800 cursor-not-allowed' 
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              تکمیل شده
            </button>
            
            <button
              onClick={() => updateOrderStatus('cancelled')}
              disabled={order.status === 'cancelled' || isUpdating}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                order.status === 'cancelled' 
                  ? 'bg-red-100 text-red-800 cursor-not-allowed' 
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              لغو سفارش
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 