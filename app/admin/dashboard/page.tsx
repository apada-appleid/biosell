'use client';

import { useEffect, useState } from 'react';
import { TbCoin, TbShoppingBag, TbUsers, TbChartBar } from 'react-icons/tb';
import Link from 'next/link';

// Dashboard Card Component
const DashboardCard = ({ title, value, icon, description, color }: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
  color: string;
}) => {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded-md p-3 ${color}`}>
            {icon}
          </div>
          <div className="mr-5">
            <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );
};

// Recent Activity Item Component
const ActivityItem = ({ title, time, status }: {
  title: string;
  time: string;
  status: 'success' | 'warning' | 'error';
}) => {
  const statusColors = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
  };

  return (
    <div className="py-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[status]}`}>
          {status === 'success' ? 'موفق' : status === 'warning' ? 'در انتظار' : 'ناموفق'}
        </span>
      </div>
      <p className="text-sm text-gray-500 mt-1">{time}</p>
    </div>
  );
};

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState({
    totalSellers: 0,
    totalProducts: 0,
    activePlans: 0,
    totalIncome: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/admin/dashboard');
        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Use mock data for now
        setDashboardData({
          totalSellers: 5,
          totalProducts: 28,
          activePlans: 7,
          totalIncome: 1350000
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fa-IR').format(value) + ' تومان';
  };

  // Mock recent activities
  const recentActivities = [
    { title: 'ثبت فروشنده جدید: گالری مد آنلاین', time: 'همین الان', status: 'success' as const },
    { title: 'دریافت اشتراک حرفه‌ای: استودیو عکاسی نیکان', time: '۳ ساعت پیش', status: 'success' as const },
    { title: 'درخواست تغییر پلن: شاپستان', time: '۵ ساعت پیش', status: 'warning' as const },
    { title: 'خطا در پرداخت اشتراک: گالری لباس اروپا', time: 'دیروز', status: 'error' as const },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="pb-5 border-b border-gray-200">
        <h1 className="text-2xl font-bold leading-tight text-gray-900">داشبورد</h1>
      </div>

      {/* Dashboard Cards */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="فروشندگان"
          value={dashboardData.totalSellers}
          icon={<TbUsers className="h-6 w-6 text-white" />}
          description="تعداد کل فروشندگان ثبت‌ شده"
          color="bg-blue-500"
        />
        <DashboardCard
          title="محصولات"
          value={dashboardData.totalProducts}
          icon={<TbShoppingBag className="h-6 w-6 text-white" />}
          description="تعداد کل محصولات ثبت شده"
          color="bg-green-500"
        />
        <DashboardCard
          title="اشتراک‌های فعال"
          value={dashboardData.activePlans}
          icon={<TbChartBar className="h-6 w-6 text-white" />}
          description="تعداد اشتراک‌های فعال"
          color="bg-purple-500"
        />
        <DashboardCard
          title="درآمد کل"
          value={formatCurrency(dashboardData.totalIncome)}
          icon={<TbCoin className="h-6 w-6 text-white" />}
          description="مجموع درآمد از اشتراک‌ها"
          color="bg-yellow-500"
        />
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg lg:col-span-1">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">دسترسی سریع</h3>
          </div>
          <div className="p-4 sm:p-6">
            <div className="space-y-4">
              <Link 
                href="/admin/sellers/new" 
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                افزودن فروشنده جدید
              </Link>
              <Link 
                href="/admin/products" 
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                مدیریت محصولات
              </Link>
              <Link 
                href="/admin/reports" 
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                گزارش‌های سیستم
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg lg:col-span-2">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">فعالیت‌های اخیر</h3>
          </div>
          <div className="px-4 sm:px-6 py-3">
            <div className="divide-y divide-gray-200">
              {recentActivities.map((activity, index) => (
                <ActivityItem
                  key={index}
                  title={activity.title}
                  time={activity.time}
                  status={activity.status}
                />
              ))}
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:px-6 rounded-b-lg">
            <Link
              href="/admin/activities"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              مشاهده همه فعالیت‌ها
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 