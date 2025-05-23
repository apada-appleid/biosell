'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { 
  TbLayoutDashboard, 
  TbShoppingBag, 
  TbBuildingStore,
  TbMenu2,
  TbX,
  TbLogout,
  TbReceipt,
  TbShoppingCart,
  TbSettings,
  TbMessageCircle,
  TbChevronDown,
  TbChevronUp
} from 'react-icons/tb';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  children?: NavItem[];
}

// Admin navigation items
const navigation: NavItem[] = [
  { name: 'داشبورد', href: '/admin/dashboard', icon: TbLayoutDashboard },
  { name: 'محصولات', href: '/admin/products', icon: TbShoppingBag },
  { name: 'فروشندگان', href: '/admin/sellers', icon: TbBuildingStore },
  { name: 'اشتراک‌های فروشندگان', href: '/admin/subscriptions', icon: TbReceipt },
  { name: 'سفارش‌ها', href: '/admin/orders', icon: TbShoppingCart },
  { 
    name: 'تنظیمات', 
    href: '/admin/settings', 
    icon: TbSettings,
    children: [
      { name: 'تنظیمات پیامک', href: '/admin/settings/sms', icon: TbMessageCircle },
    ] 
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // Initialize expandedItems based on current path
  useEffect(() => {
    const newExpandedItems: Record<string, boolean> = {};
    
    navigation.forEach(item => {
      if (item.children) {
        const childMatches = item.children.some(
          child => pathname === child.href || pathname?.startsWith(child.href + '/')
        );
        if (childMatches) {
          newExpandedItems[item.name] = true;
        }
      }
    });
    
    setExpandedItems(newExpandedItems);
  }, [pathname]);

  const toggleExpand = (itemName: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };

  // Check if user is authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/auth/login';
    }
  }, [status]);

  // Sign out handler
  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/auth/login' });
  };

  // Render navigation item
  const renderNavItem = (item: NavItem, mobile: boolean = false) => {
    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems[item.name];
    
    // If item has children, we want to show it as a dropdown
    if (hasChildren) {
      return (
        <div key={item.name} className="space-y-1">
          <button
            onClick={() => toggleExpand(item.name)}
            className={`group flex items-center justify-between w-full px-3 py-2.5 text-base font-medium rounded-md transition-colors duration-150 ease-in-out
            ${isActive 
              ? 'bg-blue-50 text-blue-700' 
              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <div className="flex items-center">
              <item.icon
                className={`ml-3 h-5 w-5 flex-shrink-0 
                ${isActive 
                  ? 'text-blue-700' 
                  : 'text-gray-400 group-hover:text-gray-500'}`}
                aria-hidden="true"
              />
              {item.name}
            </div>
            {isExpanded ? (
              <TbChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <TbChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>
          
          {/* Child items */}
          {isExpanded && item.children && (
            <div className="pr-4 mr-4 border-r border-gray-200">
              {item.children.map(child => (
                <Link
                  key={child.name}
                  href={child.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out
                  ${pathname === child.href || pathname?.startsWith(child.href + '/') 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}
                  onClick={mobile ? () => setSidebarOpen(false) : undefined}
                >
                  <child.icon
                    className={`ml-3 h-4 w-4 flex-shrink-0 
                    ${pathname === child.href || pathname?.startsWith(child.href + '/') 
                      ? 'text-blue-700' 
                      : 'text-gray-400 group-hover:text-gray-500'}`}
                    aria-hidden="true"
                  />
                  {child.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    // Regular item without children
    return (
      <Link
        key={item.name}
        href={item.href}
        className={`group flex items-center px-3 py-2.5 text-base font-medium rounded-md transition-colors duration-150 ease-in-out
        ${isActive 
          ? 'bg-blue-50 text-blue-700' 
          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}
        onClick={mobile ? () => setSidebarOpen(false) : undefined}
      >
        <item.icon
          className={`ml-3 h-5 w-5 flex-shrink-0 
          ${isActive 
            ? 'text-blue-700' 
            : 'text-gray-400 group-hover:text-gray-500'}`}
          aria-hidden="true"
        />
        {item.name}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Mobile sidebar backdrop */}
      <div 
        className={`fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity duration-300 ease-in-out md:hidden ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`} 
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      ></div>

      {/* Sidebar for mobile - fixed positioning */}
      <aside 
        className={`fixed inset-y-0 right-0 z-50 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out transform md:hidden ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="text-xl font-bold text-gray-900">
              پنل مدیریت
            </div>
            <button
              type="button"
              className="text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 p-2 rounded-md"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">بستن منو</span>
              <TbX className="h-6 w-6" />
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => renderNavItem(item, true))}
          </nav>

          {/* Logout Button - Mobile */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              <TbLogout className="ml-2 h-5 w-5 text-gray-400" aria-hidden="true" />
              خروج از حساب کاربری
            </button>
          </div>
        </div>
      </aside>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:z-10">
        <div className="flex-1 flex flex-col min-h-0 bg-white shadow">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4 mb-5">
              <h1 className="text-xl font-bold text-gray-900">پنل مدیریت</h1>
            </div>
            
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navigation.map((item) => renderNavItem(item))}
            </nav>
          </div>
          
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center w-full">
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                {session?.user?.name?.[0] || 'A'}
              </div>
              <div className="mr-3 overflow-hidden flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{session?.user?.name || 'مدیر سیستم'}</p>
                <p className="text-xs text-gray-500 truncate">{session?.user?.email || ''}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                title="خروج"
              >
                <TbLogout className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pr-64 flex flex-col flex-1">
        {/* Top navbar */}
        <div className="sticky top-0 z-10 bg-white md:hidden border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              type="button"
              className="text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 p-1.5 rounded-md"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">باز کردن منو</span>
              <TbMenu2 className="h-6 w-6" />
            </button>
            <div className="text-gray-900 font-medium text-lg">پنل مدیریت</div>
            <div className="h-6 w-6"></div> {/* Empty div for balanced layout */}
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 bg-gray-100">
          {children}
          <style jsx global>{`
            /* Hide bottom navigation in admin pages */
            div[class*="BottomNavigation"] {
              display: none;
            }
          `}</style>
        </main>
      </div>
    </div>
  );
} 