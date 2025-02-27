'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const loginSchema = z.object({
  email: z.string().email('ایمیل معتبر وارد کنید'),
  password: z.string().min(6, 'رمز عبور باید حداقل 6 کاراکتر باشد'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loginType, setLoginType] = useState<'admin' | 'seller'>('admin');

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

  const handleLoginTypeChange = (type: 'admin' | 'seller') => {
    setLoginType(type);
    setError(null);
  };

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      // If admin login, add @admin suffix to email
      const email = loginType === 'admin' 
        ? data.email.includes('@admin') ? data.email : `${data.email}@admin` 
        : data.email;

      const result = await signIn('credentials', {
        redirect: false,
        email,
        password: data.password,
      });

      if (result?.error) {
        setError('نام کاربری یا رمز عبور اشتباه است');
        return;
      }

      if (loginType === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/seller/dashboard');
      }
      
      router.refresh();
    } catch (err) {
      setError('خطا در ورود به سیستم');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          ورود به حساب کاربری
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <div className="mb-4 flex rounded-md">
            <button
              type="button"
              onClick={() => handleLoginTypeChange('admin')}
              className={`flex-1 py-2 text-center rounded-l-md transition-colors ${loginType === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
              aria-pressed={loginType === 'admin'}
              aria-label="ورود به عنوان مدیر سیستم"
            >
              مدیر سیستم
            </button>
            <button
              type="button"
              onClick={() => handleLoginTypeChange('seller')}
              className={`flex-1 py-2 text-center rounded-r-md transition-colors ${loginType === 'seller' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
              aria-pressed={loginType === 'seller'}
              aria-label="ورود به عنوان فروشنده"
            >
              فروشنده
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                ایمیل
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  dir="ltr"
                  {...register('email')}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border text-gray-900"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                رمز عبور
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  dir="ltr"
                  {...register('password')}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border text-gray-900"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
                />
                {errors.password && (
                  <p id="password-error" className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4" role="alert">
                <div className="flex">
                  <div>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-busy={isLoading}
              >
                {isLoading ? 'در حال ورود...' : 'ورود'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 