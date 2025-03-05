import React from 'react';
import Image from 'next/image';
import { FiMinus, FiPlus, FiTrash2 } from 'react-icons/fi';
import { CartItem as CartItemType } from '@/app/types';
import { useCartStore } from '@/app/store/cart';
import { FiShoppingBag } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

interface CartItemProps {
  item: CartItemType;
}

const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCartStore();
  
  const handleIncreaseQuantity = () => {
    updateQuantity(item.product.id, item.quantity + 1);
  };
  
  const handleDecreaseQuantity = () => {
    if (item.quantity > 1) {
      updateQuantity(item.product.id, item.quantity - 1);
    } else {
      removeFromCart(item.product.id);
    }
  };
  
  const handleRemove = () => {
    removeFromCart(item.product.id);
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
  
  return (
    <div className="flex py-4 border-b border-gray-200 bg-white">
      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md ml-4">
        <Image
          src={getProductImageUrl()}
          alt={item.product.title}
          width={96}
          height={96}
          className="h-full w-full object-cover object-center"
        />
      </div>
      
      <div className="flex flex-1 flex-col">
        <div className="flex justify-between text-base font-medium text-gray-900">
          <h3>{item.product.title}</h3>
          <p className="mr-4">{formatPrice(item.product.price * item.quantity)}</p>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center border border-gray-300 rounded-md">
            <button 
              onClick={handleDecreaseQuantity}
              className="px-2 py-1 text-gray-700 hover:bg-gray-100"
              aria-label={item.quantity === 1 ? "حذف محصول" : "کاهش تعداد"}
              tabIndex={0}
            >
              {item.quantity === 1 ? <FiTrash2 /> : <FiMinus />}
            </button>
            
            <span className="px-2 py-1 text-gray-700 min-w-8 text-center">
              {item.quantity}
            </span>
            
            <button 
              onClick={handleIncreaseQuantity}
              className="px-2 py-1 text-gray-700 hover:bg-gray-100"
              aria-label="افزایش تعداد"
              tabIndex={0}
            >
              <FiPlus />
            </button>
          </div>
          
          <button
            onClick={handleRemove}
            className="text-red-500 hover:text-red-700"
            aria-label="حذف از سبد خرید"
            tabIndex={0}
          >
            <FiTrash2 className="h-5 w-5" />
          </button>
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
          <FiShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-4 text-lg font-medium text-gray-900">سبد خرید شما خالی است</h2>
          <p className="mt-2 text-sm text-gray-600">
            هیچ محصولی در سبد خرید شما نیست.
          </p>
          <div className="mt-6">
            <button 
              onClick={handleBackToShopping}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              aria-label="شروع خرید"
              tabIndex={0}
            >
              شروع خرید
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="divide-y divide-gray-200 bg-white">
      <div className="py-4 px-4">
        {items.map((item) => (
          <CartItem key={item.product.id} item={item} />
        ))}
      </div>
      
      <div className="p-4 bg-gray-50">
        <div className="flex justify-between py-2">
          <span className="text-gray-700">جمع خرید</span>
          <span className="text-gray-900 font-medium">{formatPrice(total)}</span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-gray-700">هزینه ارسال</span>
          <span className="text-gray-900 font-medium">رایگان</span>
        </div>
        <div className="flex justify-between py-2 border-t border-gray-200 mt-2 pt-2">
          <span className="text-gray-900 font-medium">جمع کل</span>
          <span className="text-gray-900 font-bold">{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  );
};

export default CartItems; 