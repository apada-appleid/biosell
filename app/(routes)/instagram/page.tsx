'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FiSearch, FiInstagram } from 'react-icons/fi';

export default function InstagramShopLanding() {
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) return;
    
    setIsSubmitting(true);
    
    // Remove @ symbol if present
    const cleanUsername = username.startsWith('@') 
      ? username.substring(1) 
      : username;
      
    // Navigate to the Instagram shop page for this username
    router.push(`/instagram/${cleanUsername}`);
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-white max-w-md mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-center">
          <h1 className="text-xl font-semibold text-gray-900">Instagram Shop</h1>
        </div>
      </header>
      
      <main className="flex-1 p-4">
        <div className="flex flex-col items-center justify-center space-y-8 max-w-sm mx-auto mt-12">
          <div className="text-center">
            <div className="flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 h-20 w-20 rounded-xl mb-6 mx-auto">
              <FiInstagram className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Shop from Instagram</h2>
            <p className="text-gray-700 mb-8">
              Enter an Instagram username to browse and shop their products directly.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="w-full">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FiInstagram className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="w-full py-3 pl-10 pr-4 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="Enter Instagram username (e.g. @nike)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            
            <button 
              type="submit"
              className="w-full mt-4 bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2" />
              ) : (
                <FiSearch className="mr-2" />
              )}
              {isSubmitting ? 'Loading...' : 'Shop Now'}
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Shops</h3>
            <div className="grid grid-cols-3 gap-4">
              {['nike', 'adidas', 'zara'].map(shop => (
                <button
                  key={shop}
                  onClick={() => {
                    setUsername(shop);
                    router.push(`/instagram/${shop}`);
                  }}
                  className="flex flex-col items-center"
                >
                  <div className="bg-gray-100 rounded-full h-14 w-14 flex items-center justify-center mb-2">
                    <span className="font-semibold text-gray-800">@{shop}</span>
                  </div>
                  <span className="text-xs text-gray-600">{shop}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-white border-t border-gray-200 p-4 text-center">
        <p className="text-sm text-gray-600">
          &copy; {new Date().getFullYear()} Instagram Shop. All rights reserved.
        </p>
      </footer>
    </div>
  );
} 