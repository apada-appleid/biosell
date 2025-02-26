'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useProductsStore } from '@/app/store/products';
import ProductDetail from '@/app/components/products/ProductDetail';
import { Product } from '@/app/types';
import { FiChevronLeft } from 'react-icons/fi';
import Link from 'next/link';

export default function ProductPage() {
  const params = useParams();
  const productId = params.id as string;
  const { products, fetchProducts, getProduct } = useProductsStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadProduct = async () => {
      setIsLoading(true);
      
      // If products are not loaded yet, fetch them
      if (products.length === 0) {
        await fetchProducts();
      }
      
      const foundProduct = getProduct(productId);
      
      if (foundProduct) {
        setProduct(foundProduct);
      }
      
      setIsLoading(false);
    };
    
    loadProduct();
  }, [productId, products.length, fetchProducts, getProduct]);
  
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <Link 
              href="/" 
              className="text-black"
              aria-label="Back to home"
              tabIndex={0}
            >
              <FiChevronLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-lg font-semibold">Product Detail</h1>
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
      <div className="flex flex-col min-h-screen bg-white">
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <Link 
              href="/" 
              className="text-black"
              aria-label="Back to home"
              tabIndex={0}
            >
              <FiChevronLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-lg font-semibold">Product Detail</h1>
            <div className="w-6"></div>
          </div>
        </header>
        
        <div className="p-4 text-center">
          <h2 className="text-xl font-semibold mb-4">Product Not Found</h2>
          <p className="text-gray-600 mb-6">We couldn't find the product you're looking for.</p>
          <Link 
            href="/"
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
  
  return <ProductDetail product={product} />;
} 