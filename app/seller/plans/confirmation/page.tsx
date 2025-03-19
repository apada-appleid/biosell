'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function ConfirmationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    // If not authenticated, redirect to login
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-8 text-white text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-full mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-3">درخواست شما با موفقیت ثبت شد</h1>
          <p className="text-lg text-indigo-100">
            خرید پلن شما در انتظار تأیید ادمین است
          </p>
        </div>
        
        <div className="p-8 md:p-10">
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="mr-3">
                <h3 className="text-lg font-semibold text-green-800 mb-2">نحوه فعال‌سازی اشتراک</h3>
                <p className="text-green-700">
                  پس از بررسی و تأیید فیش واریزی توسط ادمین (معمولاً در کمتر از 24 ساعت)، اشتراک شما فعال خواهد شد و می‌توانید از امکانات پلن خریداری شده استفاده کنید.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">گام‌های بعدی:</h2>
            <ul className="space-y-4">
              <li className="flex">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold text-lg ml-4 flex-shrink-0">
                  1
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900">منتظر تأیید ادمین باشید</h3>
                  <p className="text-gray-600 mt-1">معمولاً در کمتر از 24 ساعت درخواست شما بررسی خواهد شد.</p>
                </div>
              </li>
              
              <li className="flex">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold text-lg ml-4 flex-shrink-0">
                  2
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900">وضعیت اشتراک خود را بررسی کنید</h3>
                  <p className="text-gray-600 mt-1">می‌توانید از بخش پنل فروشنده، وضعیت اشتراک خود را مشاهده کنید.</p>
                </div>
              </li>
              
              <li className="flex">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold text-lg ml-4 flex-shrink-0">
                  3
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900">افزودن محصولات</h3>
                  <p className="text-gray-600 mt-1">پس از فعال‌سازی اشتراک، می‌توانید محصولات خود را به فروشگاه اضافه کنید.</p>
                </div>
              </li>
            </ul>
          </div>
          
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-indigo-800 mb-2">نیاز به کمک دارید؟</h3>
            <p className="text-indigo-700 mb-4">
              با پشتیبانی ما تماس بگیرید:
            </p>
            <div className="flex flex-col space-y-2">
              <a href="tel:+982144334455" className="inline-flex items-center text-indigo-600 hover:text-indigo-800">
                <svg className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                021-44334455
              </a>
              <a href="mailto:support@biosell.me" className="inline-flex items-center text-indigo-600 hover:text-indigo-800">
                <svg className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                support@biosell.me
              </a>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-reverse sm:space-x-4 justify-center">
            <Link href="/seller/dashboard" className="py-3 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-center shadow-md">
              رفتن به داشبورد
            </Link>
            <Link href="/seller/subscriptions" className="py-3 px-8 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-medium rounded-xl text-center">
              مشاهده وضعیت اشتراک
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 