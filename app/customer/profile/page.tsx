'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TbUserCircle, TbPhone, TbMail, TbMapPin, TbLoader, TbCheck, TbMapSearch, TbPlus, TbEdit, TbTrash, TbStar, TbCheck as TbCheckIcon } from 'react-icons/tb';
import { CustomerAddress } from '@/app/types';
import { useSession } from 'next-auth/react';
import { useToastStore } from '@/app/store/toast';

// تبدیل اعداد فارسی به انگلیسی
const convertPersianToEnglish = (input: string): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  
  let result = input;
  for (let i = 0; i < 10; i++) {
    const regex = new RegExp(persianDigits[i], 'g');
    result = result.replace(regex, englishDigits[i]);
  }
  
  return result;
};

// تعریف طرح اعتبارسنجی فرم با zod
const profileSchema = z.object({
  fullName: z.string().min(3, 'نام و نام خانوادگی باید حداقل ۳ کاراکتر باشد'),
  email: z.string().email('ایمیل معتبر نیست').optional().or(z.literal('')),
  mobile: z.string().optional(), // Make mobile optional since we're not updating it
});

const addressSchema = z.object({
  id: z.string().optional(),
  fullName: z.string().min(3, 'نام و نام خانوادگی باید حداقل ۳ کاراکتر باشد'),
  mobile: z.string().regex(/^09[0-9]{9}$/, 'شماره موبایل معتبر نیست'),
  province: z.string().min(2, 'استان را وارد کنید'),
  city: z.string().min(2, 'شهر را وارد کنید'),
  address: z.string().min(10, 'آدرس باید حداقل ۱۰ کاراکتر باشد').max(300, 'آدرس حداکثر ۳۰۰ کاراکتر مجاز است'),
  postalCode: z.string().regex(/^[0-9]{10}$/, 'کد پستی باید ۱۰ رقم باشد'),
  isDefault: z.boolean().default(false),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type AddressFormValues = z.infer<typeof addressSchema>;

export default function CustomerProfile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null);
  const [addressChars, setAddressChars] = useState(0);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<CustomerAddress | null>(null);
  const [addressSaveStatus, setAddressSaveStatus] = useState<'success' | 'error' | null>(null);
  const [addressErrorMessage, setAddressErrorMessage] = useState<string>('');
  const [isAddressSaving, setIsAddressSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // اضافه کردن showToast
  const showToast = useToastStore(state => state.showToast);

  // تنظیمات فرم با react-hook-form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
      email: '',
      mobile: '',
    },
  });

  // تنظیمات فرم آدرس با react-hook-form
  const {
    register: registerAddress,
    handleSubmit: handleSubmitAddress,
    reset: resetAddress,
    watch: watchAddress,
    setValue: setAddressValue,
    formState: { errors: addressErrors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      fullName: '',
      mobile: '',
      province: '',
      city: '',
      address: '',
      postalCode: '',
      isDefault: false,
    },
  });

  // نظارت بر تعداد کاراکترهای آدرس
  const addressValue = watchAddress('address');
  useEffect(() => {
    if (addressValue) {
      setAddressChars(addressValue.length);
    } else {
      setAddressChars(0);
    }
  }, [addressValue]);

  // افزودن یک useEffect جدید برای کنترل وضعیت احراز هویت
  useEffect(() => {
    if (status === 'loading') {
      // در حال بارگذاری، منتظر می‌مانیم
      return;
    }
    
    if (status === 'unauthenticated') {
      setAuthError('لطفاً برای دسترسی به پروفایل خود وارد شوید');
      
      // حذف توکن‌های محلی برای جلوگیری از لوپ ریدایرکت
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
      
      // تاخیر کوتاه برای نمایش پیام به کاربر
      const redirectTimer = setTimeout(() => {
        router.push(`/auth/customer-login?redirectUrl=${encodeURIComponent('/customer/profile')}`);
      }, 2000);
      
      return () => clearTimeout(redirectTimer);
    } else if (status === 'authenticated') {
      setAuthError(null);
    }
  }, [status, router]);

  // دریافت آدرس‌های کاربر
  const fetchAddresses = useCallback(async () => {
    try {
      // Check if we have a token first
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.warn('No authentication token found when fetching addresses');
        return; // Return early if no token
      }
      
      // Add a timeout to the fetch to avoid hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch('/api/customer/addresses', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        credentials: 'include',
        signal: controller.signal
      }).catch(err => {
        // Handle network errors
        console.error('Network error when fetching addresses:', err);
        clearTimeout(timeoutId);
        return null;
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      // Handle network error
      if (!response) {
        console.error('Failed to fetch addresses - network error');
        return;
      }
      
      // Handle unauthorized response
      if (response.status === 401) {
        console.error('Unauthorized when fetching addresses - invalid or expired token');
        setAuthError('مشکل در احراز هویت. لطفاً دوباره وارد شوید.');
        
        // Clear token after a short delay and redirect to login
        setTimeout(() => {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_info');
          router.push('/auth/customer-login');
        }, 1000);
        
        return;
      }
      
      // Handle other error responses
      if (!response.ok) {
        try {
          // First check if response has content
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const text = await response.text();
            if (text) {
              try {
                const errorData = JSON.parse(text);
                console.error('Error fetching addresses:', errorData);
              } catch (parseError) {
                console.error('Error parsing JSON error response:', parseError);
                console.error('Raw error text:', text);
              }
            } else {
              console.error('Error fetching addresses: Empty response');
            }
          } else {
            console.error(`Error fetching addresses: Non-JSON response (${response.status} ${response.statusText})`);
            console.error('Content-Type:', contentType);
          }
        } catch (jsonError) {
          console.error('Error processing error response:', jsonError);
        }
        return;
      }
      
      // Parse and set addresses
      try {
        // Using text() first to handle empty responses gracefully
        const text = await response.text();
        if (!text || text.trim() === '') {
          console.error('Empty response when fetching addresses');
          return;
        }
        
        try {
          const data = JSON.parse(text);
          
          if (data && data.addresses) {
            setAddresses(data.addresses);
          } else {
            console.error('Invalid response format:', data);
          }
        } catch (parseError) {
          console.error('Error parsing addresses response:', parseError);
          console.error('Raw response text:', text);
        }
      } catch (error) {
        console.error('Error reading response text:', error);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  }, [router, setAuthError, setAddresses]);

  // دریافت اطلاعات کاربر و آدرس‌ها
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
          console.warn("No authentication token found");
          return;
        }
        
        const response = await fetch('/api/customer/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          credentials: 'include'
        });
        
        // بررسی خطای احراز هویت
        if (response.status === 401) {
          setAuthError('مشکل در احراز هویت. لطفاً دوباره وارد شوید.');
          
          // پاک کردن توکن و انتقال به صفحه ورود
          setTimeout(() => {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_info');
            router.push('/auth/customer-login');
          }, 1000);
          
          return;
        }
        
        // بررسی سایر خطاها
        if (!response.ok) {
          try {
            const errorData = await response.json();
            console.error("Error fetching user data:", errorData);
          } catch (error) {
            console.error("Error parsing error response:", error);
          }
          return;
        }
        
        const userData = await response.json();
        
        // تنظیم مقادیر فرم
        reset({
          fullName: userData.fullName || '',
          email: userData.email || '',
          mobile: userData.mobile || '',
        });

        // دریافت آدرس‌های کاربر
        await fetchAddresses();
        
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [session, reset, status, fetchAddresses, router]);

  // ذخیره اطلاعات کاربر
  const onSubmit = async (data: ProfileFormValues) => {
    setIsSaving(true);
    setSaveStatus(null);

    try {
      // گرفتن توکن از localStorage
      const token = localStorage.getItem('auth_token');
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      // اضافه کردن توکن به هدرها اگر موجود باشد
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // ارسال اطلاعات به API
      const response = await fetch('/api/customer/profile', {
        method: 'PATCH',
        headers,
        credentials: 'include', // اضافه کردن credentials برای ارسال کوکی‌های session
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('خطا در بروزرسانی پروفایل');
      }

      setSaveStatus('success');
      setTimeout(() => {
        setSaveStatus(null);
      }, 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  // ذخیره آدرس یا بروزرسانی آدرس
  const onSubmitAddress = async (data: AddressFormValues) => {
    if (isAddressSaving) return;
    
    setIsAddressSaving(true);
    setAddressSaveStatus(null);
    setAddressErrorMessage('');
    
    try {
      // Check if user is authenticated
      if (authError) {
        throw new Error('لطفا مجددا وارد شوید');
      }
      
      // Get token from localStorage
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        throw new Error('لطفا مجددا وارد شوید');
      }
      
      // Headers with authorization
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      
      // Determine if this is an update or a new address
      const isUpdate = !!data.id;
      
      // API endpoint and method
      const url = isUpdate 
        ? `/api/customer/addresses?id=${data.id}` 
        : '/api/customer/addresses';
      
      const method = isUpdate ? 'PATCH' : 'POST';
      
      // Make the API request
      const response = await fetch(url, {
        method,
        headers,
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      // Handle unauthorized response
      if (response.status === 401) {
        setAuthError('نشست شما منقضی شده است. لطفا دوباره وارد شوید.');
        throw new Error('نشست شما منقضی شده است. لطفا دوباره وارد شوید.');
      }
      
      // Handle other error responses
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'خطا در ذخیره آدرس');
      }
      
      // Success - refresh addresses
      await fetchAddresses();
      
      // Reset form and UI
      setShowAddressForm(false);
      resetAddress();
      setCurrentAddress(null);
      
    } catch (error: Error | unknown) {
      console.error('Error saving address:', error);
      setAddressSaveStatus('error');
      setAddressErrorMessage(error instanceof Error ? error.message : 'خطا در ذخیره آدرس');
    } finally {
      setIsAddressSaving(false);
    }
  };

  // حذف آدرس
  const handleDeleteAddress = async (id: string) => {
    // Confirm before deleting
    if (!confirm('آیا از حذف این آدرس اطمینان دارید؟')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }
      
      const response = await fetch(`/api/customer/addresses?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (response.status === 401) {
        setAuthError('مشکل در احراز هویت. لطفاً دوباره وارد شوید.');
        
        // پاک کردن توکن و انتقال به صفحه ورود
        setTimeout(() => {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_info');
          router.push('/auth/customer-login');
        }, 1000);
        
        return;
      }
      
      if (!response.ok) {
        try {
          const errorData = await response.json();
          console.error('Error deleting address:', errorData);
        } catch (error) {
          console.error('Error parsing error response:', error);
        }
        showToast('خطا در حذف آدرس', [
          {
            label: 'تلاش مجدد',
            onClick: () => handleDeleteAddress(id)
          },
          {
            label: 'بستن',
            onClick: () => useToastStore.getState().hideToast()
          }
        ]);
        return;
      }
      
      // بروزرسانی لیست آدرس‌ها
      await fetchAddresses();
      
      showToast('آدرس با موفقیت حذف شد', [
        {
          label: 'بستن',
          onClick: () => useToastStore.getState().hideToast()
        }
      ]);
    } catch (error) {
      console.error('Error deleting address:', error);
      showToast('خطا در حذف آدرس', [
        {
          label: 'تلاش مجدد',
          onClick: () => handleDeleteAddress(id)
        },
        {
          label: 'بستن',
          onClick: () => useToastStore.getState().hideToast()
        }
      ]);
    } finally {
      setIsDeleting(false);
    }
  };
  
  // تغییر آدرس پیش‌فرض
  const handleSetDefaultAddress = async (id: string) => {
    try {
      setIsLoading(true);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }
      
      console.log(`Setting address ${id} as default`);
      
      const response = await fetch(`/api/customer/addresses?id=${id}&default=true`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({ isDefault: true })
      });
      
      if (response.status === 401) {
        setAuthError('مشکل در احراز هویت. لطفاً دوباره وارد شوید.');
        
        // پاک کردن توکن و انتقال به صفحه ورود
        setTimeout(() => {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_info');
          router.push('/auth/customer-login');
        }, 1000);
        
        return;
      }
      
      if (!response.ok) {
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const text = await response.text();
            if (text) {
              try {
                const errorData = JSON.parse(text);
                console.error('Error setting default address:', errorData);
              } catch (parseError) {
                console.error('Error parsing JSON error response:', parseError);
                console.error('Raw error text:', text);
              }
            } else {
              console.error(`Error setting default address: Empty response (Status: ${response.status})`);
            }
          } else {
            console.error(`Error setting default address: Non-JSON response (${response.status} ${response.statusText})`);
            console.error('Content-Type:', contentType);
          }
        } catch (error) {
          console.error('Error processing error response:', error);
        }
        showToast('مشکلی در تغییر آدرس پیش‌فرض رخ داد', [
          {
            label: 'تلاش مجدد',
            onClick: () => handleSetDefaultAddress(id)
          },
          {
            label: 'بستن',
            onClick: () => useToastStore.getState().hideToast()
          }
        ]);
        return;
      }
      
      // بروزرسانی لیست آدرس‌ها
      await fetchAddresses();
      
      showToast('آدرس پیش‌فرض با موفقیت تغییر کرد', [
        {
          label: 'باشه',
          onClick: () => useToastStore.getState().hideToast()
        }
      ]);
    } catch (error) {
      console.error('Error setting default address:', error);
      showToast('مشکلی در تغییر آدرس پیش‌فرض رخ داد', [
        {
          label: 'تلاش مجدد',
          onClick: () => handleSetDefaultAddress(id)
        },
        {
          label: 'بستن',
          onClick: () => useToastStore.getState().hideToast()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // ویرایش آدرس
  const handleEditAddress = (address: CustomerAddress) => {
    setCurrentAddress(address);
    setAddressValue('id', address.id);
    setAddressValue('fullName', address.fullName);
    setAddressValue('mobile', address.mobile);
    setAddressValue('province', address.province);
    setAddressValue('city', address.city);
    setAddressValue('address', address.address);
    setAddressValue('postalCode', address.postalCode);
    setAddressValue('isDefault', address.isDefault);
    setShowAddressForm(true);
  };

  // اضافه کردن آدرس جدید
  const handleAddNewAddress = () => {
    setCurrentAddress(null);
    resetAddress({
      id: undefined,
      fullName: '',
      mobile: '',
      province: '',
      city: '',
      address: '',
      postalCode: '',
      isDefault: addresses.length === 0 // اگر اولین آدرس است، آن را پیش‌فرض قرار بده
    });
    setShowAddressForm(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // اضافه کردن این بخش برای نمایش پیام خطای احراز هویت
  if (authError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 text-lg font-medium mb-3">{authError}</div>
          <p className="text-gray-700 mb-4">در حال انتقال به صفحه ورود...</p>
          <button
            onClick={() => router.push('/auth/customer-login?redirectUrl=/customer/profile')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            ورود به حساب کاربری
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ویرایش پروفایل</h1>
        <div className="mt-4 md:mt-0">
          <Link
            href="/customer/dashboard"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            بازگشت به داشبورد
          </Link>
        </div>
      </div>

      {/* اطلاعات شخصی */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center ml-4">
                <TbUserCircle className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-medium text-gray-900">اطلاعات شخصی</h2>
                <p className="text-sm text-gray-500">اطلاعات شخصی خود را ویرایش کنید</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* نام و نام خانوادگی */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  نام و نام خانوادگی
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <TbUserCircle className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="fullName"
                    className={`block w-full pr-10 pl-4 py-2 border ${
                      errors.fullName ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-md shadow-sm sm:text-sm`}
                    placeholder="نام و نام خانوادگی خود را وارد کنید"
                    {...register('fullName')}
                  />
                </div>
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
                )}
              </div>

              {/* موبایل */}
              <div>
                <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">
                  شماره موبایل
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <TbPhone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="mobile"
                    className="block w-full pr-10 pl-4 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm bg-gray-50 cursor-not-allowed"
                    placeholder="شماره موبایل خود را وارد کنید"
                    dir="ltr"
                    {...register('mobile')}
                    readOnly
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">شماره موبایل قابل تغییر نیست زیرا برای احراز هویت استفاده می‌شود.</p>
                {errors.mobile && (
                  <p className="mt-1 text-sm text-red-600">{errors.mobile.message}</p>
                )}
              </div>

              {/* ایمیل */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  ایمیل (اختیاری)
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <TbMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    className={`block w-full pr-10 pl-4 py-2 border ${
                      errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-md shadow-sm sm:text-sm`}
                    placeholder="ایمیل خود را وارد کنید"
                    dir="ltr"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* دکمه‌های عملیات */}
          <div className="px-6 py-4 bg-gray-50 flex items-center justify-end">
            {saveStatus === 'success' && (
              <div className="flex items-center text-green-600 ml-4">
                <TbCheck className="h-5 w-5 ml-1" />
                <span className="text-sm">اطلاعات با موفقیت ذخیره شد</span>
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="text-red-600 ml-4 text-sm">
                خطا در ذخیره اطلاعات. لطفاً دوباره تلاش کنید.
              </div>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <TbLoader className="animate-spin ml-2 h-4 w-4" />
                  در حال ذخیره...
                </>
              ) : (
                'ذخیره تغییرات'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* مدیریت آدرس‌ها */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-l from-blue-50 to-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center ml-4 shadow-sm">
                <TbMapPin className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">آدرس‌های تحویل</h2>
                <p className="text-sm text-gray-600 mt-1">آدرس‌های محل تحویل سفارش‌های خود را مدیریت کنید</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddNewAddress}
              className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <TbPlus className="ml-1.5 h-5 w-5" />
              افزودن آدرس جدید
            </button>
          </div>

          {/* لیست آدرس‌ها */}
          {addresses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 my-6 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <TbMapSearch className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">آدرسی ثبت نشده است</h3>
              <p className="mt-2 text-sm text-gray-600 max-w-md text-center">
                برای تکمیل سفارش نیاز به ثبت آدرس دارید. لطفاً با کلیک روی دکمه «افزودن آدرس جدید» یک آدرس اضافه کنید.
              </p>
              <button
                type="button"
                onClick={handleAddNewAddress}
                className="mt-6 inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <TbPlus className="ml-2 h-5 w-5" />
                افزودن آدرس جدید
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className={`border ${
                    address.isDefault ? 'border-blue-500 shadow-sm' : 'border-gray-200'
                  } rounded-lg p-5 relative hover:shadow-md transition-all duration-200`}
                >
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    {/* اطلاعات آدرس */}
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-gray-800">{address.fullName}</h3>
                        {address.isDefault && (
                          <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full flex items-center">
                            <TbStar className="ml-1 h-3 w-3" />
                            پیش‌فرض
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 flex items-center gap-1.5">
                        <TbPhone className="h-4 w-4 opacity-70" />
                        {address.mobile}
                      </p>
                      <p className="text-sm mt-3 text-gray-700 flex items-start gap-1.5">
                        <TbMapPin className="h-4 w-4 mt-0.5 opacity-70 flex-shrink-0" />
                        <span>{address.province}، {address.city}، {address.address}</span>
                      </p>
                      <p className="text-sm text-gray-600 mt-2 flex items-center gap-1.5">
                        <span className="inline-block w-4 h-4 opacity-0"></span>
                        <span>کد پستی: {address.postalCode}</span>
                      </p>
                    </div>
                    
                    {/* دکمه‌های عملیات */}
                    <div className="flex md:flex-col gap-2 mt-3 md:mt-0">
                      {!address.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultAddress(address.id)}
                          className="inline-flex items-center justify-center px-3 py-1.5 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                          title="تنظیم به عنوان پیش‌فرض"
                        >
                          <TbStar className="h-4 w-4 ml-1" />
                          <span className="hidden sm:inline">پیش‌فرض</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleEditAddress(address)}
                        className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        title="ویرایش"
                      >
                        <TbEdit className="h-4 w-4 ml-1" />
                        <span className="hidden sm:inline">ویرایش</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(address.id)}
                        disabled={isDeleting}
                        className="inline-flex items-center justify-center px-3 py-1.5 border border-rose-300 rounded-md text-sm font-medium text-rose-700 bg-white hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="حذف"
                      >
                        <TbTrash className="h-4 w-4 ml-1" />
                        <span className="hidden sm:inline">حذف</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* فرم افزودن/ویرایش آدرس */}
          {showAddressForm && (
            <div className="mt-8 p-4 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-medium mb-4">
                {currentAddress ? 'ویرایش آدرس' : 'افزودن آدرس جدید'}
              </h3>
              <form onSubmit={handleSubmitAddress(onSubmitAddress)}>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* نام و نام خانوادگی گیرنده */}
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                      نام و نام خانوادگی گیرنده
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      className={`block w-full px-4 py-2 border ${
                        addressErrors.fullName ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      } rounded-md shadow-sm sm:text-sm`}
                      placeholder="نام و نام خانوادگی گیرنده را وارد کنید"
                      {...registerAddress('fullName')}
                    />
                    {addressErrors.fullName && (
                      <p className="mt-1 text-sm text-red-600">{addressErrors.fullName.message}</p>
                    )}
                  </div>

                  {/* شماره تماس گیرنده */}
                  <div>
                    <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">
                      شماره تماس گیرنده
                    </label>
                    <input
                      type="text"
                      id="mobile"
                      className={`block w-full px-4 py-2 border ${
                        addressErrors.mobile ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      } rounded-md shadow-sm sm:text-sm`}
                      placeholder="شماره تماس گیرنده را وارد کنید"
                      dir="ltr"
                      {...registerAddress('mobile', {
                        onChange: (e) => {
                          const englishValue = convertPersianToEnglish(e.target.value);
                          if (englishValue !== e.target.value) {
                            e.target.value = englishValue;
                          }
                        }
                      })}
                    />
                    {addressErrors.mobile && (
                      <p className="mt-1 text-sm text-red-600">{addressErrors.mobile.message}</p>
                    )}
                  </div>

                  {/* استان */}
                  <div>
                    <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1">
                      استان
                    </label>
                    <input
                      type="text"
                      id="province"
                      className={`block w-full px-4 py-2 border ${
                        addressErrors.province ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      } rounded-md shadow-sm sm:text-sm`}
                      placeholder="استان را وارد کنید"
                      {...registerAddress('province')}
                    />
                    {addressErrors.province && (
                      <p className="mt-1 text-sm text-red-600">{addressErrors.province.message}</p>
                    )}
                  </div>

                  {/* شهر */}
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      شهر
                    </label>
                    <input
                      type="text"
                      id="city"
                      className={`block w-full px-4 py-2 border ${
                        addressErrors.city ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      } rounded-md shadow-sm sm:text-sm`}
                      placeholder="شهر را وارد کنید"
                      {...registerAddress('city')}
                    />
                    {addressErrors.city && (
                      <p className="mt-1 text-sm text-red-600">{addressErrors.city.message}</p>
                    )}
                  </div>

                  {/* کد پستی */}
                  <div>
                    <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                      کد پستی
                    </label>
                    <input
                      type="text"
                      id="postalCode"
                      className={`block w-full px-4 py-2 border ${
                        addressErrors.postalCode ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      } rounded-md shadow-sm sm:text-sm`}
                      placeholder="کد پستی را وارد کنید"
                      dir="ltr"
                      {...registerAddress('postalCode', {
                        onChange: (e) => {
                          const englishValue = convertPersianToEnglish(e.target.value);
                          if (englishValue !== e.target.value) {
                            e.target.value = englishValue;
                          }
                        }
                      })}
                    />
                    {addressErrors.postalCode && (
                      <p className="mt-1 text-sm text-red-600">{addressErrors.postalCode.message}</p>
                    )}
                  </div>

                  {/* آدرس پیش‌فرض */}
                  <div className="md:col-span-2 flex items-center">
                    <input
                      type="checkbox"
                      id="isDefault"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ml-2"
                      {...registerAddress('isDefault')}
                    />
                    <label htmlFor="isDefault" className="text-sm text-gray-700">
                      استفاده از این آدرس به عنوان آدرس پیش‌فرض
                    </label>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-6">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    آدرس کامل
                  </label>
                  <span className="text-xs text-gray-500">
                    {addressChars}/300 کاراکتر
                  </span>
                </div>
                <textarea
                  id="address"
                  rows={3}
                  maxLength={300}
                  className={`mt-1 block w-full py-2 px-4 border ${
                    addressErrors.address ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } rounded-md shadow-sm sm:text-sm`}
                  placeholder="آدرس کامل را وارد کنید"
                  {...registerAddress('address')}
                />
                {addressErrors.address && (
                  <p className="mt-1 text-sm text-red-600">{addressErrors.address.message}</p>
                )}

                <div className="mt-6 flex justify-end space-x-3 space-x-reverse">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddressForm(false);
                      setCurrentAddress(null);
                      resetAddress();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={isAddressSaving}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {isAddressSaving ? (
                      <>
                        <TbLoader className="animate-spin ml-2 h-4 w-4" />
                        در حال ذخیره...
                      </>
                    ) : (
                      <>
                        <TbCheckIcon className="ml-2 h-4 w-4" />
                        {currentAddress ? 'بروزرسانی آدرس' : 'ذخیره آدرس'}
                      </>
                    )}
                  </button>
                </div>

                {addressSaveStatus === 'success' && (
                  <div className="mt-4 flex items-center text-green-600">
                    <TbCheck className="h-5 w-5 ml-1" />
                    <span className="text-sm">آدرس با موفقیت ذخیره شد</span>
                  </div>
                )}
                {addressSaveStatus === 'error' && (
                  <div className="mt-4 text-red-600 text-sm">
                    {addressErrorMessage}
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 