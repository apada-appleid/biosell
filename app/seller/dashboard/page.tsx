'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, 
  DollarSign, 
  Calendar, 
  Package, 
  PlusCircle, 
  ArrowRight,
  Loader2,
  Users,
  BarChart2,
  ClipboardCheck,
  Link as LinkIcon,
  Copy,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

// Define types for dashboard stats
interface Subscription {
  planName: string;
  maxProducts: number;
  endDate: string;
  isActive: boolean;
}

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalSales: number;
  totalRevenue: number;
  subscription: Subscription | null;
  productLimitPercentage: number;
  recentOrders: any[];
}

export default function SellerDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  
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
  
  const handleCopyShopLink = () => {
    if (!session?.user?.username) return;
    
    const shopUrl = `shopgram.apadaa.ir/shop/${session.user.username}`;
    navigator.clipboard.writeText(shopUrl)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => console.error('Failed to copy: ', err));
  };
  
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
      
      {/* Shop link section */}
      <div className="bg-white rounded-lg shadow mb-6 p-5 border border-blue-100">
        <div className="flex flex-col md:flex-row items-start justify-between">
          <div className="w-full md:w-4/5 mb-4 md:mb-0">
            <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              <LinkIcon className="h-5 w-5 text-blue-500 ml-2" />
              لینک فروشگاه شما
            </h2>
            <p className="text-gray-700 mb-3">
              این لینک را در بیوی اینستاگرام خود قرار دهید تا مشتریان به فروشگاه شما دسترسی داشته باشند.
            </p>
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="relative flex-grow">
                <input 
                  type="text" 
                  readOnly
                  value={session?.user?.username ? `shopgram.apadaa.ir/shop/${session.user.username}` : 'در حال بارگذاری...'}
                  className="py-2 px-3 border border-gray-300 bg-gray-50 rounded-lg w-full text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left dir-ltr font-mono text-sm"
                />
              </div>
              <button 
                onClick={handleCopyShopLink}
                className="p-2 text-gray-600 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full bg-gray-100 h-10 w-10 flex items-center justify-center"
                aria-label="کپی لینک"
              >
                {copySuccess ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </button>
              {copySuccess && (
                <span className="absolute text-xs text-green-600 mt-12 right-0">لینک کپی شد!</span>
              )}
            </div>
          </div>
          <Link 
            href={`/shop/${session?.user?.username}`} 
            target="_blank"
            className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center w-full md:w-auto"
          >
            <span>مشاهده فروشگاه</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
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
                <span className={`inline-block px-2 py-1 rounded text-xs ${
                  stats.subscription.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {stats.subscription.isActive ? 'فعال' : 'غیرفعال'}
                </span>
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
          </div>
        </div>
      )}
    </div>
  );
} 