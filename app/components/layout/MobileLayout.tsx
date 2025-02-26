import React from 'react';
import { useCartStore } from '@/app/store/cart';
import { FiHome, FiSearch, FiShoppingBag, FiUser } from 'react-icons/fi';
import Link from 'next/link';

interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  showHeader?: boolean;
  showFooter?: boolean;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ 
  children, 
  title = 'Shop',
  showHeader = true,
  showFooter = true
}) => {
  const cartItems = useCartStore(state => state.cart.items);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  
  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-white">
      {showHeader && (
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">{title}</h1>
            <Link 
              href="/cart" 
              className="relative"
              aria-label="Shopping cart"
              tabIndex={0}
            >
              <FiShoppingBag className="h-6 w-6" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </header>
      )}
      
      <main className="flex-1 overflow-y-auto pb-16">
        {children}
      </main>
      
      {showFooter && (
        <footer className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-200">
          <nav className="flex justify-around py-3">
            <Link 
              href="/" 
              className="flex flex-col items-center text-gray-500 hover:text-black"
              aria-label="Home"
              tabIndex={0}
            >
              <FiHome className="h-6 w-6" />
              <span className="text-xs mt-1">Home</span>
            </Link>
            
            <Link 
              href="/search" 
              className="flex flex-col items-center text-gray-500 hover:text-black"
              aria-label="Search"
              tabIndex={0}
            >
              <FiSearch className="h-6 w-6" />
              <span className="text-xs mt-1">Search</span>
            </Link>
            
            <Link 
              href="/cart" 
              className="flex flex-col items-center text-gray-500 hover:text-black"
              aria-label="Cart"
              tabIndex={0}
            >
              <div className="relative">
                <FiShoppingBag className="h-6 w-6" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1">Cart</span>
            </Link>
            
            <Link 
              href="/profile" 
              className="flex flex-col items-center text-gray-500 hover:text-black"
              aria-label="Profile"
              tabIndex={0}
            >
              <FiUser className="h-6 w-6" />
              <span className="text-xs mt-1">Profile</span>
            </Link>
          </nav>
        </footer>
      )}
    </div>
  );
};

export default MobileLayout; 