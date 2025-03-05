'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-red-600 mb-4">
          خطایی رخ داده است
        </h2>
        <p className="text-gray-600 mb-6">
          متأسفانه مشکلی در اجرای برنامه پیش آمده است. لطفاً مجدداً تلاش کنید.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => reset()}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            تلاش مجدد
          </button>
          <Link
            href="/"
            className="block w-full py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            بازگشت به صفحه اصلی
          </Link>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-gray-100 rounded-md text-red-800 text-sm text-right overflow-auto max-h-64">
            <pre>{error.message}</pre>
            <pre>{error.stack}</pre>
          </div>
        )}
      </div>
    </div>
  );
} 