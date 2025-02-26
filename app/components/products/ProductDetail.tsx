import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiMinus, FiPlus, FiChevronLeft, FiShare2, FiHeart, FiBookmark, FiMessageCircle } from 'react-icons/fi';
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
    <div className="flex flex-col min-h-screen bg-white max-w-md mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link 
            href="/" 
            className="text-gray-800"
            aria-label="Back to home"
            tabIndex={0}
          >
            <FiChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">Your Business Name</h1>
          <button 
            className="text-gray-800"
            aria-label="Share product"
            tabIndex={0}
          >
            <FiShare2 className="h-5 w-5" />
          </button>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto pb-24">
        {/* Product Post Header - Instagram Style */}
        <div className="px-4 py-2 flex items-center">
          <div className="relative h-8 w-8 rounded-full overflow-hidden mr-3">
            <Image
              src="/store-logo.png"
              alt="Business Profile"
              fill
              className="object-cover"
            />
          </div>
          <span className="font-semibold text-gray-900">Your Business Name</span>
        </div>
      
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
        
        {/* Instagram-like Action Buttons */}
        <div className="px-4 py-2">
          <div className="flex justify-between mb-2">
            <div className="flex space-x-4">
              <button 
                className="text-gray-800"
                aria-label="Like"
                tabIndex={0}
              >
                <FiHeart className="h-6 w-6" />
              </button>
              <button 
                className="text-gray-800"
                aria-label="Comment"
                tabIndex={0}
              >
                <FiMessageCircle className="h-6 w-6" />
              </button>
              <button 
                className="text-gray-800"
                aria-label="Share"
                tabIndex={0}
              >
                <FiShare2 className="h-6 w-6" />
              </button>
            </div>
            <button 
              className="text-gray-800"
              aria-label="Save"
              tabIndex={0}
            >
              <FiBookmark className="h-6 w-6" />
            </button>
          </div>
          
          <p className="font-bold mb-1 text-gray-900">245 likes</p>
        </div>
        
        {/* Product Info */}
        <div className="p-4">
          <h2 className="text-base mb-2">
            <span className="font-semibold text-gray-900">{product.title}</span>
            {' - '}
            <span className="text-blue-600 font-bold">{formatPrice(product.price)}</span>
          </h2>
          
          <p className="text-gray-700 mb-4">{product.description}</p>
          
          {/* Quantity Selector */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-2 text-gray-800">Select Quantity</h3>
            <div className="flex items-center">
              <button 
                onClick={decrementQuantity}
                className="h-10 w-10 rounded-full border border-gray-300 flex items-center justify-center"
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
                tabIndex={0}
              >
                <FiMinus className={quantity <= 1 ? 'text-gray-300' : 'text-gray-800'} />
              </button>
              
              <span className="mx-4 w-8 text-center font-semibold text-gray-900">
                {quantity}
              </span>
              
              <button 
                onClick={incrementQuantity}
                className="h-10 w-10 rounded-full border border-gray-300 flex items-center justify-center"
                aria-label="Increase quantity"
                tabIndex={0}
              >
                <FiPlus className="text-gray-800" />
              </button>
            </div>
          </div>
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