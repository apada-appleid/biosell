'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useSession, signIn } from 'next-auth/react';
import axios from 'axios';

const registerSchema = z.object({
  shopName: z.string().min(3, 'نام فروشگاه باید حداقل 3 کاراکتر باشد'),
  instagramId: z.string()
    .min(3, 'آیدی اینستاگرام باید حداقل 3 کاراکتر باشد')
    .regex(/^[a-zA-Z0-9._]+$/, 'آیدی اینستاگرام فقط می‌تواند شامل حروف انگلیسی، اعداد، نقطه و زیرخط باشد')
    .regex(/^(?!.*\.\.)/, 'آیدی اینستاگرام نمی‌تواند شامل نقطه‌های پشت سر هم باشد')
    .max(30, 'آیدی اینستاگرام نمی‌تواند بیشتر از 30 کاراکتر باشد'),
  email: z.string().email('ایمیل معتبر وارد کنید'),
  password: z.string().min(8, 'رمز عبور باید حداقل 8 کاراکتر باشد'),
  mobileNumber: z.string().regex(/^09\d{9}$/, 'شماره موبایل معتبر وارد کنید'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

interface ApiError extends Error {
  response?: {
    data?: {
      error?: string;
    };
  };
}

export default function SellerRegisterPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // همه useState ها با هم باشند
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // useForm باید قبل از useEffect‌ها قرار بگیرد چون احتمالاً داخلش از useRef استفاده می‌شود
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      shopName: '',
      instagramId: '',
      email: '',
      password: '',
      mobileNumber: '',
    },
  });
  
  // useEffect‌ها بعد از useForm قرار بگیرند
  // بررسی وضعیت احراز هویت
  useEffect(() => {
    // اگر کاربر قبلاً به عنوان فروشنده وارد شده باشد به داشبورد هدایت می‌شود
    if (status === 'authenticated' && session?.user?.type === 'seller') {
      router.push('/seller/dashboard');
    }
  }, [status, session, router]);
  
  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);
    setIsSubmitting(true);

    try {
      // Prepare data for API
      const apiData = {
        shopName: data.shopName,
        instagramId: data.instagramId,
        email: data.email,
        password: data.password,
        mobile: data.mobileNumber,
      };

      // Call the seller registration API
      const response = await axios.post('/api/seller/register', apiData);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Registration failed');
      }
      
      // Sign in the user with the new credentials
      const signInResult = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
        role: 'seller',
      });

      if (signInResult?.error) {
        console.error('Sign in error after registration:', signInResult.error);
        setError('ثبت‌نام انجام شد اما ورود به سیستم با خطا مواجه شد. لطفاً وارد صفحه ورود شوید.');
        // Even if login fails, still redirect to plans page
        router.push('/seller/plans');
        return;
      }

      // On successful login, redirect to plans page
      router.push('/seller/plans');
    } catch (err: Error | ApiError | unknown) {
      console.error('Error during registration:', err);
      const apiError = err as ApiError;
      setError(apiError.response?.data?.error || (err instanceof Error ? err.message : 'خطا در ثبت‌نام. لطفاً دوباره تلاش کنید.'));
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  };

  // اگر در حال بررسی وضعیت احراز هویت هستیم، نمایشگر لودینگ نشان دهیم
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ثبت‌نام فروشنده</h1>
          <p className="text-sm text-gray-600">به جمع فروشندگان بایوسل بپیوندید و کسب‌وکار خود را آنلاین کنید</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="mb-4">
            <label htmlFor="shopName" className="block text-sm font-medium text-gray-700 mb-1">
              نام فروشگاه <span className="text-red-500">*</span>
            </label>
            <input
              id="shopName"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              {...register('shopName', { required: true })}
            />
            {errors.shopName && (
              <p className="mt-1 text-sm text-red-600">{errors.shopName.message}</p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="instagramId" className="block text-sm font-medium text-gray-700 mb-1">
              آیدی اینستاگرام <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center">
              <input
                id="instagramId"
                type="text"
                className="w-full px-3 py-2 border border-l-0 border-gray-300 rounded-r-none rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white text-left"
                placeholder="نام‌کاربری اینستاگرام"
                dir="ltr"
                {...register('instagramId', { 
                  required: true,
                  setValueAs: (value) => {
                    // Remove @ from the beginning if user entered it
                    return value.startsWith('@') ? value.substring(1) : value;
                  }
                })}
              />
              <span className="inline-flex items-center px-3 py-2 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                @
              </span>
            </div>
            {errors.instagramId && (
              <p className="mt-1 text-sm text-red-600">{errors.instagramId.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">آیدی اینستاگرام فروشگاه شما</p>
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              ایمیل <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white text-left"
              dir="ltr"
              {...register('email', { 
                required: true,
                pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
              })}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700 mb-1">
              شماره تماس <span className="text-red-500">*</span>
            </label>
            <input
              id="mobileNumber"
              type="tel"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white text-left"
              dir="ltr"
              {...register('mobileNumber', { required: true })}
            />
            {errors.mobileNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.mobileNumber.message}</p>
            )}
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              رمز عبور <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white text-left"
              dir="ltr"
              {...register('password', { required: true, minLength: 6 })}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || isSubmitting}
              className="w-full bg-gradient-to-r from-indigo-600 to-blue-500 text-white py-3 px-4 rounded-md hover:from-indigo-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 font-medium disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  در حال ثبت‌نام...
                </span>
              ) : (
                'ثبت‌نام و انتخاب پلن'
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            قبلاً ثبت‌نام کرده‌اید؟{' '}
            <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-800 font-medium">
              ورود به حساب
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-8 max-w-2xl text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-4">مزایای فروش در بایوسل</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-lg shadow-md">
            <div className="text-indigo-600 text-3xl mb-3">⚡</div>
            <h3 className="font-bold text-gray-800 mb-2">راه‌اندازی سریع</h3>
            <p className="text-gray-600 text-sm">در کمتر از ۵ دقیقه فروشگاه خود را راه‌اندازی کنید</p>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-md">
            <div className="text-indigo-600 text-3xl mb-3">💰</div>
            <h3 className="font-bold text-gray-800 mb-2">کارمزد پایین</h3>
            <p className="text-gray-600 text-sm">کمترین کارمزد را در مقایسه با رقبا پرداخت کنید</p>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-md">
            <div className="text-indigo-600 text-3xl mb-3">📱</div>
            <h3 className="font-bold text-gray-800 mb-2">فروشگاه موبایل‌فرندلی</h3>
            <p className="text-gray-600 text-sm">فروشگاهی که برای نمایش در موبایل بهینه شده است</p>
          </div>
        </div>
      </div>
    </div>
  );
} 