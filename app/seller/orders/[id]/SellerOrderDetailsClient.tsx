'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { FiArrowLeft, FiUser, FiMail, FiPhone, FiCalendar, FiCreditCard, FiFileText, FiAlertTriangle } from 'react-icons/fi';
import { OrderStatus, PaymentStatus } from "@/app/types";

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
    requiresAddress: boolean;
  };
}

interface Customer {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  addresses?: {
    id: string;
    fullName: string;
    mobile: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    isDefault: boolean;
  }[];
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
  formattedAddress?: string;
  addressId?: string;
  customerNotes?: string;
  sellerNotes?: string;
  digitalProductInfo?: string;
  receiptInfo?: {
    key: string;
    url: string;
    bucket: string;
  };
  customer: Customer | null;
  items: OrderItem[];
}

export default function SellerOrderDetailsClient({ params }: { params: { id: string } }) {
  const { status: sessionStatus } = useSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null);
  const [sellerNotes, setSellerNotes] = useState('');
  const [digitalProductInfo, setDigitalProductInfo] = useState('');
  const [isUpdatingNotes, setIsUpdatingNotes] = useState(false);
  const [isUpdatingDigitalInfo, setIsUpdatingDigitalInfo] = useState(false);
  const [notesSuccess, setNotesSuccess] = useState(false);
  const [digitalInfoSuccess, setDigitalInfoSuccess] = useState(false);
  
  // Fetch order details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (sessionStatus === 'loading') return;
      
      try {
        setIsLoading(true);
        const orderId = params.id;
        const response = await fetch(`/api/seller/orders/${orderId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'خطا در دریافت اطلاعات سفارش');
        }
        
        const orderData = await response.json();
        
        // Ensure customer object exists with default values
        if (!orderData.customer) {
          orderData.customer = {
            id: orderData.customerId || 'unknown',
            fullName: 'مشتری ناشناس',
            email: 'نامشخص',
            mobile: 'نامشخص',
            addresses: []
          };
        }
        
        setOrder(orderData);
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError(err instanceof Error ? err.message : 'خطا در دریافت اطلاعات سفارش');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [params, sessionStatus]);
  
  // Initialize seller notes from order data
  useEffect(() => {
    if (order?.sellerNotes) {
      setSellerNotes(order.sellerNotes);
    }
    if (order?.digitalProductInfo) {
      setDigitalProductInfo(order.digitalProductInfo);
    }
  }, [order]);
  
  // Update order status with confirmation
  const initiateStatusUpdate = (newStatus: OrderStatus) => {
    setSelectedStatus(newStatus);
    setShowStatusModal(true);
  };
  
  const confirmStatusUpdate = async () => {
    if (!selectedStatus) return;
    
    try {
      setIsUpdating(true);
      const orderId = params.id;
      const response = await fetch(`/api/seller/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: selectedStatus }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'خطا در بروزرسانی وضعیت سفارش');
      }
      
      const updatedData = await response.json();
      
      // Ensure customer object exists in the updated order
      if (updatedData.order && !updatedData.order.customer) {
        updatedData.order.customer = {
          id: updatedData.order.customerId || '',
          fullName: '',
          email: '',
          mobile: '',
          addresses: []
        };
      }
      
      setOrder(updatedData.order);
      setShowStatusModal(false);
    } catch (err) {
      console.error('Error updating order status:', err);
      alert(err instanceof Error ? err.message : 'خطا در بروزرسانی وضعیت سفارش');
    } finally {
      setIsUpdating(false);
      setSelectedStatus(null);
    }
  };
  
  const cancelStatusUpdate = () => {
    setShowStatusModal(false);
    setSelectedStatus(null);
  };
  
  // Update seller notes
  const updateSellerNotes = async () => {
    if (!order) return;
    
    try {
      setIsUpdatingNotes(true);
      const orderId = params.id;
      const response = await fetch(`/api/seller/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sellerNotes }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'خطا در بروزرسانی یادداشت‌ها');
      }
      
      const updatedData = await response.json();
      setOrder(prevOrder => {
        if (!prevOrder) return null;
        return {
          ...prevOrder,
          sellerNotes: updatedData.order.sellerNotes
        };
      });
      
      // Show success message briefly
      setNotesSuccess(true);
      setTimeout(() => setNotesSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating seller notes:', err);
      alert(err instanceof Error ? err.message : 'خطا در بروزرسانی یادداشت‌ها');
    } finally {
      setIsUpdatingNotes(false);
    }
  };
  
  // Update digital product information
  const updateDigitalProductInfo = async () => {
    if (!order) return;
    
    try {
      setIsUpdatingDigitalInfo(true);
      const orderId = params.id;
      const response = await fetch(`/api/seller/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ digitalProductInfo }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'خطا در بروزرسانی اطلاعات محصول دیجیتال');
      }
      
      const updatedData = await response.json();
      setOrder(prevOrder => {
        if (!prevOrder) return null;
        return {
          ...prevOrder,
          digitalProductInfo: updatedData.order.digitalProductInfo
        };
      });
      
      // Show success message briefly
      setDigitalInfoSuccess(true);
      setTimeout(() => setDigitalInfoSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating digital product info:', err);
      alert(err instanceof Error ? err.message : 'خطا در بروزرسانی اطلاعات محصول دیجیتال');
    } finally {
      setIsUpdatingDigitalInfo(false);
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
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return '';
      }
      
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };
  
  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.pending:
        return 'در انتظار تأیید';
      case OrderStatus.processing:
        return 'در حال پردازش';
      case OrderStatus.completed:
        return 'تکمیل شده';
      case OrderStatus.cancelled:
        return 'لغو شده';
      default:
        return status;
    }
  };
  
  const getPaymentStatusText = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.paid:
        return 'پرداخت شده';
      case PaymentStatus.pending:
        return 'در انتظار پرداخت';
      case PaymentStatus.failed:
        return 'ناموفق';
      default:
        return status;
    }
  };
  
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.pending:
        return 'bg-yellow-100 text-yellow-800';
      case OrderStatus.processing:
        return 'bg-blue-100 text-blue-800';
      case OrderStatus.completed:
        return 'bg-green-100 text-green-800';
      case OrderStatus.cancelled:
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
      {/* Status Update Confirmation Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <FiAlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">تغییر وضعیت سفارش</h3>
              <p className="mb-4 text-gray-600">
                آیا از تغییر وضعیت سفارش از{' '}
                <span className="font-medium">{getStatusText(order.status as OrderStatus)}</span> به{' '}
                <span className="font-medium">{selectedStatus ? getStatusText(selectedStatus) : ''}</span>{' '}
                اطمینان دارید؟
              </p>
              
              {selectedStatus === 'completed' && (
                <div className="mb-4 bg-blue-50 rounded-md p-3 text-blue-800 text-sm">
                  با تکمیل سفارش، به مشتری اطلاع داده می‌شود که سفارش آنها تکمیل شده است.
                </div>
              )}
              
              {selectedStatus === 'cancelled' && (
                <div className="mb-4 bg-red-50 rounded-md p-3 text-red-800 text-sm">
                  با لغو سفارش، سفارش برای مشتری غیرفعال می‌شود و دیگر قابل پردازش نخواهد بود.
                </div>
              )}
              
              <div className="flex justify-center gap-3 mt-5">
                <button
                  onClick={cancelStatusUpdate}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  انصراف
                </button>
                <button
                  onClick={confirmStatusUpdate}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center min-w-[80px]"
                >
                  {isUpdating ? (
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'تایید'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    
      {/* هدر صفحه */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/seller/orders"
          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          <FiArrowLeft className="ml-1 h-5 w-5" />
          بازگشت به سفارش‌ها
        </Link>
        
        <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusColor(order.status as OrderStatus)}`}>
          {getStatusText(order.status as OrderStatus)}
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
                {getPaymentStatusText(order.paymentStatus as PaymentStatus)}
              </dd>
            </div>
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
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {order.customer?.fullName || 'نامشخص'}
              </dd>
            </div>
            <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <FiMail className="ml-1" />
                ایمیل
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {order.customer?.email || 'نامشخص'}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <FiPhone className="ml-1" />
                شماره تماس
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {order.customer?.mobile || 'نامشخص'}
              </dd>
            </div>
            <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <FiFileText className="ml-1" />
                آدرس منتخب
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {order.formattedAddress || order.shippingAddress || 'آدرس ثبت نشده است'}
              </dd>
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
          {order.items && order.items.length > 0 ? (
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
          ) : (
            <div className="p-4 text-center text-gray-500">
              هیچ محصولی برای این سفارش یافت نشد
            </div>
          )}
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
          <div className="mb-4">
            <h4 className="text-md font-medium text-gray-900 mb-1">وضعیت فعلی سفارش</h4>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status as OrderStatus)}`}>
              {getStatusText(order.status as OrderStatus)}
            </div>
          </div>
          
          <h4 className="text-md font-medium text-gray-900 mb-2">تغییر وضعیت سفارش</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => initiateStatusUpdate(OrderStatus.pending)}
              disabled={order.status === OrderStatus.pending || isUpdating}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                order.status === OrderStatus.pending 
                  ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300 cursor-not-allowed' 
                  : 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-2 focus:ring-yellow-300 focus:outline-none'
              }`}
              aria-label="تغییر وضعیت به در انتظار تأیید"
              tabIndex={order.status === OrderStatus.pending ? -1 : 0}
            >
              در انتظار تأیید
            </button>
            
            <button
              onClick={() => initiateStatusUpdate(OrderStatus.processing)}
              disabled={order.status === OrderStatus.processing || isUpdating}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                order.status === OrderStatus.processing 
                  ? 'bg-blue-100 text-blue-800 border-2 border-blue-300 cursor-not-allowed' 
                  : 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-300 focus:outline-none'
              }`}
              aria-label="تغییر وضعیت به در حال پردازش"
              tabIndex={order.status === OrderStatus.processing ? -1 : 0}
            >
              در حال پردازش
            </button>
            
            <button
              onClick={() => initiateStatusUpdate(OrderStatus.completed)}
              disabled={order.status === OrderStatus.completed || isUpdating}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                order.status === OrderStatus.completed 
                  ? 'bg-green-100 text-green-800 border-2 border-green-300 cursor-not-allowed' 
                  : 'bg-green-500 text-white hover:bg-green-600 focus:ring-2 focus:ring-green-300 focus:outline-none'
              }`}
              aria-label="تغییر وضعیت به تکمیل شده"
              tabIndex={order.status === OrderStatus.completed ? -1 : 0}
            >
              تکمیل شده
            </button>
            
            <button
              onClick={() => initiateStatusUpdate(OrderStatus.cancelled)}
              disabled={order.status === OrderStatus.cancelled || isUpdating}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                order.status === OrderStatus.cancelled 
                  ? 'bg-red-100 text-red-800 border-2 border-red-300 cursor-not-allowed' 
                  : 'bg-red-500 text-white hover:bg-red-600 focus:ring-2 focus:ring-red-300 focus:outline-none'
              }`}
              aria-label="تغییر وضعیت به لغو سفارش"
              tabIndex={order.status === OrderStatus.cancelled ? -1 : 0}
            >
              لغو سفارش
            </button>
          </div>
        </div>
      </div>
      
      {/* Customer Notes - Display if available */}
      {order?.customerNotes && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              یادداشت‌های مشتری
            </h3>
          </div>
          <div className="border-t border-gray-200">
            <div className="bg-gray-50 px-4 py-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {order.customerNotes}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Seller Notes Form */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            یادداشت‌های فروشنده
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            یادداشت‌های داخلی شما برای این سفارش
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <textarea
            rows={3}
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md"
            placeholder="یادداشتی برای سفارش بنویسید..."
            value={sellerNotes}
            onChange={(e) => setSellerNotes(e.target.value)}
          />
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={updateSellerNotes}
              disabled={isUpdatingNotes}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isUpdatingNotes ? 'در حال ذخیره...' : 'ذخیره یادداشت'}
            </button>
          </div>
          {notesSuccess && (
            <div className="mt-3 text-sm text-green-600">
              یادداشت‌های شما با موفقیت ذخیره شد.
            </div>
          )}
        </div>
      </div>
      
      {/* اطلاعات محصول دیجیتال */}
      {order && order.items && order.items.some(item => item.product.requiresAddress === false) && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              اطلاعات محصول دیجیتال
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              کلید لایسنس یا لینک دانلود برای مشتری
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <textarea
              rows={3}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md"
              placeholder="لینک دانلود یا کلید لایسنس محصول دیجیتال را اینجا وارد کنید..."
              value={digitalProductInfo}
              onChange={(e) => setDigitalProductInfo(e.target.value)}
            />
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={updateDigitalProductInfo}
                disabled={isUpdatingDigitalInfo}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isUpdatingDigitalInfo ? 'در حال ذخیره...' : 'ذخیره اطلاعات'}
              </button>
            </div>
            {digitalInfoSuccess && (
              <div className="mt-3 text-sm text-green-600">
                اطلاعات محصول دیجیتال با موفقیت ذخیره شد.
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* اطلاعات رسید */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            اطلاعات رسید
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <FiFileText className="ml-1" />
                رسید سفارش
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {order.receiptInfo?.key ? (
                  <div className="relative overflow-hidden rounded border border-gray-200">
                    <a 
                      href={order.receiptInfo.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Image
                        src={order.receiptInfo.url}
                        alt="رسید پرداخت"
                        width={300}
                        height={180}
                        className="w-full h-auto object-contain hover:opacity-90 transition-opacity max-w-md max-h-80 mx-auto"
                      />
                    </a>
                    <div className="mt-2 text-xs text-center text-blue-600">
                      برای مشاهده تصویر در اندازه اصلی کلیک کنید
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-500">
                    {order.paymentMethod === 'bank_transfer' ? 'رسید سفارش بارگذاری نشده است' : 'این سفارش نیازی به رسید پرداخت ندارد'}
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
} 