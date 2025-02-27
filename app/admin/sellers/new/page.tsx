'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { TbArrowRight, TbLoader2 } from 'react-icons/tb';

// Form validation schema
const createSellerSchema = z.object({
  username: z
    .string()
    .min(3, 'نام کاربری باید حداقل ۳ کاراکتر باشد')
    .max(50, 'نام کاربری نمی‌تواند بیشتر از ۵۰ کاراکتر باشد')
    .regex(/^[a-z0-9_\.]+$/, 'فقط حروف انگلیسی کوچک، اعداد، نقطه و آندرلاین مجاز است'),
  email: z.string().email('لطفاً یک ایمیل معتبر وارد کنید'),
  password: z.string().min(6, 'رمز عبور باید حداقل ۶ کاراکتر باشد'),
  shopName: z.string().min(2, 'نام فروشگاه باید حداقل ۲ کاراکتر باشد'),
  bio: z.string().optional(),
  planId: z.string().min(1, 'انتخاب پلن اشتراک الزامی است'),
  subscriptionDuration: z.number().min(1, 'مدت زمان اشتراک الزامی است'),
});

type CreateSellerFormValues = z.infer<typeof createSellerSchema>;

type Plan = {
  id: string;
  name: string;
  price: number;
  features: string[];
  maxProducts: number;
};

export default function NewSellerPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateSellerFormValues>({
    resolver: zodResolver(createSellerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      shopName: '',
      bio: '',
      subscriptionDuration: 1,
    },
  });

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch('/api/admin/plans');
        if (!response.ok) {
          throw new Error('Failed to fetch plans');
        }
        const data = await response.json();
        setPlans(data);
      } catch (error) {
        console.error('Error fetching plans:', error);
        // Mock data
        setPlans([
          {
            id: 'plan1',
            name: 'پایه',
            price: 99000,
            features: ['آپلود تا 20 محصول', 'گالری تصاویر محصول', 'صفحه فروش اختصاصی'],
            maxProducts: 20,
          },
          {
            id: 'plan2',
            name: 'حرفه‌ای',
            price: 199000,
            features: [
              'آپلود تا 100 محصول',
              'گالری تصاویر محصول',
              'صفحه فروش اختصاصی',
              'گزارش فروش پیشرفته',
              'پشتیبانی اختصاصی',
            ],
            maxProducts: 100,
          },
          {
            id: 'plan3',
            name: 'ویژه',
            price: 299000,
            features: [
              'آپلود نامحدود محصول',
              'گالری تصاویر محصول',
              'صفحه فروش اختصاصی',
              'گزارش فروش پیشرفته',
              'پشتیبانی اختصاصی',
              'اپلیکیشن موبایل اختصاصی',
            ],
            maxProducts: 999999,
          },
        ]);
      } finally {
        setIsLoadingPlans(false);
      }
    };

    fetchPlans();
  }, []);

  const onSubmit = async (data: CreateSellerFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/sellers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'خطا در ایجاد فروشنده');
      }

      // Redirect to sellers list with success message
      router.push('/admin/sellers?success=true');
    } catch (error) {
      console.error('Error creating seller:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'خطا در ایجاد فروشنده. لطفاً دوباره تلاش کنید.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  return (
    <div>
      <div className="pb-5 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-tight text-gray-900">
            افزودن فروشنده جدید
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            اطلاعات فروشنده و پلن اشتراک را وارد نمایید
          </p>
        </div>
        <Link
          href="/admin/sellers"
          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          <TbArrowRight className="ml-1" />
          بازگشت به لیست فروشندگان
        </Link>
      </div>

      {error && (
        <div className="mt-6 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-8">
        {/* Seller Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">اطلاعات فروشنده</h2>
          
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                نام کاربری <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  type="text"
                  {...register('username')}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border text-gray-900"
                  dir="ltr"
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.username.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                ایمیل <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border text-gray-900"
                  dir="ltr"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                رمز عبور <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  {...register('password')}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border text-gray-900"
                  dir="ltr"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="shopName"
                className="block text-sm font-medium text-gray-700"
              >
                نام فروشگاه <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="shopName"
                  type="text"
                  {...register('shopName')}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border text-gray-900"
                />
                {errors.shopName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.shopName.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label
              htmlFor="bio"
              className="block text-sm font-medium text-gray-700"
            >
              بیوگرافی
            </label>
            <div className="mt-1">
              <textarea
                id="bio"
                rows={3}
                {...register('bio')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border text-gray-900"
              />
              {errors.bio && (
                <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Subscription Plan */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">پلن اشتراک</h2>

          {isLoadingPlans ? (
            <div className="flex justify-center py-4">
              <TbLoader2 className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {plans.map((plan) => (
                  <div key={plan.id} className="relative">
                    <label
                      htmlFor={`plan-${plan.id}`}
                      className={`
                        block rounded-lg border-2 p-4 cursor-pointer hover:border-blue-500
                        ${errors.planId ? 'border-red-300' : 'border-gray-300'}
                      `}
                    >
                      <input
                        type="radio"
                        id={`plan-${plan.id}`}
                        value={plan.id}
                        {...register('planId')}
                        className="sr-only"
                      />
                      <div className="flex justify-between">
                        <div>
                          <span className="text-lg font-medium text-gray-900">{plan.name}</span>
                        </div>
                        <div className="flex items-center">
                          <div
                            className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                              plan.id === 'plan1'
                                ? 'bg-blue-500 border-transparent'
                                : 'border-gray-300 bg-white'
                            }`}
                          >
                            {plan.id === 'plan1' && (
                              <div className="h-2.5 w-2.5 rounded-full bg-white" />
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="mt-2 text-xl font-semibold text-gray-900">
                        {formatPrice(plan.price)}
                        <span className="text-sm font-normal text-gray-500"> / ماهیانه</span>
                      </p>
                      <ul className="mt-4 space-y-2 text-sm text-gray-700">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <span className="ml-2 text-green-500">✓</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </label>
                  </div>
                ))}
              </div>

              {errors.planId && (
                <p className="mt-2 text-sm text-red-600">{errors.planId.message}</p>
              )}

              <div className="mt-6">
                <label
                  htmlFor="subscriptionDuration"
                  className="block text-sm font-medium text-gray-700"
                >
                  مدت زمان اشتراک (ماه) <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <Controller
                    control={control}
                    name="subscriptionDuration"
                    render={({ field }) => (
                      <select
                        id="subscriptionDuration"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border text-gray-900"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      >
                        <option value={1}>۱ ماهه</option>
                        <option value={3}>۳ ماهه</option>
                        <option value={6}>۶ ماهه</option>
                        <option value={12}>۱۲ ماهه</option>
                      </select>
                    )}
                  />
                  {errors.subscriptionDuration && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.subscriptionDuration.message}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end space-x-3 space-x-reverse">
          <Link
            href="/admin/sellers"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            انصراف
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting && <TbLoader2 className="ml-2 h-4 w-4 animate-spin" />}
            ذخیره
          </button>
        </div>
      </form>
    </div>
  );
} 