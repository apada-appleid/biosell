'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { uploadReceiptToS3 } from '@/utils/s3-storage';

// Types
type Plan = {
  id: string;
  name: string;
  price: number;
  features: string[];
  maxProducts: number;
};

type ReceiptInfo = {
  key: string;
  url: string;
  bucket: string;
  filename?: string;
  size?: number;
  contentType?: string;
};

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [receiptInfo, setReceiptInfo] = useState<ReceiptInfo | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const planId = searchParams?.get('planId');
  
  useEffect(() => {
    // If no planId or not authenticated, redirect back to plans page
    if (!planId) {
      router.push('/seller/plans');
      return;
    }
    
    // If not authenticated, redirect to login
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    
    // Fetch plan details
    const fetchPlan = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/plans?id=${planId}`);
        const data = await response.json();
        
        if (data.success && data.plan) {
          setPlan(data.plan);
        } else {
          setError('خطا در دریافت اطلاعات پلن. لطفاً دوباره تلاش کنید.');
        }
      } catch (err) {
        console.error('Error fetching plan:', err);
        setError('خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPlan();
  }, [planId, router, status]);
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('لطفاً یک تصویر با فرمت PNG یا JPG انتخاب کنید.');
      return;
    }
    
    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('حجم تصویر باید کمتر از 5 مگابایت باشد.');
      return;
    }
    
    setFile(selectedFile);
    setError(null);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };
  
  const handleSubmit = async () => {
    if (!file && !receiptInfo) {
      setError('لطفاً ابتدا یک تصویر فیش انتخاب کنید.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Step 1: Upload receipt if not already uploaded
      let receipt = receiptInfo;
      if (!receipt && file && session) {
        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return prev + 10;
          });
        }, 500);
        
        // Upload receipt to S3
        const path = `subscriptions/${session.user.id}`;
        receipt = await uploadReceiptToS3(file, path);
        
        clearInterval(progressInterval);
        setUploadProgress(100);
        setReceiptInfo(receipt);
        
        // Short delay to show 100% progress
        await new Promise(resolve => setTimeout(resolve, 500));
        setUploadProgress(0);
      }
      
      if (!receipt || !planId) {
        throw new Error('اطلاعات فیش پرداخت یا پلن ناقص است.');
      }
      
      // Step 2: Submit subscription request with receipt info
      const response = await fetch('/api/plans/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          receiptInfo: receipt,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response from server:', errorText);
        throw new Error(response.status === 500 
          ? 'خطا در سرور. لطفاً با پشتیبانی تماس بگیرید.' 
          : `خطا در ثبت اشتراک: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Redirect to confirmation page
        router.push('/seller/plans/confirmation');
      } else {
        setError(data.message || 'خطا در ثبت اشتراک. لطفاً دوباره تلاش کنید.');
      }
    } catch (err) {
      console.error('Error in subscription process:', err);
      setError(err instanceof Error ? err.message : 'خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-lg text-gray-700">در حال بارگذاری اطلاعات پلن...</p>
        </div>
      </div>
    );
  }
  
  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md w-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-red-500 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">پلن یافت نشد</h2>
          <p className="text-gray-600 mb-6">
            متأسفانه پلن مورد نظر یافت نشد. لطفاً به صفحه انتخاب پلن بازگردید و دوباره تلاش کنید.
          </p>
          <Link href="/seller/plans" className="bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 inline-block transition-colors">
            بازگشت به صفحه پلن‌ها
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Link href="/seller/plans" className="inline-flex items-center text-indigo-600 font-medium mb-6 hover:text-indigo-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            بازگشت به صفحه پلن‌ها
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">پرداخت و فعال‌سازی پلن</h1>
          <p className="text-lg text-gray-600">
            برای فعال‌سازی پلن <span className="font-semibold text-indigo-600">{plan.name}</span>، لطفاً فیش واریزی خود را آپلود کنید.
          </p>
        </div>
        
        {error && (
          <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">آپلود فیش پرداخت</h2>
              
              <div className="space-y-6">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                  {previewUrl ? (
                    <div className="relative">
                      <img 
                        src={previewUrl} 
                        alt="پیش‌نمایش فیش" 
                        className="mx-auto max-h-64 rounded-lg" 
                      />
                      <button
                        onClick={() => {
                          setFile(null);
                          setPreviewUrl(null);
                          setReceiptInfo(null);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                        aria-label="حذف تصویر"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="mt-4 text-gray-600">برای آپلود فیش واریزی، کلیک کنید یا تصویر را اینجا رها کنید</p>
                      <p className="mt-2 text-sm text-gray-500">فرمت‌های مجاز: JPG و PNG (حداکثر 5MB)</p>
                    </>
                  )}
                  
                  <input
                    type="file"
                    id="receipt"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  
                  <div className="mt-4">
                    <label
                      htmlFor="receipt"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      {file ? 'تغییر تصویر' : 'انتخاب تصویر'}
                    </label>
                  </div>
                </div>
                
                {file && (
                  <div>
                    <p className="text-sm text-gray-600 mb-3">
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                    
                    {uploadProgress > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                        <div 
                          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                )}
                
                {receiptInfo && (
                  <div className="bg-green-50 p-4 rounded-lg text-green-800 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>فیش با موفقیت آپلود شد!</span>
                  </div>
                )}
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-bold text-yellow-800 mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    اطلاعات واریز
                  </h3>
                  <p className="text-yellow-800 text-sm">
                    لطفاً مبلغ <span className="font-bold">{formatPrice(plan.price)} تومان</span> را به شماره کارت زیر واریز کرده و تصویر فیش را آپلود نمایید:
                  </p>
                  <div className="mt-3 bg-white p-3 rounded border border-yellow-200 text-center">
                    <p className="font-mono text-lg font-bold tracking-wider">6104-3377-7006-2209</p>
                    <p className="mt-1 text-sm text-gray-600">به نام شرکت بایوسل</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!file && !receiptInfo || isSubmitting}
                  className="w-full py-4 px-4 bg-gradient-to-r from-indigo-600 to-blue-500 text-white text-lg font-medium rounded-xl hover:from-indigo-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {receiptInfo ? 'در حال ثبت اشتراک...' : 'در حال آپلود فیش...'}
                    </span>
                  ) : (
                    'ثبت اشتراک و فعال‌سازی پلن'
                  )}
                </button>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden sticky top-8">
              <div className="bg-indigo-600 text-white p-6">
                <h3 className="text-xl font-bold mb-2">خلاصه سفارش</h3>
                <p className="text-indigo-100">پلن انتخابی شما</p>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-bold text-gray-900">{plan.name}</span>
                  <span className="text-lg font-bold text-indigo-600">
                    {plan.price === 0 ? 'رایگان' : `${formatPrice(plan.price)} تومان`}
                  </span>
                </div>
                
                <div className="h-px bg-gray-200 my-4"></div>
                
                <h4 className="font-bold text-gray-900 mb-3">ویژگی‌های پلن:</h4>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 ml-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="h-px bg-gray-200 my-4"></div>
                
                <div className="flex justify-between items-center font-bold text-lg">
                  <span className="text-gray-900">مبلغ قابل پرداخت:</span>
                  <span className="text-indigo-600">
                    {plan.price === 0 ? 'رایگان' : `${formatPrice(plan.price)} تومان`}
                  </span>
                </div>
                
                <div className="mt-6 text-sm text-gray-600">
                  <p>اشتراک شما پس از تأیید پرداخت توسط ادمین فعال خواهد شد.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlanPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-lg text-gray-700">در حال بارگذاری...</p>
        </div>
      </div>
    }>
      <PaymentPageContent />
    </Suspense>
  );
} 