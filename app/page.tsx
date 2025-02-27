'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiShoppingBag, FiGrid, FiTag, FiInfo } from 'react-icons/fi';
import { useProductsStore } from './store/products';
import { useCartStore } from './store/cart';

export default function Home() {
  const { products, isLoading, error, fetchProducts } = useProductsStore();
  const cartItems = useCartStore(state => state.cart.items);
  
  // State for follower counts (to fix hydration issues)
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);
  
  // Client-side data fetching
  useEffect(() => {
    fetchProducts();
    
    // Generate random follower/following counts only on client-side
    // This prevents hydration mismatch errors
    setFollowerCount(Math.floor(Math.random() * 5000) + 500);
    setFollowingCount(Math.floor(Math.random() * 500) + 50);
  }, [fetchProducts]);
  
  return (
    <div className="flex flex-col min-h-screen bg-white max-w-md mx-auto">
      {/* Header with cart icon */}
      {/* <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Your Business Name</h1>
          <Link 
            href="/cart" 
            className="relative"
            aria-label="Shopping cart"
            tabIndex={0}
          >
            <FiShoppingBag className="h-6 w-6 text-gray-800" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </header> */}
      
      <main className="flex-1">
        {/* Remove Instagram Banner completely */}
        
        {/* Business Profile Section */}
        <div className="px-4 py-3 flex items-center justify-between bg-white border-b border-gray-200">
          <div className="flex items-center">
            <div className="relative h-10 w-10 rounded-full overflow-hidden bg-blue-100">
              <Image 
                src="/store-logo.png" 
                alt="Store Logo" 
                fill 
                className="object-cover"
              />
            </div>
            <div className="ml-3">
              <h2 className="text-base font-semibold text-gray-900">فروشگاه اینترنتی</h2>
              <p className="text-xs text-gray-500">خرید مستقیم از فروشنده</p>
            </div>
          </div>
          
          <div className="flex justify-around mt-5">
            <div className="text-center">
              <div className="font-bold text-gray-900">{products.length}</div>
              <div className="text-xs text-gray-600 font-medium">Products</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-gray-900">{followerCount}</div>
              <div className="text-xs text-gray-600 font-medium">Followers</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-gray-900">{followingCount}</div>
              <div className="text-xs text-gray-600 font-medium">Following</div>
            </div>
          </div>
          
          <button 
            className="w-full bg-blue-500 text-white py-2 rounded mt-4 font-semibold"
            aria-label="Contact"
            tabIndex={0}
          >
            Contact
          </button>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          <button className="flex-1 py-3 text-center border-b-2 border-black">
            <FiGrid className="inline-block mb-1 text-gray-800" />
          </button>
          <button className="flex-1 py-3 text-center text-gray-500">
            <FiTag className="inline-block mb-1" />
          </button>
          <button className="flex-1 py-3 text-center text-gray-500">
            <FiInfo className="inline-block mb-1" />
          </button>
        </div>
        
        {/* Products Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <p className="text-red-600">Error: {error}</p>
            <button 
              onClick={() => fetchProducts()}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md"
              aria-label="Retry loading products"
              tabIndex={0}
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {products.map(product => (
              <Link 
                key={product.id}
                href={`/products/${product.id}`}
                className="aspect-square relative"
                aria-label={`View ${product.title}`}
                tabIndex={0}
              >
                <Image
                  src={product.imageUrl}
                  alt={product.title}
                  fill
                  priority={product.id === '2' || product.id === '4'}
                  className="object-cover"
                  sizes="(max-width: 768px) 33vw, 25vw"
                />
                <div className="absolute bottom-2 right-2 bg-white rounded-full p-1">
                  <FiShoppingBag className="h-4 w-4 text-gray-800" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
