import React from 'react';
import Image from 'next/image';
import { FiMinus, FiPlus, FiTrash2 } from 'react-icons/fi';
import { CartItem as CartItemType } from '@/app/types';
import { useCartStore } from '@/app/store/cart';

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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };
  
  return (
    <div className="flex py-4 border-b border-gray-200">
      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md mr-4">
        <Image
          src={item.product.imageUrl}
          alt={item.product.title}
          width={96}
          height={96}
          className="h-full w-full object-cover object-center"
        />
      </div>
      
      <div className="flex flex-1 flex-col">
        <div className="flex justify-between text-base font-medium text-gray-900">
          <h3>{item.product.title}</h3>
          <p className="ml-4">{formatPrice(item.product.price * item.quantity)}</p>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center border border-gray-300 rounded-md">
            <button 
              onClick={handleDecreaseQuantity}
              className="px-2 py-1 text-gray-600"
              aria-label="Decrease quantity"
              tabIndex={0}
            >
              {item.quantity === 1 ? <FiTrash2 /> : <FiMinus />}
            </button>
            
            <span className="px-2 py-1 text-gray-600 min-w-8 text-center">
              {item.quantity}
            </span>
            
            <button 
              onClick={handleIncreaseQuantity}
              className="px-2 py-1 text-gray-600"
              aria-label="Increase quantity"
              tabIndex={0}
            >
              <FiPlus />
            </button>
          </div>
          
          <button 
            onClick={handleRemove}
            className="text-red-500 text-sm"
            aria-label="Remove item"
            tabIndex={0}
          >
            Remove
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
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };
  
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500">Add some items to your cart to continue shopping</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col">
      <div className="flex-1 overflow-y-auto py-2 px-4">
        <div className="flow-root">
          <ul className="divide-y divide-gray-200">
            {items.map((item) => (
              <li key={item.product.id} className="py-2">
                <CartItem item={item} />
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="border-t border-gray-200 py-4 px-4">
        <div className="flex justify-between text-base font-medium text-gray-900 mb-4">
          <p>Subtotal</p>
          <p>{formatPrice(total)}</p>
        </div>
        <div className="flex justify-between text-base font-medium text-gray-500 mb-6">
          <p>Shipping</p>
          <p>Calculated at checkout</p>
        </div>
        <div className="flex justify-between text-lg font-bold text-gray-900 mb-6">
          <p>Total</p>
          <p>{formatPrice(total)}</p>
        </div>
      </div>
    </div>
  );
};

export default CartItems; 