'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  ShoppingBag, 
  DollarSign, 
  Package, 
  PlusCircle, 
  ArrowRight,
  Loader2,
  ClipboardCheck
} from 'lucide-react';
import Link from 'next/link';

// Define types for dashboard stats
interface Subscription {
  planName: string;
  maxProducts: number;
  endDate: string;
  isActive: boolean;
  status?: string; // Add status field for pending subscriptions
}

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  customer: {
    name: string;
  };
}

interface DashboardStats {
  totalOrders: number;
  totalProducts: number;
  activeProducts: number;
  totalSales: number;
  totalRevenue: number;
  subscription: Subscription | null;
  productLimitPercentage: number;
  recentOrders: Order[];
}

export default function SellerDashboardPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchDashboardStats = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/seller/dashboard');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (status === 'authenticated') {
      fetchDashboardStats();
    }
  }, [status]);
  
  if (status === 'loading' || isLoading) {
    return (
      <div className="flex h-[calc(100vh-80px)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="mr-2 text-gray-500">در حال بارگذاری...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex h-[calc(100vh-80px)] w-full items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 rtl">
      <div className="mb-8 text-right">
        <h1 className="text-2xl font-bold mb-2 text-gray-900">خوش آمدید, {session?.user?.name}</h1>
        <p className="text-gray-600">گزارش وضعیت فروشگاه شما در امروز.</p>
      </div>

      {/* Conditionally show subscription warning at top if user doesn't have an active subscription */}
      {!stats?.subscription && (
        <div className="bg-white rounded-lg shadow mb-6 p-5 border-2 border-yellow-400 bg-yellow-50">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">اشتراک شما</h2>
          </div>
          <div className="py-4">
            <p className="text-gray-700 mb-4 font-medium">شما هیچ اشتراک فعالی ندارید</p>
            <Link 
              href="/seller/plans" 
              className="px-4 py-2 bg-blue-600 text-white rounded-md inline-flex items-center hover:bg-blue-700 transition"
            >
              مشاهده پلن‌ها <ArrowRight className="mr-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
      
      {/* Stats Cards - Moved to top */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6">
        {/* Total Products Card */}
        <div className="bg-white rounded-lg shadow p-3 md:p-6">
          <div className="flex items-center">
            <div className="p-2 md:p-3 rounded-full bg-blue-100 text-blue-600">
              <Package className="h-4 w-4 md:h-6 md:w-6" />
            </div>
            <div className="mr-2 md:mr-4">
              <p className="text-xs md:text-sm text-gray-500">تعداد محصولات</p>
              <h3 className="text-lg md:text-2xl font-semibold text-gray-900">{stats?.totalProducts || 0}</h3>
            </div>
          </div>
        </div>
        
        {/* Active Products Card */}
        <div className="bg-white rounded-lg shadow p-3 md:p-6">
          <div className="flex items-center">
            <div className="p-2 md:p-3 rounded-full bg-green-100 text-green-600">
              <ShoppingBag className="h-4 w-4 md:h-6 md:w-6" />
            </div>
            <div className="mr-2 md:mr-4">
              <p className="text-xs md:text-sm text-gray-500">محصولات فعال</p>
              <h3 className="text-lg md:text-2xl font-semibold text-gray-900">{stats?.activeProducts || 0}</h3>
            </div>
          </div>
        </div>
        
        {/* Total Sales Card */}
        <div className="bg-white rounded-lg shadow p-3 md:p-6">
          <div className="flex items-center">
            <div className="p-2 md:p-3 rounded-full bg-purple-100 text-purple-600">
              <ShoppingBag className="h-4 w-4 md:h-6 md:w-6" />
            </div>
            <div className="mr-2 md:mr-4">
              <p className="text-xs md:text-sm text-gray-500">تعداد فروش</p>
              <h3 className="text-lg md:text-2xl font-semibold text-gray-900">{stats?.totalSales || 0}</h3>
            </div>
          </div>
        </div>
        
        {/* Revenue Card */}
        <div className="bg-white rounded-lg shadow p-3 md:p-6">
          <div className="flex items-center">
            <div className="p-2 md:p-3 rounded-full bg-yellow-100 text-yellow-600">
              <DollarSign className="h-4 w-4 md:h-6 md:w-6" />
            </div>
            <div className="mr-2 md:mr-4">
              <p className="text-xs md:text-sm text-gray-500">درآمد کل</p>
              <h3 className="text-lg md:text-2xl font-semibold text-gray-900">
                {stats?.totalRevenue ? `${stats.totalRevenue.toLocaleString('fa-IR')} تومان` : '۰ تومان'}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow mb-6 p-5">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">دسترسی سریع</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link 
            href="/seller/products/new" 
            className="flex items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition w-full text-gray-800"
          >
            <PlusCircle className="h-5 w-5 text-blue-600 ml-3" />
            <span>افزودن محصول جدید</span>
          </Link>
          
          <Link 
            href="/seller/products" 
            className="flex items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition w-full text-gray-800"
          >
            <Package className="h-5 w-5 text-blue-600 ml-3" />
            <span>مدیریت محصولات</span>
          </Link>
          
          <Link 
            href="/seller/orders" 
            className="flex items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition w-full text-gray-800"
          >
            <ClipboardCheck className="h-5 w-5 text-blue-600 ml-3" />
            <span>مشاهده سفارشات</span>
          </Link>
        </div>
      </div>
      
      {/* Show subscription details here only if user has an active subscription */}
      {stats?.subscription && (
        <div className="bg-white rounded-lg shadow mb-6 p-5">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">اشتراک شما</h2>
          </div>
          <div>
            <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">پلن فعلی</p>
                <p className="font-medium text-gray-900">{stats.subscription.planName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">وضعیت</p>
                {stats.subscription.isActive ? (
                  <span className="inline-block px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                    فعال
                  </span>
                ) : (
                  <span className={`inline-block px-2 py-1 rounded text-xs ${
                    stats.subscription.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                    stats.subscription.status === 'approved' ? 'bg-green-100 text-green-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {stats.subscription.status === 'pending' ? 'در انتظار تایید' : 
                     stats.subscription.status === 'approved' ? 'تایید شده' : 
                     stats.subscription.status === 'rejected' ? 'رد شده' : 'غیرفعال'}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">تاریخ انقضا</p>
                <p className="font-medium text-gray-900">
                  {new Date(stats.subscription.endDate).toLocaleDateString('fa-IR')}
                </p>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <p className="text-sm text-gray-500">محدودیت محصولات</p>
                <p className="text-sm text-gray-900">{stats.totalProducts} / {stats.subscription.maxProducts}</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${
                    stats.productLimitPercentage > 90 ? 'bg-red-600' : 'bg-blue-600'
                  }`} 
                  style={{ width: `${Math.min(stats.productLimitPercentage, 100)}%` }}
                ></div>
              </div>
            </div>
            
            {/* Show a note for pending subscriptions */}
            {!stats.subscription.isActive && stats.subscription.status === 'pending' && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  اشتراک شما در انتظار تایید پرداخت از سوی مدیر سیستم است. پس از تایید، اشتراک شما فعال خواهد شد.
                </p>
              </div>
            )}
            
            {/* Show a note for rejected subscriptions */}
            {!stats.subscription.isActive && stats.subscription.status === 'rejected' && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  پرداخت شما تایید نشده است. لطفا با پشتیبانی تماس بگیرید یا مجددا اقدام به خرید اشتراک نمایید.
                </p>
                <Link 
                  href="/seller/plans" 
                  className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded-md inline-flex items-center hover:bg-blue-700 transition"
                >
                  خرید اشتراک جدید
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 