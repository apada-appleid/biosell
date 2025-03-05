'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  TbUser, TbPackage, TbDiscount, TbHeart, 
  TbTicket, TbLogout, TbMenu2, TbX, 
  TbHome, TbChevronDown, TbChevronUp
} from 'react-icons/tb';
import { useSession, signOut } from 'next-auth/react';

interface MenuItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  current: boolean;
}

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  // بررسی وضعیت احراز هویت و انتقال به صفحه ورود در صورت عدم وجود
  useEffect(() => {
    // اگر در حال بارگذاری هستیم، منتظر می‌مانیم
    if (status === 'loading') {
      return;
    }
    
    // بررسی وضعیت احراز هویت از طریق next-auth و وجود توکن محلی
    if (status === 'unauthenticated' && pathname.startsWith('/customer')) {
      // بررسی توکن محلی
      const token = localStorage.getItem('auth_token');
      
      // فقط اگر توکن محلی نبود ریدایرکت کنیم
      if (!token) {
        console.log('User not authenticated and no token found, redirecting to login page');
        
        // لاگین نشده است، ریدایرکت به صفحه لاگین
        router.push(`/auth/customer-login?redirectUrl=${encodeURIComponent(pathname)}`);
      } else {
        console.log('Token found in localStorage, allowing access despite unauthenticated session');
      }
    }
  }, [status, pathname, router]);

  // بستن منوی کناری در موبایل هنگام تغییر مسیر
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // خروج از حساب کاربری
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    signOut({ redirect: true, callbackUrl: '/auth/customer-login' });
  };

  // آیتم‌های منوی کناری
  const navigation: MenuItem[] = [
    { name: 'داشبورد', href: '/customer/dashboard', icon: <TbHome className="ml-2 h-5 w-5" />, current: pathname === '/customer/dashboard' },
    { name: 'پروفایل', href: '/customer/profile', icon: <TbUser className="ml-2 h-5 w-5" />, current: pathname === '/customer/profile' },
    { name: 'سفارش‌ها', href: '/customer/orders', icon: <TbPackage className="ml-2 h-5 w-5" />, current: pathname.startsWith('/customer/orders') },
    { name: 'کدهای تخفیف', href: '/customer/discounts', icon: <TbDiscount className="ml-2 h-5 w-5" />, current: pathname === '/customer/discounts' },
    { name: 'علاقه‌مندی‌ها', href: '/customer/favorites', icon: <TbHeart className="ml-2 h-5 w-5" />, current: pathname === '/customer/favorites' },
    { name: 'پشتیبانی', href: '/customer/support', icon: <TbTicket className="ml-2 h-5 w-5" />, current: pathname === '/customer/support' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* منوی موبایل */}
      <div className="lg:hidden">
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-40 transition-opacity duration-300 ease-linear"
          style={{ display: sidebarOpen ? 'block' : 'none' }}
          onClick={() => setSidebarOpen(false)}
        />

        <div className={`fixed inset-y-0 right-0 flex flex-col w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">پنل کاربری</h2>
            <button
              type="button"
              className="text-gray-500 hover:text-gray-600"
              onClick={() => setSidebarOpen(false)}
            >
              <TbX className="h-6 w-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="px-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    item.current
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className={`${item.current ? 'text-blue-500' : 'text-gray-500'}`}>
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="p-4 border-t border-gray-200">
            <button
              type="button"
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50"
              onClick={handleLogout}
            >
              <TbLogout className="ml-2 h-5 w-5 text-red-500" />
              خروج از حساب کاربری
            </button>
          </div>
        </div>
      </div>

      {/* هدر */}
      <header className="bg-white shadow-sm lg:fixed lg:w-full lg:top-0 lg:z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center lg:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100"
                onClick={() => setSidebarOpen(true)}
              >
                <TbMenu2 className="h-6 w-6" />
              </button>
            </div>
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-blue-600">
                بایوسل
              </Link>
            </div>
            <div className="flex items-center">
              <div className="hidden lg:ml-4 lg:flex lg:items-center">
                <Link
                  href="/"
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  فروشگاه
                </Link>
              </div>
              <div className="relative ml-3">
                <div>
                  <button
                    type="button"
                    className="flex items-center max-w-xs rounded-full text-sm focus:outline-none"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <TbUser className="h-5 w-5" />
                    </div>
                    <span className="hidden md:flex md:items-center mr-2">
                      <span className="text-sm font-medium text-gray-700 ml-1">کاربر فروشگاه</span>
                      {userMenuOpen ? (
                        <TbChevronUp className="h-4 w-4 text-gray-500" />
                      ) : (
                        <TbChevronDown className="h-4 w-4 text-gray-500" />
                      )}
                    </span>
                  </button>
                </div>
                {userMenuOpen && (
                  <div className="origin-top-left absolute left-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <Link
                      href="/customer/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      پروفایل
                    </Link>
                    <Link
                      href="/customer/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      داشبورد
                    </Link>
                    <button
                      type="button"
                      className="block w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      onClick={handleLogout}
                    >
                      خروج
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* منوی کناری دسکتاپ */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:right-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex-1 flex flex-col min-h-0 bg-white border-l border-gray-200">
          <div className="flex-1 flex flex-col pt-20 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4 py-4 border-b border-gray-200">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <TbUser className="h-6 w-6" />
              </div>
              <div className="mr-3">
                <p className="text-sm font-medium text-gray-900">کاربر فروشگاه</p>
                <p className="text-xs text-gray-500">خوش آمدید</p>
              </div>
            </div>
            <nav className="mt-5 flex-1 px-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    item.current
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className={`${item.current ? 'text-blue-500' : 'text-gray-500'}`}>
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <button
              type="button"
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50"
              onClick={handleLogout}
            >
              <TbLogout className="ml-2 h-5 w-5 text-red-500" />
              خروج از حساب کاربری
            </button>
          </div>
        </div>
      </div>

      {/* محتوای اصلی */}
      <main className="lg:pr-64 lg:pt-16">
        {children}
      </main>
    </div>
  );
} 