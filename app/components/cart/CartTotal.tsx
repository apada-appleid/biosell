'use client';

import React from 'react';
import { FiCreditCard, FiX } from 'react-icons/fi';

interface CartTotalProps {
  totalPrice: number;
  onCheckout: () => void;
  onContinueShopping: () => void;
}

const CartTotal: React.FC<CartTotalProps> = ({ 
  totalPrice, 
  onCheckout,
  onContinueShopping
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 sticky top-24">
      <h2 className="font-bold text-lg mb-4 pb-3 border-b border-gray-200">خلاصه سفارش</h2>
      
      <div className="space-y-3 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-600">جمع سبد خرید</span>
          <span className="font-medium">{formatPrice(totalPrice)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">هزینه ارسال</span>
          <span className="font-medium text-green-600">رایگان</span>
        </div>
        <div className="flex justify-between pt-3 border-t border-gray-200 font-bold">
          <span>مبلغ قابل پرداخت</span>
          <span className="text-lg">{formatPrice(totalPrice)}</span>
        </div>
      </div>
      
      <button
        onClick={onCheckout}
        className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mb-3"
        aria-label="ادامه و پرداخت"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onCheckout()}
      >
        <FiCreditCard className="ml-2" />
        ادامه و پرداخت
      </button>
      
      <button
        onClick={onContinueShopping}
        className="w-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
        aria-label="بستن سبد خرید"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onContinueShopping()}
      >
        <FiX className="ml-2" />
        بستن سبد خرید
      </button>
    </div>
  );
};

export default CartTotal; 