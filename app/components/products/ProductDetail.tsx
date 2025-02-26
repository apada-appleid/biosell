import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiMinus, FiPlus, FiChevronLeft, FiShare2 } from 'react-icons/fi';
import { Product } from '@/app/types';
import { useCartStore } from '@/app/store/cart';

interface ProductDetailProps {
  product: Product;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product }) => {
  const [quantity, setQuantity] = useState(1);
  const addToCart = useCartStore(state => state.addToCart);
  
  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
  };
  
  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };
  
  const handleAddToCart = () => {
    addToCart(product, quantity);
  };
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
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
          <button 
            className="text-black"
            aria-label="Share product"
            tabIndex={0}
          >
            <FiShare2 className="h-5 w-5" />
          </button>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto pb-24">
        {/* Product Image Gallery */}
        <div className="relative aspect-square">
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        </div>
        
        {/* Product Info */}
        <div className="p-4">
          <h2 className="text-xl font-bold mb-2">{product.title}</h2>
          <p className="text-2xl font-bold text-blue-500 mb-4">
            {formatPrice(product.price)}
          </p>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-gray-700">{product.description}</p>
          </div>
          
          {/* Quantity Selector */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Quantity</h3>
            <div className="flex items-center">
              <button 
                onClick={decrementQuantity}
                className="h-10 w-10 rounded-full border border-gray-300 flex items-center justify-center"
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
                tabIndex={0}
              >
                <FiMinus className={quantity <= 1 ? 'text-gray-300' : 'text-black'} />
              </button>
              
              <span className="mx-4 w-8 text-center font-semibold">
                {quantity}
              </span>
              
              <button 
                onClick={incrementQuantity}
                className="h-10 w-10 rounded-full border border-gray-300 flex items-center justify-center"
                aria-label="Increase quantity"
                tabIndex={0}
              >
                <FiPlus />
              </button>
            </div>
          </div>
          
          {/* View on Instagram */}
          <Link 
            href={product.instagramPostUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block w-full text-center py-3 border border-blue-500 text-blue-500 rounded-lg mb-4 hover:bg-blue-50"
            aria-label="View on Instagram"
            tabIndex={0}
          >
            View on Instagram
          </Link>
        </div>
      </main>
      
      {/* Add to Cart Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md mx-auto">
        <button 
          onClick={handleAddToCart}
          className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold"
          aria-label="Add to cart"
          tabIndex={0}
        >
          Add to Cart - {formatPrice(product.price * quantity)}
        </button>
      </div>
    </div>
  );
};

export default ProductDetail; 