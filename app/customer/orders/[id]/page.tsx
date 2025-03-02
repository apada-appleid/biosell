import { Suspense } from 'react';
import OrderDetailsClient from '@/app/customer/orders/[id]/OrderDetailsClient';

// Server component to handle async params
export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  // Await params in the server component
  const resolvedParams = await params;
  
  return (
    <Suspense fallback={<div className="text-center py-10">جزئیات سفارش در حال بارگذاری...</div>}>
      <OrderDetailsClient id={resolvedParams.id} />
    </Suspense>
  );
} 