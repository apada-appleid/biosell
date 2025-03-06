import { WifiOff } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center">
      <div className="container flex max-w-[420px] flex-col items-center justify-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100">
          <WifiOff className="h-10 w-10 text-yellow-600" />
        </div>
        <h1 className="text-4xl font-bold">اتصال به اینترنت قطع است</h1>
        <p className="text-lg text-gray-500">
          متأسفانه اتصال شما به اینترنت قطع شده است. برخی از صفحات و عملکردها ممکن است در حالت آفلاین در دسترس نباشند.
        </p>
        <p className="mt-2 text-sm text-gray-400">
          هنگامی که اتصال اینترنت برقرار شود، می‌توانید به استفاده عادی از اپلیکیشن ادامه دهید.
        </p>

        <div className="mt-8 flex w-full flex-col gap-2">
          <Link
            href="/"
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            تلاش مجدد
          </Link>
        </div>
      </div>
    </div>
  );
} 