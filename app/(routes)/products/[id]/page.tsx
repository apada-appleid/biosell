'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useCartStore } from '@/app/store/cart';
import { useToastStore } from '@/app/store/toast';
import { Product } from '@/app/types';
import { FiChevronLeft } from 'react-icons/fi';
import Link from 'next/link';
import Image from 'next/image';

/**
 * ProductDetailsPage component displays detailed information about a product
 * 
 * NOTE: In future versions of Next.js, `params` will be a Promise that needs to be
 * unwrapped with React.use() before accessing properties.
 * 
 * Future implementation will look like:
 * ```
 * const unwrappedParams = React.use(params as any);
 * const id = unwrappedParams.id;
 * ```
 * 
 * For now, we're using direct access which is still supported for migration purposes.
 */
export default function ProductDetailsPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  
  const addToCart = useCartStore((state) => state.addToCart);
  const backLinkHref = '/';

  interface CartItem {
    product: Product;
    quantity: number;
  }

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/products/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch product');
        }
        
        const data = await response.json();
        setProduct(data.product);
      } catch (err) {
        console.error('Error loading product:', err);
        setError('Failed to load product. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadProduct();
  }, [id]);
  
  const incrementQuantity = () => {
    if (product && quantity < product.inventory) {
      setQuantity(prev => prev + 1);
    }
  };
  
  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };
  
  const handleAddToCart = () => {
    if (product) {
      try {
        // First try to update local storage directly
        const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
        const existingItemIndex = cartItems.findIndex(
          (item: CartItem) => item.product.id === product.id
        );
        
        if (existingItemIndex >= 0) {
          cartItems[existingItemIndex].quantity += quantity;
        } else {
          cartItems.push({
            product: product,
            quantity: quantity
          });
        }
        
        localStorage.setItem('cart', JSON.stringify(cartItems));
        
        // Then update the store
        addToCart(product, quantity);
        
        // Show success message
        useToastStore.getState().showToast(
          `${quantity} عدد ${product.title} به سبد خرید اضافه شد`,
          [
            {
              label: 'مشاهده سبد خرید',
              onClick: () => window.location.href = '/cart'
            },
            {
              label: 'بستن',
              onClick: () => useToastStore.getState().hideToast()
            }
          ]
        );
      } catch (error) {
        console.error('Error adding to cart:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white max-w-md mx-auto">
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <Link 
              href={backLinkHref} 
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

  if (error || !product) {
    return (
      <div className="flex flex-col min-h-screen bg-white max-w-md mx-auto">
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <Link 
              href={backLinkHref} 
              className="text-gray-800"
              aria-label="Back"
              tabIndex={0}
            >
              <FiChevronLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">Product Not Found</h1>
            <div className="w-6"></div>
          </div>
        </header>
        
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
          <p className="text-gray-700 mb-6">We couldn&apos;t find the product you&apos;re looking for.</p>
          <Link 
            href={backLinkHref}
            className="bg-blue-500 text-white px-6 py-2 rounded-md"
            aria-label="Back to shop"
          >
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-white max-w-md mx-auto">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link 
            href={backLinkHref} 
            className="text-gray-800"
            aria-label="Back"
            tabIndex={0}
          >
            <FiChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">{product.title}</h1>
          <div className="w-6"></div>
        </div>
      </header>
      
      <main className="flex-1 p-4">
        <div className="mb-6">
          {product.images && product.images.length > 0 ? (
            <Image 
              src={product.images[0].imageUrl} 
              alt={product.title}
              width={400}
              height={300}
              className="w-full h-64 object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-500">No image available</span>
            </div>
          )}
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{product.title}</h2>
          <p className="text-gray-600 mb-4">{product.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-blue-600">${product.price.toFixed(2)}</span>
            <div className="flex items-center">
              <button 
                onClick={decrementQuantity}
                className="bg-gray-200 text-gray-700 px-3 py-1 rounded-l-md"
                aria-label="Decrease quantity"
              >
                -
              </button>
              <span className="bg-gray-100 px-4 py-1">{quantity}</span>
              <button 
                onClick={incrementQuantity}
                className="bg-gray-200 text-gray-700 px-3 py-1 rounded-r-md"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>
        </div>
        
        <button 
          onClick={handleAddToCart}
          className="w-full bg-blue-500 text-white py-3 rounded-md font-medium"
          aria-label="Add to cart"
        >
          Add to Cart
        </button>
      </main>
    </div>
  );
} 