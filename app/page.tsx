'use client';

import { useEffect } from 'react';
import MobileLayout from './components/layout/MobileLayout';
import ProductCard from './components/products/ProductCard';
import { useProductsStore } from './store/products';

export default function Home() {
  return (
    <MobileLayout title="ShopGram">
      <HomeContent />
    </MobileLayout>
  );
}

function HomeContent() {
  const { products, isLoading, error, fetchProducts } = useProductsStore();
  
  // Client-side data fetching
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">Error: {error}</p>
        <button 
          onClick={() => fetchProducts()}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md"
          aria-label="Retry loading products"
          tabIndex={0}
        >
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div className="p-2">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
