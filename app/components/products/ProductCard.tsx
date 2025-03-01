import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiHeart, FiMessageCircle, FiSend, FiBookmark, FiShoppingBag } from 'react-icons/fi';
import { Product } from '@/app/types';
import { useCartStore } from '@/app/store/cart';
import { useToastStore } from '@/app/store/toast';

interface ProductCardProps {
  product: Product;
  storeName?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, storeName = "فروشگاه شاپ‌گرام" }) => {
  const router = useRouter();
  const addToCart = useCartStore(state => state.addToCart);
  const hydrate = useCartStore(state => state.hydrate);
  const showToast = useToastStore(state => state.showToast);
  const [mounted, setMounted] = useState(false);
  
  // Ensure cart is hydrated from localStorage
  useEffect(() => {
    const hydrateCart = async () => {
      await Promise.resolve();
      hydrate();
      setMounted(true);
    };
    
    hydrateCart();
  }, [hydrate]);
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only add to cart if component is mounted
    if (mounted) {
      addToCart(product, 1);
      
      // Show toast with action buttons
      showToast(`${product.title} به سبد خرید اضافه شد`, [
        {
          label: 'تکمیل سفارش',
          onClick: () => router.push('/cart')
        },
        {
          label: 'ادامه خرید',
          onClick: () => useToastStore.getState().hideToast()
        }
      ]);
    }
  };
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      maximumFractionDigits: 0
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
              alt="تصویر فروشگاه" 
              width={24} 
              height={24}
              className="rounded-full"
            />
          </div>
        </div>
        <span className="mr-3 font-semibold text-sm">{storeName}</span>
      </div>
      
      {/* Product Image */}
      <Link 
        href={`/products/${product.id}`}
        aria-label={`مشاهده جزئیات ${product.title}`}
        tabIndex={0}
      >
        <div className="relative aspect-square">
          <Image
            src={product.imageUrl || '/images/product-placeholder.png'}
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
              aria-label="پسندیدن"
              tabIndex={0}
            >
              <FiHeart />
            </button>
            <button 
              className="text-2xl" 
              aria-label="نظر دادن"
              tabIndex={0}
            >
              <FiMessageCircle />
            </button>
            <button 
              className="text-2xl" 
              aria-label="اشتراک گذاری"
              tabIndex={0}
            >
              <FiSend />
            </button>
          </div>
          <button 
            className="text-2xl" 
            aria-label="ذخیره کردن"
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
            className="flex items-center bg-blue-500 text-white px-3 py-1 rounded-full text-sm hover:bg-blue-600 transition-colors"
            aria-label={`افزودن ${product.title} به سبد خرید`}
            tabIndex={0}
          >
            <FiShoppingBag className="ml-1" />
            افزودن به سبد
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard; 