'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface Plan {
  id: string;
  name: string;
  price: number;
  maxProducts: number;
}

export default function PaymentClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan');
  const { data: session, status } = useSession();
  
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'transfer'>('online');
  const [isProcessing, setIsProcessing] = useState(false);
  
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.type === 'seller') {
      router.push('/seller/dashboard');
      return;
    }
    
    if (!planId) {
      router.push('/seller/plans');
      return;
    }
    
    // در یک محیط واقعی، اینجا از API برای دریافت اطلاعات پلن استفاده می‌شود
    const demoPlans: Record<string, Plan> = {
      'basic': {
        id: 'basic',
        name: 'پایه',
        price: 290000,
        maxProducts: 20
      },
      'professional': {
        id: 'professional',
        name: 'حرفه‌ای',
        price: 590000,
        maxProducts: 100
      },
      'enterprise': {
        id: 'enterprise',
        name: 'سازمانی',
        price: 1290000,
        maxProducts: 999
      }
    };
    
    const plan = demoPlans[planId];
    
    if (plan) {
      setSelectedPlan(plan);
    } else {
      router.push('/seller/plans');
    }
    
    setIsLoading(false);
  }, [planId, router, status, session]);
  
  const handlePaymentMethodChange = (method: 'online' | 'transfer') => {
    setPaymentMethod(method);
  };
  
  const handlePayment = () => {
    setIsProcessing(true);
    
    // شبیه‌سازی پردازش پرداخت
    setTimeout(() => {
      // پس از پرداخت موفق، کاربر به داشبورد فروشنده هدایت می‌شود
      router.push('/seller/dashboard?welcome=true');
    }, 2000);
  };
  
  // فرمت کردن قیمت به صورت فارسی با تومان
  const formatPrice = (price: number) => {
    return `${price.toLocaleString('fa-IR')} تومان`;
  };
  
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (!selectedPlan) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">خطا در بارگذاری اطلاعات پلن</h1>
          <p className="text-gray-600 mb-6">متأسفانه پلن مورد نظر شما یافت نشد.</p>
          <Link 
            href="/seller/plans" 
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            بازگشت به صفحه پلن‌ها
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">تکمیل فرآیند خرید</h1>
          <p className="text-gray-600">لطفاً روش پرداخت را انتخاب کنید و فرآیند خرید را تکمیل نمایید.</p>
        </div>
        
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-2">خلاصه سفارش</h2>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-700">پلن {selectedPlan.name}</p>
                <p className="text-sm text-gray-500 mt-1">دوره اشتراک: یکساله</p>
              </div>
              <div className="text-xl font-bold text-gray-900">{formatPrice(selectedPlan.price)}</div>
            </div>
          </div>
          
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">انتخاب روش پرداخت</h2>
            
            <div className="space-y-4">
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                  paymentMethod === 'online' 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
                onClick={() => handlePaymentMethodChange('online')}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    paymentMethod === 'online' 
                      ? 'border-indigo-500 bg-indigo-500' 
                      : 'border-gray-300'
                  } flex-shrink-0 mr-3`}></div>
                  <div className="flex-grow">
                    <h3 className="font-medium text-gray-900">پرداخت آنلاین</h3>
                    <p className="text-sm text-gray-500 mt-1">پرداخت آنلاین با تمامی کارت‌های بانکی عضو شتاب</p>
                  </div>
                  <div className="flex-shrink-0 flex space-x-1 space-x-reverse">
                    <div className="w-10 h-10 bg-gray-100 rounded p-1 flex items-center justify-center">
                      <Image src="https://images.unsplash.com/photo-1662289994050-0272f4cf6da7?auto=format&fit=crop&q=60&w=500&ixlib=rb-4.0.3" width={32} height={32} alt="شتاب" className="rounded" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                  paymentMethod === 'transfer' 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
                onClick={() => handlePaymentMethodChange('transfer')}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    paymentMethod === 'transfer' 
                      ? 'border-indigo-500 bg-indigo-500' 
                      : 'border-gray-300'
                  } flex-shrink-0 mr-3`}></div>
                  <div className="flex-grow">
                    <h3 className="font-medium text-gray-900">انتقال بانکی</h3>
                    <p className="text-sm text-gray-500 mt-1">واریز به حساب و ارسال فیش پرداخت</p>
                  </div>
                </div>
                
                {paymentMethod === 'transfer' && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-700 mb-2">لطفاً مبلغ <span className="font-bold">{formatPrice(selectedPlan.price)}</span> را به شماره حساب زیر واریز نمایید:</p>
                    <div className="bg-white p-3 rounded border border-gray-200 text-center mb-3">
                      <p className="font-bold text-gray-900 text-lg">IR06-0570-0123-4567-8901-2345-67</p>
                      <p className="text-sm text-gray-600">بانک ملت - به نام شرکت بایوسل</p>
                    </div>
                    <p className="text-sm text-gray-700">پس از واریز، لطفاً از طریق بخش پشتیبانی، تصویر فیش واریزی را ارسال نمایید.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-medium text-gray-900">مبلغ قابل پرداخت:</span>
              <span className="text-2xl font-bold text-gray-900">{formatPrice(selectedPlan.price)}</span>
            </div>
            
            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-indigo-600 to-blue-500 text-white py-4 px-6 rounded-lg hover:from-indigo-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 font-medium disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  در حال پردازش...
                </span>
              ) : (
                paymentMethod === 'online' ? 'پرداخت و تکمیل ثبت‌نام' : 'تأیید و ادامه'
              )}
            </button>
            
            <p className="mt-4 text-sm text-gray-600 text-center">
              با تکمیل فرآیند خرید، شما <span className="text-indigo-600">شرایط و قوانین</span> بایوسل را پذیرفته‌اید.
            </p>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <Link 
            href="/seller/plans" 
            className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
          >
            بازگشت به صفحه انتخاب پلن
          </Link>
        </div>
        
        <div className="mt-16 p-6 bg-white rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="mr-4">
              <h3 className="text-lg font-medium text-gray-900">نیاز به راهنمایی دارید؟</h3>
              <p className="text-gray-600">تیم پشتیبانی ما آماده پاسخگویی به سوالات شماست.</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="mr-2 text-gray-600">021-12345678</span>
            </div>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="mr-2 text-gray-600">support@biosell.me</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 