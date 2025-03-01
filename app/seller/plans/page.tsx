'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import axios from 'axios';

// Define plan type
type Plan = {
  id: string;
  name: string;
  price: number;
  features: string[];
  maxProducts: number;
};

// Sample plans (this would normally come from the API)
const SAMPLE_PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'پایه',
    price: 0,
    features: ['حداکثر 20 محصول', 'پشتیبانی ایمیل', 'امکان فروش محصولات فیزیکی'],
    maxProducts: 20
  },
  {
    id: 'standard',
    name: 'استاندارد',
    price: 250000,
    features: ['حداکثر 100 محصول', 'پشتیبانی تلفنی', 'امکان فروش محصولات فیزیکی و دیجیتال', 'گزارش فروش پیشرفته'],
    maxProducts: 100
  },
  {
    id: 'premium',
    name: 'حرفه‌ای',
    price: 750000,
    features: ['محصولات نامحدود', 'پشتیبانی VIP', 'امکان فروش تمام انواع محصولات', 'گزارش فروش پیشرفته', 'امکان تخفیف روی محصولات'],
    maxProducts: 999999
  }
];

export default function PlansPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // If the user is logged in and is a seller with an active subscription, redirect to dashboard
    if (status === 'authenticated' && session?.user?.type === 'seller') {
      // Here you would check if user has an active subscription
      // and redirect if needed
    }
  }, [status, session, router]);
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };
  
  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
  };
  
  const handleSubmit = async () => {
    if (!selectedPlan) {
      setError('لطفاً یک پلن را انتخاب کنید');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Here you would call an API to subscribe to the plan
      // For now, let's just simulate success
      
      // If user is authenticated, redirect to dashboard
      if (status === 'authenticated') {
        router.push('/seller/dashboard');
      } else {
        // If not authenticated, redirect to login
        router.push('/auth/login');
      }
    } catch (err) {
      console.error('Error selecting plan:', err);
      setError('خطا در انتخاب پلن. لطفاً دوباره تلاش کنید.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">انتخاب پلن اشتراک</h1>
          <p className="text-lg text-gray-600">
            پلن مناسب کسب‌وکار خود را انتخاب کنید و همین امروز فروش آنلاین را شروع کنید
          </p>
        </div>
        
        {error && (
          <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {SAMPLE_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`
                bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl
                ${selectedPlan === plan.id ? 'ring-4 ring-blue-500 scale-105' : ''}
              `}
              onClick={() => handleSelectPlan(plan.id)}
            >
              <div className="p-8 flex flex-col h-full">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-indigo-600">
                    {plan.price === 0 ? 'رایگان' : `${formatPrice(plan.price)} تومان`}
                  </span>
                  {plan.price > 0 && <span className="text-gray-500 ml-2">/ ماهانه</span>}
                </div>
                <ul className="mb-8 flex-grow">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center mb-3">
                      <svg className="h-5 w-5 text-green-500 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className={`
                    w-full py-3 px-4 rounded-md font-medium transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                    ${selectedPlan === plan.id
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                    }
                  `}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {selectedPlan === plan.id ? 'انتخاب شده' : 'انتخاب پلن'}
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-center">
          <button
            type="button"
            disabled={!selectedPlan || isLoading}
            className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white py-3 px-8 rounded-md hover:from-indigo-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 font-medium disabled:opacity-70 disabled:cursor-not-allowed"
            onClick={handleSubmit}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                در حال پردازش...
              </span>
            ) : (
              'ادامه و تکمیل ثبت‌نام'
            )}
          </button>
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600">
            قبلاً ثبت‌نام کرده‌اید؟{' '}
            <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-800 font-medium">
              ورود به حساب
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 