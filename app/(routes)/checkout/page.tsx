'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/app/store/cart';
import { useToastStore } from '@/app/store/toast';
import { FiArrowLeft, FiPlus, FiCheck, FiX, FiCreditCard, FiDollarSign } from 'react-icons/fi';
import { TbLoader } from 'react-icons/tb';
import { uploadReceiptToS3, getSignedReceiptUrl } from '@/utils/s3-storage';

interface CartItem {
  product: {
    id: string;
    title: string;
    price: number;
    sellerId: string;
    images: string[];
  };
  quantity: number;
}

interface UserInfo {
  id: string;
  name?: string;
  email?: string;
  mobile?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const showToast = useToastStore(state => state.showToast);
  const { cart, clearCart } = useCartStore();
  
  const [localUser, setLocalUser] = useState<UserInfo | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'bank_transfer'>('online');
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [receiptImagePreview, setReceiptImagePreview] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize component
  useEffect(() => {
    setMounted(true);
    
    // Check for locally stored user info
    if (typeof window !== 'undefined') {
      try {
        const authToken = localStorage.getItem('auth_token');
        const userInfoStr = localStorage.getItem('user_info');
        
        if (authToken && userInfoStr) {
          const userInfo = JSON.parse(userInfoStr);
          setLocalUser({
            id: userInfo.id,
            name: userInfo.name || '',
            email: userInfo.email || '',
            mobile: userInfo.mobile || ''
          });
          // Fill in form with user info
          setFormData(prevData => ({
            ...prevData,
            fullName: userInfo.name || '',
            email: userInfo.email || '',
            mobile: userInfo.mobile || ''
          }));
        }
      } catch (error) {
        console.error('Error getting local user:', error);
      }
    }
  }, []);
  
  // Update form data when session changes
  useEffect(() => {
    if (session?.user) {
      setFormData(prevData => ({
        ...prevData,
        fullName: session.user.name || '',
        email: session.user.email || '',
        mobile: session.user.mobile || ''
      }));
    }
  }, [session]);
  
  // Check authentication and handle redirects
  useEffect(() => {
    if (!mounted || status === 'loading') return;
    
    // Redirect if not a customer
    if (status === 'authenticated' && session?.user?.type !== 'customer') {
      router.push('/auth/customer-login?callbackUrl=/checkout');
      return;
    }
    
    // Redirect if not authenticated
    if (status === 'unauthenticated' && !localUser) {
      router.push('/auth/customer-login?callbackUrl=/checkout');
      return;
    }
    
    // Redirect to cart if cart is empty
    if (cart.items.length === 0) {
      router.push('/cart');
    }
  }, [status, router, cart.items.length, mounted, localUser, session]);
  
  const handlePaymentMethodChange = (method: 'online' | 'bank_transfer') => {
    setPaymentMethod(method);
    // Reset receipt data when switching to online payment
    if (method === 'online') {
      setReceiptImage(null);
      setReceiptImagePreview(null);
      setUploadStatus('idle');
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError('لطفاً یک تصویر با فرمت PNG یا JPG انتخاب کنید.');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('حجم فایل نباید بیشتر از 5 مگابایت باشد.');
      return;
    }
    
    setError(null);
    setReceiptImage(file);
    
    // Create a preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);
    
    try {
      // Basic validation
      if (!formData.fullName || !formData.mobile || !formData.address || !formData.city || !formData.province || !formData.postalCode) {
        throw new Error('لطفاً تمام فیلدهای الزامی را پر کنید.');
      }
      
      // Check if cart is empty
      if (cart.items.length === 0) {
        throw new Error('سبد خرید شما خالی است.');
      }
      
      // Get seller ID from cart
      const sellerId = cart.items[0]?.product.sellerId;
      if (!sellerId) {
        throw new Error('اطلاعات فروشنده یافت نشد.');
      }
      
      // Create shipping address string
      const shippingAddress = 
        `${formData.fullName}, ${formData.mobile}, ${formData.province}, ${formData.city}, ${formData.address}, کدپستی: ${formData.postalCode}`;
      
      // Handle bank transfer with receipt upload
      let receiptInfo = null;
      if (paymentMethod === 'bank_transfer') {
        if (!receiptImage) {
          throw new Error('لطفاً تصویر فیش واریزی را آپلود کنید.');
        }
        
        setUploadStatus('uploading');
        try {
          // Upload receipt to private S3 bucket via server API
          receiptInfo = await uploadReceiptToS3(receiptImage, `orders/${Date.now()}`);
          setUploadStatus('success');
        } catch (uploadError) {
          console.error('Error uploading receipt:', uploadError);
          setUploadStatus('error');
          throw new Error('خطا در آپلود فیش واریزی. لطفاً دوباره تلاش کنید.');
        }
      }
      
      // Get auth token
      const authToken = localStorage.getItem('auth_token') || '';
      
      // Prepare order data
      const orderData = {
        customerData: {
          fullName: formData.fullName,
          email: formData.email,
          mobile: formData.mobile,
        },
        cartItems: cart.items,
        total: cart.total,
        sellerId,
        paymentMethod: paymentMethod === 'online' ? 'credit_card' : 'bank_transfer',
        shippingAddress,
        receiptInfo // Include receipt info for bank transfers
      };
      
      // Submit order
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(orderData)
      });
      
      // Parse response
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || result.message || 'خطا در ثبت سفارش');
      }
      
      // Store order number for success page
      if (result.orderNumber) {
        sessionStorage.setItem('last_order', result.orderNumber);
      }
      
      // Clear cart
      clearCart();
      
      // Show success message
      showToast('سفارش شما با موفقیت ثبت شد');
      
      // Redirect to success page
      router.push('/checkout/success');
      
    } catch (error) {
      console.error('Checkout error:', error);
      setError(error instanceof Error ? error.message : 'خطا در ثبت سفارش');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      maximumFractionDigits: 0
    }).format(price);
  };
  
  // Loading state
  if (!mounted || status === 'loading' || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  // Get current user from session or local storage
  const user = session?.user || localUser;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link 
          href="/cart" 
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <FiArrowLeft className="ml-2" />
          بازگشت به سبد خرید
        </Link>
      </div>
      
      <h1 className="text-2xl font-bold mb-8 text-gray-800">تکمیل سفارش</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-lg font-medium mb-4 text-gray-800">اطلاعات شخصی</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                    نام و نام خانوادگی *
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                  />
                </div>
                
                <div>
                  <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">
                    شماره موبایل *
                  </label>
                  <input
                    id="mobile"
                    name="mobile"
                    type="tel"
                    value={formData.mobile}
                    onChange={handleFormChange}
                    required
                    dir="ltr"
                    className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    ایمیل (اختیاری)
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    dir="ltr"
                    className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                    placeholder="example@email.com"
                  />
                </div>
              </div>
            </div>
            
            {/* Shipping Address */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-lg font-medium mb-4 text-gray-800">آدرس تحویل</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1">
                    استان *
                  </label>
                  <input
                    id="province"
                    name="province"
                    type="text"
                    value={formData.province}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                  />
                </div>
                
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    شهر *
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    آدرس کامل *
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleFormChange}
                    required
                    rows={3}
                    className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                  />
                </div>
                
                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                    کد پستی *
                  </label>
                  <input
                    id="postalCode"
                    name="postalCode"
                    type="text"
                    value={formData.postalCode}
                    onChange={handleFormChange}
                    required
                    dir="ltr"
                    className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                    placeholder="10 رقم بدون خط تیره"
                  />
                </div>
              </div>
            </div>
            
            {/* Payment Method */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-lg font-medium mb-4 text-gray-800">روش پرداخت</h2>
              
              <div className="space-y-4">
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                    paymentMethod === 'online' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => handlePaymentMethodChange('online')}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      paymentMethod === 'online' 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-gray-300'
                    } flex-shrink-0 ml-3`}></div>
                    <div className="flex items-center">
                      <FiCreditCard className="ml-2 text-gray-600" />
                      <div className="flex-grow">
                        <h3 className="font-medium text-gray-900">پرداخت آنلاین</h3>
                        <p className="text-sm text-gray-500">پرداخت آنلاین با تمامی کارت‌های بانکی عضو شتاب</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                    paymentMethod === 'bank_transfer' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => handlePaymentMethodChange('bank_transfer')}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      paymentMethod === 'bank_transfer' 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-gray-300'
                    } flex-shrink-0 ml-3`}></div>
                    <div className="flex items-center">
                      <FiDollarSign className="ml-2 text-gray-600" />
                      <div className="flex-grow">
                        <h3 className="font-medium text-gray-900">انتقال بانکی</h3>
                        <p className="text-sm text-gray-500">واریز به حساب و آپلود فیش پرداخت</p>
                      </div>
                    </div>
                  </div>
                  
                  {paymentMethod === 'bank_transfer' && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-700 mb-2">لطفا مبلغ <span className="font-bold">{formatPrice(cart.total)}</span> را به شماره حساب زیر واریز نمایید:</p>
                      <div className="bg-white p-3 rounded border border-gray-200 text-center mb-3">
                        <p className="font-bold text-gray-900 text-lg">IR06-0570-0123-4567-8901-2345-67</p>
                        <p className="text-sm text-gray-600">بانک ملت - به نام شرکت بایوسل</p>
                      </div>
                      
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          آپلود تصویر فیش واریزی:
                        </label>
                        
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/png, image/jpeg, image/jpg"
                          className="hidden"
                          aria-label="انتخاب فایل تصویر فیش واریزی"
                        />
                        
                        <div 
                          onClick={handleBrowseClick}
                          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                            receiptImagePreview ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-blue-300'
                          }`}
                        >
                          {receiptImagePreview ? (
                            <div className="relative">
                              <Image 
                                src={receiptImagePreview}
                                alt="پیش‌نمایش فیش" 
                                width={300}
                                height={200}
                                className="max-h-48 mx-auto object-contain rounded"
                              />
                              <p className="text-sm text-blue-600 mt-2">برای تغییر تصویر کلیک کنید</p>
                            </div>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <p className="mt-2 text-sm text-gray-600">تصویر فیش واریزی را اینجا بکشید و رها کنید یا کلیک کنید</p>
                              <p className="mt-1 text-xs text-gray-500">فرمت‌های مجاز: JPG و PNG (حداکثر 5 مگابایت)</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="mt-6">
              <button
                type="submit"
                disabled={isProcessing || (paymentMethod === 'bank_transfer' && !receiptImage)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg transition-colors duration-300 font-medium disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {uploadStatus === 'uploading' ? 'در حال آپلود فیش...' : 'در حال پردازش...'}
                  </span>
                ) : (
                  paymentMethod === 'online' ? 'پرداخت آنلاین و ثبت سفارش' : 'آپلود فیش و تکمیل سفارش'
                )}
              </button>
            </div>
          </form>
        </div>
        
        {/* Order Summary */}
        <div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 sticky top-4">
            <h2 className="text-lg font-medium mb-4 text-gray-800">خلاصه سفارش</h2>
            
            <div className="divide-y divide-gray-200">
              {cart.items.map((item) => (
                <div key={`${item.product.id}-${item.quantity}`} className="py-3 flex justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{item.product.title}</p>
                    <p className="text-sm text-gray-500">تعداد: {item.quantity}</p>
                  </div>
                  <p className="font-medium text-gray-800">
                    {formatPrice(item.product.price * item.quantity)}
                  </p>
                </div>
              ))}
              
              <div className="py-3">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-gray-600">جمع سبد خرید:</p>
                  <p className="font-medium">{formatPrice(cart.total)}</p>
                </div>
                
                <div className="flex justify-between items-center mb-2">
                  <p className="text-gray-600">هزینه ارسال:</p>
                  <p className="font-medium">رایگان</p>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
                  <p className="text-lg font-bold text-gray-800">مبلغ قابل پرداخت:</p>
                  <p className="text-lg font-bold text-blue-600">{formatPrice(cart.total)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 