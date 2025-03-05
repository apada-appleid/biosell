import { Suspense } from 'react';
import SellerOrderDetailsPage from './SellerOrderDetailsClient';

// Server component to handle async params
export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  // Await params in the server component
  const resolvedParams = await params;
  
  return (
    <Suspense fallback={<div className="text-center py-10">جزئیات سفارش در حال بارگذاری...</div>}>
      <SellerOrderDetailsPage params={{ id: resolvedParams.id }} />
    </Suspense>
  );
} 