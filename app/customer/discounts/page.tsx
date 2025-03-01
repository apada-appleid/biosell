'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TbCopy, TbCheck, TbInfoCircle } from 'react-icons/tb';

type Discount = {
  id: string;
  code: string;
  amount: number;
  type: 'percentage' | 'fixed';
  minOrder?: number;
  maxUse: number;
  usedCount: number;
  expiryDate: string;
  isActive: boolean;
  description?: string;
};

export default function CustomerDiscounts() {
  const [isLoading, setIsLoading] = useState(true);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    // در حالت واقعی، باید درخواست API را برای دریافت کدهای تخفیف انجام داد
    // اما در اینجا، از داده‌های شبیه‌سازی شده استفاده می‌کنیم
    setTimeout(() => {
      const mockDiscounts: Discount[] = [];
      setDiscounts(mockDiscounts);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
      })
      .catch(err => {
        console.error('خطا در کپی کد تخفیف:', err);
      });
  };

  // فرمت کردن مبلغ تخفیف
  const formatDiscount = (discount: Discount) => {
    if (discount.type === 'percentage') {
      return `${discount.amount}٪`;
    } else {
      return new Intl.NumberFormat('fa-IR').format(discount.amount) + ' تومان';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">کدهای تخفیف من</h1>
        <div className="mt-4 md:mt-0">
          <Link
            href="/customer/dashboard"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            بازگشت به داشبورد
          </Link>
        </div>
      </div>

      {/* راهنمای استفاده از کد تخفیف */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6 flex items-start">
        <TbInfoCircle className="text-blue-500 h-5 w-5 ml-2 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-blue-800 font-medium mb-1">نحوه استفاده از کدهای تخفیف</h3>
          <p className="text-blue-700 text-sm">
            کد تخفیف را کپی کنید و در قسمت «کد تخفیف» در صفحه پرداخت وارد کنید. برخی کدها دارای محدودیت حداقل مبلغ سفارش هستند.
          </p>
        </div>
      </div>

      {/* نمایش کارت‌های تخفیف */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {discounts.length > 0 ? (
          discounts.map((discount) => (
            <div 
              key={discount.id} 
              className={`bg-white rounded-lg shadow overflow-hidden border-2 ${discount.isActive ? 'border-blue-200' : 'border-gray-200 opacity-75'}`}
            >
              <div className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">{formatDiscount(discount)}</h3>
                  {!discount.isActive && (
                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                      منقضی شده
                    </span>
                  )}
                  {discount.isActive && discount.usedCount > 0 && (
                    <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                      استفاده شده ({discount.usedCount}/{discount.maxUse})
                    </span>
                  )}
                  {discount.isActive && discount.usedCount === 0 && (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                      قابل استفاده
                    </span>
                  )}
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">{discount.description}</p>
                  {discount.minOrder && (
                    <p className="text-xs text-gray-500">
                      حداقل مبلغ سفارش: {new Intl.NumberFormat('fa-IR').format(discount.minOrder)} تومان
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    تاریخ انقضا: {discount.expiryDate}
                  </p>
                  <p className="text-xs text-gray-500">
                    تعداد استفاده: {discount.usedCount} از {discount.maxUse}
                  </p>
                </div>
                
                <div className="mt-5 relative">
                  <div className="flex items-center p-2 bg-gray-50 rounded border border-gray-200">
                    <code className="flex-1 text-md font-mono text-blue-700 select-all">
                      {discount.code}
                    </code>
                    <button
                      onClick={() => handleCopyCode(discount.code)}
                      disabled={!discount.isActive || discount.usedCount >= discount.maxUse}
                      className={`p-1.5 rounded-md ${
                        !discount.isActive || discount.usedCount >= discount.maxUse
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-blue-600 hover:bg-blue-100'
                      }`}
                      aria-label="کپی کد تخفیف"
                    >
                      {copiedCode === discount.code ? <TbCheck className="h-5 w-5" /> : <TbCopy className="h-5 w-5" />}
                    </button>
                  </div>
                  {copiedCode === discount.code && (
                    <div className="absolute -bottom-6 right-0 text-xs text-green-600">
                      کپی شد!
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white p-8 rounded-lg shadow text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">هیچ کد تخفیفی یافت نشد</h3>
            <p className="text-gray-600">در حال حاضر هیچ کد تخفیف فعالی برای شما وجود ندارد.</p>
          </div>
        )}
      </div>
    </div>
  );
} 