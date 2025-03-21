'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { TbArrowRight, TbCalendar, TbClipboard, TbCreditCard, TbReceipt, TbUser } from 'react-icons/tb';

interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  totalPrice: number;
  product: {
    id: string;
    title: string;
    images: {
      imageUrl: string;
    }[];
  };
}

interface OrderDetails {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  shippingAddress: string;
  receiptInfo?: {
    key: string;
    url: string;
    bucket: string;
  };
  items: OrderItem[];
  seller: {
    id: string;
    shopName: string;
    username: string;
  };
  customer: {
    id: string;
    fullName: string;
    email: string;
    mobile: string;
  };
}

export default function AdminOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const orderId = (await params).id;
        const response = await fetch(`/api/admin/orders/${orderId}`);
        
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

    fetchOrderDetails();
  }, [params]);

  // تبدیل وضعیت سفارش به فارسی
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'تکمیل شده';
      case 'processing':
        return 'در حال پردازش';
      case 'pending':
        return 'در انتظار تأیید';
      case 'cancelled':
        return 'لغو شده';
      default:
        return status;
    }
  };

  // تبدیل وضعیت پرداخت به فارسی
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

  // تبدیل وضعیت سفارش به رنگ
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // فرمت کردن مبلغ به صورت تومان
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  // تبدیل تاریخ به فرمت فارسی
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
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
            href="/admin/orders"
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
            href="/admin/orders"
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
      <div className="flex items-center mb-6">
        <Link
          href="/admin/orders"
          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          <TbArrowRight className="ml-1 h-5 w-5" />
          بازگشت به سفارش‌ها
        </Link>
      </div>

      {/* اطلاعات اصلی سفارش */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              سفارش {order.orderNumber}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 flex items-center">
              <TbCalendar className="inline-block ml-1" />
              تاریخ سفارش: {formatDate(order.createdAt)}
            </p>
          </div>
          <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusColor(order.status)}`}>
            {getStatusText(order.status)}
          </span>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <TbClipboard className="ml-1" />
                شماره سفارش
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{order.orderNumber}</dd>
            </div>
            <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <TbUser className="ml-1" />
                مشتری
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div className="font-medium">{order.customer.fullName || 'نامشخص'}</div>
                {order.customer.mobile && <div className="text-gray-500 mt-1">{order.customer.mobile}</div>}
                {order.customer.email && <div className="text-gray-500 mt-1">{order.customer.email}</div>}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <TbCreditCard className="ml-1" />
                روش پرداخت
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {order.paymentMethod === 'credit_card' ? 'پرداخت آنلاین' : 
                 order.paymentMethod === 'cash_on_delivery' ? 'پرداخت در محل' : 
                 order.paymentMethod === 'bank_transfer' ? 'انتقال بانکی' :
                 order.paymentMethod}
              </dd>
            </div>
            <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">وضعیت پرداخت</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {getPaymentStatusText(order.paymentStatus)}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">فروشگاه</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <Link href={`/admin/sellers/${order.seller.id}`} className="text-blue-600 hover:text-blue-800">
                  {order.seller.shopName}
                </Link>
                <div className="text-gray-500 text-sm mt-1">{order.seller.username}</div>
              </dd>
            </div>
            {order.shippingAddress && (
              <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">آدرس تحویل</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{order.shippingAddress}</dd>
              </div>
            )}
            
            {/* Receipt image section */}
            {order.receiptInfo && order.paymentMethod === 'bank_transfer' && (
              <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <TbReceipt className="ml-1" />
                  رسید پرداخت
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
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
                </dd>
              </div>
            )}
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

      {/* خلاصه سفارش */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            خلاصه سفارش
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">جمع مبلغ محصولات</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {formatPrice(
                  order.items.reduce((sum, item) => sum + item.totalPrice, 0)
                )}
              </dd>
            </div>
            <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-900 font-bold">مبلغ کل</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-bold">
                {formatPrice(order.total)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
} 