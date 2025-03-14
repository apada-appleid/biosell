import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
import { FiMinus, FiPlus, FiTrash2, FiShoppingBag } from 'react-icons/fi';
import { CartItem as CartItemType } from '@/app/types';
import { useCartStore } from '@/app/store/cart';
import { useRouter } from 'next/navigation';

interface CartItemProps {
  item: CartItemType;
}

const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCartStore();
  const itemRef = useRef<HTMLDivElement>(null);
  const quantityRef = useRef<HTMLSpanElement>(null);
  
  // Set cart item height for exit animation
  useEffect(() => {
    if (itemRef.current) {
      itemRef.current.style.setProperty('--cart-item-height', `${itemRef.current.offsetHeight}px`);
      itemRef.current.classList.add('animate-cart-item-enter');
    }
  }, []);
  
  const handleIncreaseQuantity = () => {
    if (item.product.inventory && item.quantity < item.product.inventory) {
      updateQuantity(item.product.id, item.quantity + 1);
      
      // Animate quantity change
      if (quantityRef.current) {
        quantityRef.current.classList.remove('animate-quantity-change');
        // Force browser to recognize the removal
        void quantityRef.current.offsetWidth;
        quantityRef.current.classList.add('animate-quantity-change');
      }
    }
  };
  
  const handleDecreaseQuantity = () => {
    if (item.quantity > 1) {
      updateQuantity(item.product.id, item.quantity - 1);
      
      // Animate quantity change
      if (quantityRef.current) {
        quantityRef.current.classList.remove('animate-quantity-change');
        // Force browser to recognize the removal
        void quantityRef.current.offsetWidth;
        quantityRef.current.classList.add('animate-quantity-change');
      }
    } else {
      handleRemove();
    }
  };
  
  const handleRemove = () => {
    // Add exit animation
    if (itemRef.current) {
      itemRef.current.classList.add('animate-cart-item-exit');
      
      // Set a timeout to ensure the item is removed even if animation fails
      const timeoutId = setTimeout(() => {
        removeFromCart(item.product.id);
      }, 300); // Slightly longer than animation duration
      
      // If animation completes before timeout, clear the timeout and remove the item
      itemRef.current.addEventListener('animationend', () => {
        clearTimeout(timeoutId);
        removeFromCart(item.product.id);
      }, { once: true });
    } else {
      // If no ref, remove immediately
      removeFromCart(item.product.id);
    }
  };
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      maximumFractionDigits: 0
    }).format(price);
  };
  
  const getProductImageUrl = () => {
    if (item.product.images && item.product.images.length > 0) {
      return item.product.images[0].imageUrl;
    } else if (item.product.imageUrl) {
      return item.product.imageUrl;
    } else {
      return '/images/product-placeholder.png';
    }
  };

  const isOutOfStock = item.product.inventory !== undefined && item.product.inventory <= 0;
  const hasLimitedStock = item.product.inventory !== undefined && item.product.inventory <= 5 && item.product.inventory > 0;
  
  return (
    <div 
      ref={itemRef}
      className="flex py-4 border-b border-gray-200 bg-white rounded-lg md:p-4 md:shadow-sm md:mb-4 md:border md:hover:shadow-md transition-shadow animate-cart-item-highlight"
    >
      <div className="h-24 w-24 md:h-28 md:w-28 flex-shrink-0 overflow-hidden rounded-lg ml-4 relative">
        <Image
          src={getProductImageUrl()}
          alt={item.product.title}
          width={112}
          height={112}
          className="h-full w-full object-cover object-center"
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
            <span className="text-white text-xs font-medium px-2 py-1 rounded-md">
              ناموجود
            </span>
          </div>
        )}
      </div>
      
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col md:flex-row md:justify-between text-base font-medium text-gray-900">
          <h3 className="mb-1">{item.product.title}</h3>
          <p className="md:mr-4 text-gray-700">{formatPrice(item.product.price)}</p>
        </div>
        
        {/* Seller name if available */}
        {item.product.seller && (
          <p className="text-xs text-gray-500 mb-2">
            فروشنده: {item.product.seller.shopName}
          </p>
        )}
        
        {hasLimitedStock && (
          <p className="text-xs text-red-500 mb-2">
            تنها {item.product.inventory} عدد باقی مانده
          </p>
        )}
        
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center border border-gray-300 rounded-md">
            <button 
              onClick={handleDecreaseQuantity}
              className="p-2 text-gray-700 hover:bg-gray-100 rounded-r-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={item.quantity === 1 ? "حذف محصول" : "کاهش تعداد"}
              tabIndex={0}
              disabled={isOutOfStock}
              onKeyDown={(e) => e.key === 'Enter' && handleDecreaseQuantity()}
            >
              {item.quantity === 1 ? <FiTrash2 className="h-4 w-4" /> : <FiMinus className="h-4 w-4" />}
            </button>
            
            <span 
              ref={quantityRef}
              className="px-2 py-1 text-gray-700 min-w-8 text-center font-medium"
            >
              {item.quantity}
            </span>
            
            <button 
              onClick={handleIncreaseQuantity}
              className="p-2 text-gray-700 hover:bg-gray-100 rounded-l-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="افزایش تعداد"
              tabIndex={0}
              disabled={isOutOfStock || (item.product.inventory !== undefined && item.quantity >= item.product.inventory)}
              onKeyDown={(e) => e.key === 'Enter' && handleIncreaseQuantity()}
            >
              <FiPlus className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex items-center">
            <p className="font-medium text-gray-900 ml-4 hidden md:block">
              {formatPrice(item.product.price * item.quantity)}
            </p>
            <button
              onClick={handleRemove}
              className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
              aria-label="حذف از سبد خرید"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleRemove()}
            >
              <FiTrash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface CartItemsProps {
  items: CartItemType[];
  total: number;
}

const CartItems: React.FC<CartItemsProps> = ({ items, total }) => {
  const router = useRouter();
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      maximumFractionDigits: 0
    }).format(price);
  };
  
  const handleBackToShopping = () => {
    router.push('/');
  };
  
  if (items.length === 0) {
    return (
      <div className="divide-y divide-gray-200 bg-white">
        <div className="py-12 px-4 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiShoppingBag className="h-12 w-12 text-gray-400" />
          </div>
          <h2 className="mt-4 text-xl font-medium text-gray-900">سبد خرید شما خالی است</h2>
          <p className="mt-2 text-sm text-gray-600 mb-6">
            شما می‌توانید با مراجعه به صفحه اصلی، محصولات مورد نظر خود را به سبد خرید اضافه کنید.
          </p>
          <button 
            onClick={handleBackToShopping}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            aria-label="شروع خرید"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleBackToShopping()}
          >
            شروع خرید
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="divide-y divide-gray-200 bg-white">
      <div className="py-4 px-4 md:px-6">
        <div className="md:rounded-lg md:overflow-hidden">
          {items.map((item) => (
            <CartItem key={item.product.id} item={item} />
          ))}
        </div>
      </div>
      
      <div className="p-4 md:p-6 bg-gray-50 rounded-lg mb-20 md:mb-0 md:shadow-sm">
        <div className="flex justify-between py-2">
          <span className="text-gray-700">جمع خرید</span>
          <span className="text-gray-900 font-medium">{formatPrice(total)}</span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-gray-700">هزینه ارسال</span>
          <span className="text-gray-900 font-medium">رایگان</span>
        </div>
        <div className="flex justify-between py-3 border-t border-gray-200 mt-2 pt-2">
          <span className="text-gray-900 font-medium">جمع کل</span>
          <span className="text-gray-900 font-bold text-lg">{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  );
};

export default CartItems; 