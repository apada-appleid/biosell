'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useProductsStore } from '@/app/store/products';
import ProductDetail from '@/app/components/products/ProductDetail';
import { Product } from '@/app/types';
import { FiChevronLeft } from 'react-icons/fi';
import Link from 'next/link';

export default function ProductPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const productId = params.id as string;
  const username = searchParams.get('username');

  const { products, fetchProducts, getProduct } = useProductsStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadProduct = async () => {
      setIsLoading(true);
      
      // If products are not loaded yet, fetch them with the username if available
      if (products.length === 0) {
        await fetchProducts(username || undefined);
      }
      
      const foundProduct = getProduct(productId);
      
      if (foundProduct) {
        setProduct(foundProduct);
      }
      
      setIsLoading(false);
    };
    
    loadProduct();
  }, [productId, products.length, fetchProducts, getProduct, username]);
  
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-white max-w-md mx-auto">
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <Link 
              href={username ? `/shop/${username}` : "/"} 
              className="text-gray-800"
              aria-label="Back"
              tabIndex={0}
            >
              <FiChevronLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">Product Detail</h1>
            <div className="w-6"></div>
          </div>
        </header>
        
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="flex flex-col min-h-screen bg-white max-w-md mx-auto">
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <Link 
              href={username ? `/shop/${username}` : "/"} 
              className="text-gray-800"
              aria-label="Back"
              tabIndex={0}
            >
              <FiChevronLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">Product Detail</h1>
            <div className="w-6"></div>
          </div>
        </header>
        
        <div className="p-4 text-center">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Product Not Found</h2>
          <p className="text-gray-700 mb-6">We couldn&apos;t find the product you&apos;re looking for.</p>
          <Link 
            href={username ? `/shop/${username}` : "/"}
            className="bg-blue-500 text-white px-6 py-2 rounded-md"
            aria-label="Back to shop"
            tabIndex={0}
          >
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }
  
  return <ProductDetail product={product} fromUsername={username} />;
} 