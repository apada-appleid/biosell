'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { TbArrowRight, TbTruck, TbCalendar, TbClipboard, TbCreditCard } from 'react-icons/tb';

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

type OrderDetails = {
  id: string;
  orderNumber: string;
  date: string;
  status: string;
  totalPrice: number;
  paymentMethod: string;
  address: string;
  trackingCode?: string;
  items: OrderItem[];
};

interface OrderDetailsClientProps {
  id: string;
}

export default function OrderDetailsClient({ id }: OrderDetailsClientProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<OrderDetails | null>(null);

  useEffect(() => {
    // Simulate API call
    setIsLoading(true);
    setTimeout(() => {
      const mockOrder: OrderDetails = {
        id: id,
        orderNumber: `SG-1001${id}`,
        date: '۱۴۰۳/۱/۱۵',
        status: id === '4' ? 'cancelled' : id === '2' ? 'processing' : id === '3' ? 'pending' : 'completed',
        totalPrice: 1250000,
        paymentMethod: 'پرداخت آنلاین',
        address: 'تهران، خیابان ولیعصر، کوچه مهدی، پلاک ۱۲، واحد ۳',
        trackingCode: id === '2' || id === '5' ? '123456789' : undefined,
        items: [
          {
            id: '1',
            name: 'پیراهن آستین کوتاه مردانه',
            price: 450000,
            quantity: 1,
            image: 'https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzN8fGJsdWUlMjBzaGlydHxlbnwwfHwwfHx8MA%3D%3D',
          },
          {
            id: '2',
            name: 'شلوار جین مردانه',
            price: 800000,
            quantity: 1,
            image: 'https://images.unsplash.com/photo-1555689502-c4b22d76c56f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8amVhbnN8ZW58MHx8MHx8fDA%3D',
          },
        ],
      };
      setOrder(mockOrder);
      setIsLoading(false);
    }, 1000);
  }, [id]);

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
            href="/customer/orders"
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
          href="/customer/orders"
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
              تاریخ سفارش: {order.date}
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
                <TbCreditCard className="ml-1" />
                روش پرداخت
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{order.paymentMethod}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">آدرس تحویل</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{order.address}</dd>
            </div>
            {order.trackingCode && (
              <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <TbTruck className="ml-1" />
                  کد رهگیری پستی
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{order.trackingCode}</dd>
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
          <ul role="list" className="divide-y divide-gray-200">
            {order.items.map((item) => (
              <li key={item.id} className="p-4 sm:p-6">
                <div className="flex items-center flex-col sm:flex-row">
                  <div className="ml-4 flex-shrink-0 w-20 h-20 bg-gray-200 overflow-hidden rounded-md relative">
                    <Image
                      src={item.image}
                      alt={item.name}
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
                    <h4 className="text-md font-medium text-gray-900">{item.name}</h4>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {formatPrice(item.price)} × {item.quantity}
                        </p>
                      </div>
                      <div className="mt-2 sm:mt-0">
                        <p className="text-sm font-medium text-gray-900">
                          {formatPrice(item.price * item.quantity)}
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
                {formatPrice(order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0))}
              </dd>
            </div>
            <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">هزینه ارسال</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {formatPrice(order.status === 'cancelled' ? 0 : 50000)}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">تخفیف</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {formatPrice(order.status === 'cancelled' ? 0 : 50000)}
              </dd>
            </div>
            <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-900 font-bold">مبلغ کل</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-bold">
                {formatPrice(order.totalPrice)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
} 