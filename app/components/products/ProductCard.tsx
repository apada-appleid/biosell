import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiHeart, FiMessageCircle, FiSend, FiBookmark, FiShoppingBag } from 'react-icons/fi';
import { Product } from '@/app/types';
import { useCartStore } from '@/app/store/cart';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const addToCart = useCartStore(state => state.addToCart);
  
  const handleAddToCart = () => {
    addToCart(product, 1);
  };
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };
  
  return (
    <div className="border border-gray-200 rounded-sm mb-6 bg-white">
      {/* Header */}
      <div className="flex items-center p-3">
        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
          <div className="h-7 w-7 rounded-full bg-white flex items-center justify-center">
            <Image 
              src="/store-logo.png" 
              alt="Store Profile" 
              width={24} 
              height={24}
              className="rounded-full"
            />
          </div>
        </div>
        <span className="ml-3 font-semibold text-sm">Your Store Name</span>
      </div>
      
      {/* Product Image */}
      <Link 
        href={`/products/${product.id}`}
        aria-label={`View ${product.title} details`}
        tabIndex={0}
      >
        <div className="relative aspect-square">
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      </Link>
      
      {/* Action Buttons */}
      <div className="p-3">
        <div className="flex justify-between mb-2">
          <div className="flex gap-4">
            <button 
              className="text-2xl" 
              aria-label="Like"
              tabIndex={0}
            >
              <FiHeart />
            </button>
            <button 
              className="text-2xl" 
              aria-label="Comment"
              tabIndex={0}
            >
              <FiMessageCircle />
            </button>
            <button 
              className="text-2xl" 
              aria-label="Share"
              tabIndex={0}
            >
              <FiSend />
            </button>
          </div>
          <button 
            className="text-2xl" 
            aria-label="Save"
            tabIndex={0}
          >
            <FiBookmark />
          </button>
        </div>
        
        {/* Product Details */}
        <h2 className="font-semibold">{product.title}</h2>
        <p className="text-gray-600 text-sm line-clamp-2 mb-1">{product.description}</p>
        <div className="flex justify-between items-center mt-2">
          <span className="font-bold">{formatPrice(product.price)}</span>
          <button 
            onClick={handleAddToCart}
            className="flex items-center bg-blue-500 text-white px-3 py-1 rounded-full text-sm"
            aria-label={`Add ${product.title} to cart`}
            tabIndex={0}
          >
            <FiShoppingBag className="mr-1" />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard; 