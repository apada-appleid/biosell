'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FiShoppingBag, FiGrid, FiTag, FiInfo, FiUser } from 'react-icons/fi';
import { useProductsStore } from '@/app/store/products';
import { useCartStore } from '@/app/store/cart';

export default function InstagramShopPage() {
  const params = useParams();
  const username = params.username as string;
  const { products, isLoading, error, fetchProducts } = useProductsStore();
  const cartItems = useCartStore(state => state.cart.items);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  
  // State for follower counts (to fix hydration issues)
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);
  
  // Client-side data fetching for the specific Instagram username
  useEffect(() => {
    fetchProducts(username);
    
    // Generate random follower/following counts only on client-side
    // This prevents hydration mismatch errors
    setFollowerCount(Math.floor(Math.random() * 5000) + 500);
    setFollowingCount(Math.floor(Math.random() * 500) + 50);
  }, [username, fetchProducts]);
  
  return (
    <div className="flex flex-col min-h-screen bg-white max-w-md mx-auto">
      {/* Header with cart icon */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">@{username}</h1>
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
      </header>
      
      <main className="flex-1">
        {/* Business Profile Section */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="relative h-20 w-20 rounded-full overflow-hidden mr-5 bg-gray-100 flex items-center justify-center">
              {/* In a production app, you would fetch the user's profile picture */}
              <FiUser className="h-10 w-10 text-gray-400" />
            </div>
            
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">@{username}</h2>
              <p className="text-gray-600 text-sm font-medium">Instagram Shop</p>
              <p className="text-gray-700 text-sm mt-1">
                Shop directly from {username}'s Instagram posts. Click on a product to view details and purchase.
              </p>
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
          
          <Link 
            href={`https://instagram.com/${username}`} 
            target="_blank"
            className="w-full bg-blue-500 text-white py-2 rounded mt-4 font-semibold flex items-center justify-center"
            aria-label={`View ${username}'s Instagram profile`}
            tabIndex={0}
          >
            View on Instagram
          </Link>
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
              onClick={() => fetchProducts(username)}
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
                href={`/products/${product.id}?from=${username}`}
                className="aspect-square relative"
                aria-label={`View ${product.title}`}
                tabIndex={0}
              >
                <Image
                  src={product.imageUrl}
                  alt={product.title}
                  fill
                  priority={product.id === '2' || product.id === '4'} // Add priority to both LCP images
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
        
        {/* Empty state */}
        {!isLoading && !error && products.length === 0 && (
          <div className="p-8 text-center">
            <div className="mb-4">
              <FiShoppingBag className="h-12 w-12 mx-auto text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Found</h3>
            <p className="text-gray-600">
              We couldn't find any products from this Instagram account.
            </p>
          </div>
        )}
      </main>
    </div>
  );
} 