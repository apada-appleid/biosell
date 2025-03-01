'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';

const loginSchema = z.object({
  email: z.string().email('ایمیل معتبر وارد کنید'),
  password: z.string().min(6, 'رمز عبور باید حداقل 6 کاراکتر باشد'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
        role: 'seller', // فقط برای فروشندگان
      });

      if (result?.error) {
        setError('نام کاربری یا رمز عبور اشتباه است');
        return;
      }

      router.push('/seller/dashboard');
      router.refresh();
    } catch (err) {
      setError('خطا در ورود به سیستم');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            شاپگرام
          </Link>
          <h2 className="text-center text-2xl font-bold text-gray-900 mt-4">
            ورود فروشندگان
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            برای دسترسی به پنل فروشندگان، وارد حساب کاربری خود شوید
          </p>
        </div>

        <div className="bg-white p-8 shadow-md rounded-lg w-full">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                ایمیل
              </label>
              <input
                id="email"
                type="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                placeholder="example@email.com"
                {...register('email', { required: true })}
                dir="ltr"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message || 'ایمیل الزامی است'}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                رمز عبور
              </label>
              <input
                id="password"
                type="password"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                placeholder="********"
                {...register('password', { required: true })}
                dir="ltr"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message || 'رمز عبور الزامی است'}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="mr-2 block text-sm text-gray-700">
                  مرا به خاطر بسپار
                </label>
              </div>
              <div className="text-sm">
                <Link href="/auth/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                  فراموشی رمز عبور
                </Link>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3" role="alert">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-busy={isLoading}
              >
                {isLoading ? 'در حال ورود...' : 'ورود'}
              </button>
            </div>
          </form>

          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm">
              <Link href="/seller/register" className="font-medium text-blue-600 hover:text-blue-500">
                ثبت نام فروشندگان
              </Link>
            </div>
            <div className="text-sm">
              <Link href="/auth/customer-login" className="font-medium text-gray-600 hover:text-gray-500">
                ورود کاربران
              </Link>
            </div>
          </div>
          
          {/* لینک مخفی برای مدیران سیستم */}
          <div className="mt-6 text-center">
            <Link href="/auth/admin" className="text-xs text-gray-400 hover:text-gray-500">
              ورود مدیران
            </Link>
          </div>
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            با ورود به سایت، شما <Link href="/terms" className="text-blue-600 hover:text-blue-500">شرایط و قوانین</Link> استفاده از خدمات ما را می‌پذیرید.
          </p>
        </div>
      </div>
    </div>
  );
} 