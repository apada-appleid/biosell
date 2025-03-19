'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

// Define types
type Plan = {
  id: string;
  name: string;
  price: number;
  features: string[];
  maxProducts: number;
};

export default function PlansPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  
  useEffect(() => {
    // If the user is logged in and is a seller with an active subscription, redirect to dashboard
    if (status === 'authenticated' && session?.user?.type === 'seller') {
      // Here you would check if user has an active subscription
      // and redirect if needed
    }
    
    // Fetch plans from the API
    const fetchPlans = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/plans');
        const data = await response.json();
        
        if (data.success && data.plans) {
          setPlans(data.plans);
        } else {
          setError('خطا در دریافت پلن‌ها. لطفاً صفحه را دوباره بارگذاری کنید.');
        }
      } catch (err) {
        console.error('Error fetching plans:', err);
        setError('خطا در ارتباط با سرور. لطفاً صفحه را دوباره بارگذاری کنید.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPlans();
  }, [status, session, router]);
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };
  
  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
  };
  
  const handleSubmit = () => {
    if (!selectedPlan) {
      setError('لطفاً یک پلن را انتخاب کنید');
      return;
    }
    
    // Navigate to payment page with selected plan
    router.push(`/seller/plans/payment?planId=${selectedPlan}`);
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-lg text-gray-700">در حال بارگذاری پلن‌ها...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-6 tracking-tight">انتخاب پلن اشتراک</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            پلن مناسب کسب‌وکار خود را انتخاب کنید و همین امروز فروش آنلاین را شروع کنید
          </p>
          <div className="mt-8 flex justify-center">
            <div className="inline-flex items-center bg-indigo-100 px-4 py-2 rounded-full text-indigo-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>پلن مناسب خود را انتخاب کنید و از مزایای آن بهره‌مند شوید</span>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`
                bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 transform hover:-translate-y-2 cursor-pointer
                ${selectedPlan === plan.id ? 'ring-4 ring-indigo-500 scale-105' : 'hover:shadow-2xl'}
              `}
              onClick={() => handleSelectPlan(plan.id)}
            >
              <div className="p-8 flex flex-col h-full">
                {plan.price === 0 && (
                  <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    رایگان
                  </div>
                )}
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{plan.name}</h3>
                
                <div className="mb-6 flex items-baseline">
                  <span className="text-5xl font-bold text-indigo-600">
                    {plan.price === 0 ? 'رایگان' : formatPrice(plan.price)}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-gray-500 mr-2 text-lg">تومان / ماهانه</span>
                  )}
                </div>
                
                <div className="h-px bg-gray-200 w-full my-6"></div>
                
                <ul className="mb-8 flex-grow">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center mb-4">
                      <svg className="h-5 w-5 text-green-500 ml-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button
                  type="button"
                  className={`
                    w-full py-4 px-4 rounded-xl font-medium text-lg transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
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
        
        <div className="flex flex-col items-center">
          <button
            type="button"
            disabled={!selectedPlan || isLoading}
            className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white py-4 px-10 rounded-xl text-xl hover:from-indigo-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 font-medium disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
            onClick={handleSubmit}
          >
            ادامه و پرداخت
          </button>
          
          <p className="mt-6 text-gray-600 max-w-md text-center text-lg">
            با خرید هر پلن، شما می‌توانید فروشگاه آنلاین خود را راه‌اندازی کرده و محصولات خود را به فروش برسانید.
          </p>
        </div>
        
        <div className="mt-16 bg-white rounded-2xl shadow-md p-6 lg:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">سوالات متداول</h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-bold text-lg text-gray-900 mb-3">پرداخت چگونه انجام می‌شود؟</h3>
              <p className="text-gray-700">پس از انتخاب پلن، می‌توانید از طریق کارت بانکی یا واریز مستقیم به حساب، پرداخت را انجام دهید.</p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-bold text-lg text-gray-900 mb-3">آیا امکان ارتقای پلن وجود دارد؟</h3>
              <p className="text-gray-700">بله، در هر زمان می‌توانید پلن خود را به یک پلن بالاتر ارتقا دهید.</p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-bold text-lg text-gray-900 mb-3">مدت زمان اشتراک چقدر است؟</h3>
              <p className="text-gray-700">اشتراک‌ها به صورت ماهانه هستند و پس از پایان مدت، قابل تمدید می‌باشند.</p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-bold text-lg text-gray-900 mb-3">آیا پشتیبانی ارائه می‌شود؟</h3>
              <p className="text-gray-700">بله، تمامی پلن‌ها شامل پشتیبانی هستند. سطح پشتیبانی بسته به نوع پلن متفاوت است.</p>
            </div>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-gray-600">
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