'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  TbUser, TbPackage, TbTicket, TbHeart, TbLogout, 
  TbShoppingCart, TbCheck, TbClock, TbDiscount
} from 'react-icons/tb';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

type Order = {
  id: string;
  orderNumber: string;
  totalPrice: number;
  status: string;
  date: string;
  items: number;
};

export default function CustomerDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [customer, setCustomer] = useState({
    name: '',
    mobile: '',
    completedOrders: 0,
    pendingOrders: 0,
  });
  const [authError, setAuthError] = useState<string | null>(null);

  // افزودن useEffect جدید برای کنترل وضعیت احراز هویت
  useEffect(() => {
    if (status === 'loading') {
      // در حال بارگذاری، منتظر می‌مانیم
      return;
    }
    
    if (status === 'unauthenticated') {
      // بررسی توکن در localStorage
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        setAuthError('لطفاً برای دسترسی به داشبورد خود وارد شوید');
        
        console.log('User not authenticated in dashboard page, will redirect to login');
        
        // تاخیر کوتاه برای نمایش پیام به کاربر
        const redirectTimer = setTimeout(() => {
          router.push(`/auth/customer-login?redirectUrl=${encodeURIComponent('/customer/dashboard')}`);
        }, 2000);
        
        return () => clearTimeout(redirectTimer);
      }
    } else if (status === 'authenticated') {
      setAuthError(null);
    }
  }, [status, router]);

  // دریافت اطلاعات کاربر و سفارش‌ها
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        // اگر در حال بارگذاری هستیم، منتظر می‌مانیم
        if (status === 'loading') {
          return;
        }
        
        // بررسی وضعیت احراز هویت کاربر یا وجود توکن
        const token = localStorage.getItem('auth_token');
        if (status === 'unauthenticated' && !token) {
          console.error('User not authenticated');
          setIsLoading(false);
          return;
        }

        // دریافت اطلاعات کاربر
        let userData = session?.user || null;
        
        // اگر session فعال نیست، از localStorage استفاده می‌کنیم
        if (!userData && token) {
          const userInfo = localStorage.getItem('user_info');
          if (userInfo) {
            userData = JSON.parse(userInfo);
          }
        }
        
        if (userData) {
          // تنظیم اطلاعات کاربر
          setCustomer({
            name: userData.name || 'کاربر',
            mobile: userData.mobile || '',
            completedOrders: 0, // در یک برنامه واقعی باید از API دریافت شود
            pendingOrders: 0,    // در یک برنامه واقعی باید از API دریافت شود
          });
          
          // در برنامه واقعی، باید درخواست API برای دریافت سفارش‌ها انجام شود
          try {
            const headers: HeadersInit = {
              'Content-Type': 'application/json'
            };
            
            // اضافه کردن توکن به هدرها اگر موجود باشد
            if (token) {
              headers['Authorization'] = `Bearer ${token}`;
            }
            
            // در برنامه واقعی باید به API واقعی درخواست زده شود
            // در اینجا فقط داده‌های ساختگی نمایش می‌دهیم
            
            // در حالت واقعی:
            // const ordersResponse = await fetch('/api/user/orders', {
            //   credentials: 'include',
            //   headers
            // });
            
            // if (ordersResponse.ok) {
            //   const data = await ordersResponse.json();
            //   setRecentOrders(data.orders || []);
            // }
            
            // فعلاً نمایش آرایه خالی
            setRecentOrders([]);
          } catch (error) {
            console.error('Error fetching orders:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [session, status]);

  // تابع خروج کاربر
  const handleLogout = async () => {
    try {
      // حذف توکن‌های محلی
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
      
      // خروج از NextAuth session
      await signOut({ redirect: false });
      
      console.log('Logout success');
      
      // ریدایرکت به صفحه اصلی
      router.push('/');
    } catch (error) {
      console.error('Error during logout:', error);
      // در صورت خطا، به هر حال ریدایرکت کنیم
      router.push('/');
    }
  };

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
  
  // نمایش پیام خطای احراز هویت
  if (authError) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh]">
        <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-4">
          {authError}
        </div>
        <div className="animate-pulse">در حال انتقال به صفحه ورود...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">داشبورد کاربر</h1>
        <button
          onClick={handleLogout}
          className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
        >
          <TbLogout className="ml-2 -mr-1 h-4 w-4" />
          خروج
        </button>
      </div>

      {/* اطلاعات کاربر */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center">
            <div className="w-20 h-20 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full">
              <TbUser className="w-10 h-10" />
            </div>
            <div className="mt-4 sm:mt-0 sm:mr-6 text-center sm:text-right">
              <h2 className="text-xl font-bold text-gray-900">{customer.name}</h2>
              <p className="text-gray-600">{customer.mobile}</p>
            </div>
            <div className="mt-4 sm:mt-0 sm:mr-auto">
              <Link
                href="/customer/profile"
                className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-sm leading-5 font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
              >
                <TbUser className="ml-1 h-4 w-4" />
                ویرایش پروفایل
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* آمار و ارقام */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {/* کل سفارش‌ها */}
        <Link href="/customer/orders" className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
              <TbPackage className="h-6 w-6" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">کل سفارش‌ها</p>
              <p className="text-2xl font-bold text-gray-900">{customer.completedOrders + customer.pendingOrders}</p>
            </div>
          </div>
        </Link>

        {/* سفارش‌های تکمیل شده */}
        <Link href="/customer/orders" className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <TbCheck className="h-6 w-6" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">سفارش‌های تکمیل شده</p>
              <p className="text-2xl font-bold text-gray-900">{customer.completedOrders}</p>
            </div>
          </div>
        </Link>

        {/* کدهای تخفیف */}
        <Link href="/customer/discounts" className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <TbDiscount className="h-6 w-6" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">کدهای تخفیف</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
          </div>
        </Link>

        {/* موارد دلخواه */}
        <Link href="/customer/favorites" className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <TbHeart className="h-6 w-6" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">موارد دلخواه</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
          </div>
        </Link>
      </div>

      {/* دسترسی سریع */}
      <div className="mb-8 bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">دسترسی سریع</h2>
        </div>
        <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <Link
            href="/customer/profile"
            className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50"
          >
            <div className="p-2 rounded-full bg-blue-100 text-blue-600 mb-3">
              <TbUser className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium text-gray-700">پروفایل</span>
          </Link>
          
          <Link
            href="/customer/orders"
            className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50"
          >
            <div className="p-2 rounded-full bg-indigo-100 text-indigo-600 mb-3">
              <TbPackage className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium text-gray-700">سفارش‌ها</span>
          </Link>

          <Link
            href="/customer/orders"
            className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50"
          >
            <div className="p-2 rounded-full bg-yellow-100 text-yellow-600 mb-3">
              <TbClock className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium text-gray-700">در انتظار پرداخت</span>
          </Link>

          <Link
            href="/customer/discounts"
            className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50"
          >
            <div className="p-2 rounded-full bg-green-100 text-green-600 mb-3">
              <TbDiscount className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium text-gray-700">کدهای تخفیف</span>
          </Link>

          <Link
            href="/customer/favorites"
            className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50"
          >
            <div className="p-2 rounded-full bg-red-100 text-red-600 mb-3">
              <TbHeart className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium text-gray-700">علاقه‌مندی‌ها</span>
          </Link>

          <Link
            href="/"
            className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50"
          >
            <div className="p-2 rounded-full bg-purple-100 text-purple-600 mb-3">
              <TbShoppingCart className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium text-gray-700">فروشگاه</span>
          </Link>

          <Link
            href="/customer/support"
            className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50"
          >
            <div className="p-2 rounded-full bg-teal-100 text-teal-600 mb-3">
              <TbTicket className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium text-gray-700">پشتیبانی</span>
          </Link>
        </div>
      </div>

      {/* آخرین سفارش‌ها */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">آخرین سفارش‌ها</h2>
          <Link
            href="/customer/orders"
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            مشاهده همه
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  شماره سفارش
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تاریخ
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  مبلغ
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  وضعیت
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  جزئیات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.orderNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatPrice(order.totalPrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Link 
                      href={`/customer/orders/${order.id}`} 
                      className="text-blue-600 hover:text-blue-900"
                    >
                      مشاهده
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 