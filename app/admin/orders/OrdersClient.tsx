'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { TbFilter, TbSearch, TbEye, TbTruckDelivery, TbCreditCard, TbCalendar, TbUser } from 'react-icons/tb';

interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  totalPrice: number;
  product: {
    id: string;
    title: string;
    images: {
      imageUrl: string;
    }[];
  };
}

interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  total: number;
  paymentMethod: string;
  seller: {
    id: string;
    shopName: string;
    username: string;
  };
  customer: {
    id: string;
    fullName: string;
    email: string;
    mobile: string;
  };
  items: OrderItem[];
  receiptInfo?: any;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function OrdersClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  
  // Filters
  const [sellerFilter, setSellerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Fetch orders on initial load and when filters change
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        
        // Build query parameters
        const params = new URLSearchParams();
        if (sellerFilter) params.append('sellerId', sellerFilter);
        if (statusFilter) params.append('status', statusFilter);
        if (paymentStatusFilter) params.append('paymentStatus', paymentStatusFilter);
        if (searchQuery) params.append('search', searchQuery);
        
        const page = searchParams.get('page') || '1';
        params.append('page', page);
        params.append('limit', '20');
        
        const response = await fetch(`/api/admin/orders?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }
        
        const data = await response.json();
        setOrders(data.orders);
        setPagination(data.pagination);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrders();
  }, [searchParams, sellerFilter, statusFilter, paymentStatusFilter, searchQuery]);
  
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`/admin/orders?${params.toString()}`);
  };
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    params.set('page', '1'); // Reset to first page on new search
    router.push(`/admin/orders?${params.toString()}`);
  };
  
  const handleResetFilters = () => {
    setSellerFilter('');
    setStatusFilter('');
    setPaymentStatusFilter('');
    setSearchQuery('');
    router.push('/admin/orders');
  };
  
  // Helper function to translate status
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'در انتظار تأیید';
      case 'processing':
        return 'در حال پردازش';
      case 'completed':
        return 'تکمیل شده';
      case 'cancelled':
        return 'لغو شده';
      default:
        return status;
    }
  };
  
  // Helper function to translate payment status
  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'پرداخت شده';
      case 'pending':
        return 'در انتظار پرداخت';
      case 'failed':
        return 'ناموفق';
      default:
        return status;
    }
  };
  
  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div>
      {/* Search and filter section */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 text-gray-500 hover:text-gray-700 bg-gray-100 rounded-md flex items-center justify-center"
            >
              <TbFilter className="h-5 w-5" />
              <span className="mr-1 text-sm font-medium">فیلترها</span>
            </button>
            
            <form onSubmit={handleSearchSubmit} className="flex flex-1 w-full">
              <div className="relative rounded-md flex-1">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <TbSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="جستجو شماره سفارش..."
                />
              </div>
              <button
                type="submit"
                className="mr-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                جستجو
              </button>
            </form>
          </div>
          
          <div className="text-sm text-gray-500 text-center sm:text-right">
            {pagination.total} سفارش یافت شد
          </div>
        </div>
        
        {/* Filters */}
        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-md mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  وضعیت سفارش
                </label>
                <select
                  id="status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">همه وضعیت‌ها</option>
                  <option value="pending">در انتظار تأیید</option>
                  <option value="processing">در حال پردازش</option>
                  <option value="completed">تکمیل شده</option>
                  <option value="cancelled">لغو شده</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="paymentStatus" className="block text-sm font-medium text-gray-700 mb-1">
                  وضعیت پرداخت
                </label>
                <select
                  id="paymentStatus"
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">همه وضعیت‌ها</option>
                  <option value="paid">پرداخت شده</option>
                  <option value="pending">در انتظار پرداخت</option>
                  <option value="failed">ناموفق</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={handleResetFilters}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  پاک کردن فیلترها
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Orders Table */}
      <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">شماره سفارش</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">فروشگاه</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">خریدار</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاریخ</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">وضعیت</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">پرداخت</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">مبلغ کل</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عملیات</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.orderNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{order.seller?.shopName || 'نامشخص'}</div>
                  <div className="text-sm text-gray-500">@{order.seller?.username || 'نامشخص'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{order.customer?.fullName || 'نامشخص'}</div>
                  <div className="text-sm text-gray-500">{order.customer?.mobile || 'نامشخص'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(order.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {getPaymentStatusText(order.paymentStatus)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                  {formatPrice(order.total)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link href={`/admin/orders/${order.id}`} className="text-blue-600 hover:text-blue-900">
                    <TbEye className="h-5 w-5 inline" /> مشاهده
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Orders List */}
      <div className="md:hidden space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-medium">شماره سفارش: {order.orderNumber}</div>
                  <div className="mt-1 flex items-center text-xs text-gray-500">
                    <TbCalendar className="inline mr-1" /> {formatDate(order.createdAt)}
                  </div>
                </div>
                <div className="flex space-x-2 space-x-reverse">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {getPaymentStatusText(order.paymentStatus)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500 flex items-center">
                  <TbUser className="ml-1" /> خریدار
                </div>
                <div className="font-medium">{order.customer?.fullName || 'نامشخص'}</div>
                <div className="text-xs text-gray-500">{order.customer?.mobile || 'نامشخص'}</div>
              </div>
              
              <div>
                <div className="text-gray-500 flex items-center">
                  <TbTruckDelivery className="ml-1" /> فروشگاه
                </div>
                <div className="font-medium">{order.seller?.shopName || 'نامشخص'}</div>
                <div className="text-xs text-gray-500">@{order.seller?.username || 'نامشخص'}</div>
              </div>
              
              <div className="col-span-2">
                <div className="text-gray-500 flex items-center">
                  <TbCreditCard className="ml-1" /> مبلغ کل
                </div>
                <div className="font-medium text-lg">{formatPrice(order.total)}</div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 flex justify-end">
              <Link 
                href={`/admin/orders/${order.id}`} 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <TbEye className="ml-1" /> مشاهده جزئیات
              </Link>
            </div>
          </div>
        ))}
      </div>
      
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                pagination.page === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              قبلی
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                pagination.page === pagination.totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              بعدی
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                نمایش{' '}
                <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> تا{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                از <span className="font-medium">{pagination.total}</span> سفارش
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px space-x-reverse" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    pagination.page === 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  {/* Right chevron icon */}
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      page === pagination.page
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    pagination.page === pagination.totalPages
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Next</span>
                  {/* Left chevron icon */}
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 