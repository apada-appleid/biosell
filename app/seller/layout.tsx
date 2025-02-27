'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { 
  TbLayoutDashboard, 
  TbShoppingBag, 
  TbLogout, 
  TbMenu2,
  TbX
} from 'react-icons/tb';

const navigation = [
  { name: 'داشبورد', href: '/seller/dashboard', icon: TbLayoutDashboard },
  { name: 'محصولات', href: '/seller/products', icon: TbShoppingBag },
];

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/login' });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`md:hidden fixed inset-0 z-50 bg-gray-600 bg-opacity-75 transition-opacity duration-300 ease-in-out ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setSidebarOpen(false)}></div>
      <div className={`fixed inset-y-0 right-0 z-50 w-64 bg-white transition-transform duration-300 ease-in-out transform ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0 md:static md:inset-auto md:w-64 md:flex-shrink-0`}>
        <div className="h-full flex flex-col p-4">
          <div className="flex justify-between items-center">
            <div className="text-xl font-bold text-gray-900 mb-6">
              فروشگاه شما
            </div>
            <button
              className="md:hidden text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 p-2"
              onClick={() => setSidebarOpen(false)}
            >
              <TbX className="h-6 w-6" />
            </button>
          </div>

          <nav className="space-y-1 mt-5 flex-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-base font-medium rounded-md 
                  ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'} 
                  transition-colors duration-150 ease-in-out`}
                >
                  <item.icon
                    className={`ml-3 h-5 w-5 flex-shrink-0 
                    ${isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'}`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-gray-200 pt-4 mt-auto">
            <div className="flex items-center mb-4">
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                {session?.user?.name?.[0] || 'S'}
              </div>
              <div className="mr-3">
                <p className="text-sm font-medium text-gray-900">{session?.user?.name || 'فروشنده'}</p>
                <p className="text-xs text-gray-500">{session?.user?.email || ''}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-gray-900 w-full"
            >
              <TbLogout className="ml-3 h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
              خروج
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top navbar */}
        <div className="sticky top-0 z-10 bg-white md:hidden border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              className="text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-500"
              onClick={() => setSidebarOpen(true)}
            >
              <TbMenu2 className="h-6 w-6" />
            </button>
            <div className="text-gray-900 font-medium">پنل فروشنده</div>
            <div className="w-6"></div> {/* Empty div for balanced layout */}
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
} 