import { Suspense } from 'react';
import PaymentClient from '@/app/seller/payment/PaymentClient';

// Server component that will handle async params
export default function SellerPaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>}>
      <PaymentClient />
    </Suspense>
  );
} 