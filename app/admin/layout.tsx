'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { TbHome, TbShoppingBag, TbUsers, TbGraph, TbSettings, TbLogout, TbMenu2, TbX } from 'react-icons/tb';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'داشبورد', href: '/admin/dashboard', icon: TbHome },
    { name: 'فروشندگان', href: '/admin/sellers', icon: TbUsers },
    { name: 'محصولات', href: '/admin/products', icon: TbShoppingBag },
    { name: 'گزارش‌ها', href: '/admin/reports', icon: TbGraph },
    { name: 'تنظیمات', href: '/admin/settings', icon: TbSettings },
  ];

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/auth/login' });
  };

  return (
    <div className="h-full">
      {/* Mobile sidebar */}
      <div 
        className={`fixed inset-0 bg-gray-800 bg-opacity-75 z-40 lg:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 right-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:hidden ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">پنل مدیریت</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100"
          >
            <TbX className="w-6 h-6" />
          </button>
        </div>
        <nav className="mt-5 px-2 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                pathname === item.href
                  ? 'bg-gray-100 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className="ml-3 flex-shrink-0 h-6 w-6" />
              {item.name}
            </Link>
          ))}
          <button
            onClick={handleSignOut}
            className="w-full group flex items-center px-2 py-2 text-base font-medium rounded-md text-red-600 hover:bg-red-50"
          >
            <TbLogout className="ml-3 flex-shrink-0 h-6 w-6" />
            خروج
          </button>
        </nav>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:right-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white pt-5 border-l">
          <div className="flex items-center flex-shrink-0 px-4 border-b pb-5">
            <h2 className="text-xl font-bold text-gray-800">پنل مدیریت</h2>
          </div>
          <div className="mt-5 flex flex-1 flex-col">
            <nav className="flex-1 px-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    pathname === item.href
                      ? 'bg-gray-100 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="ml-3 flex-shrink-0 h-5 w-5" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="p-4 border-t">
            <button
              onClick={handleSignOut}
              className="w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50"
            >
              <TbLogout className="ml-3 flex-shrink-0 h-5 w-5" />
              خروج
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pr-64">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between sm:px-6 lg:px-8">
          <button
            type="button"
            className="p-2 -mr-3 rounded-md text-gray-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <TbMenu2 className="h-6 w-6" />
          </button>
          <div className="flex-1 flex justify-end">
            <div className="flex items-center">
              <span className="text-sm text-gray-700 ml-2">
                {session?.user?.name || 'مدیر سیستم'}
              </span>
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600">
                {session?.user?.name?.charAt(0) || 'م'}
              </div>
            </div>
          </div>
        </div>

        <main className="py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
} 