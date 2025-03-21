import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/app/store/cart';
import { CustomerAddress } from '@/app/types';
import { FiPlus, FiCheck, FiChevronDown, FiChevronUp, FiEdit, FiX, FiStar } from 'react-icons/fi';
import { TbLoader } from 'react-icons/tb';

interface UserInfo {
  id?: string;
  name?: string;
  email?: string;
  mobile?: string;
}

interface CheckoutFormProps {
  user: UserInfo | undefined;
  updateUserData?: (field: string, value: string) => void;
}

interface CheckoutFormData {
  fullName: string;
  email: string;
  mobile: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  paymentMethod: 'credit_card' | 'cash_on_delivery';
  saveAddressAsDefault: boolean;
  deliveryMobile: string;
  customerNotes: string;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ user, updateUserData }) => {
  const router = useRouter();
  const { cart, clearCart } = useCartStore();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [showAddresses, setShowAddresses] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<CustomerAddress | null>(null);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [addressSuccess, setAddressSuccess] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    getValues
  } = useForm<CheckoutFormData>({
    defaultValues: {
      paymentMethod: 'credit_card',
      country: 'ایران',
      email: user?.email || '',
      fullName: user?.name || '',
      mobile: user?.mobile || '',
      deliveryMobile: user?.mobile || '',
      saveAddressAsDefault: false,
      customerNotes: ''
    }
  });
  
  // Fill form with selected address data
  const fillAddressForm = useCallback((address: CustomerAddress) => {
    setValue('fullName', address.fullName);
    setValue('deliveryMobile', address.mobile);
    setValue('province', address.province);
    setValue('city', address.city);
    setValue('postalCode', address.postalCode);
    setValue('address', address.address);
  }, [setValue]);
  
  // Fetch customer's addresses when component mounts
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        // Get token from localStorage with the correct key
        const token = localStorage.getItem('auth_token');
        if (!token) {
          console.log('No auth token found, user might not be logged in');
          return;
        }

        const response = await fetch(`/api/customer/addresses`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include' // Include credentials for session cookies
        });

        if (response.status === 401) {
          console.error('Unauthorized when fetching addresses - invalid or expired token');
          // Handle unauthorized error - could redirect to login or show message
          return;
        }

        if (response.ok) {
          const data = await response.json();
          
          if (data.addresses) {
            console.log('Addresses loaded:', data.addresses.length);
            setAddresses(data.addresses || []);
            
            // If there's a default address, select it
            const defaultAddress = data.addresses.find((addr: CustomerAddress) => addr.isDefault);
            if (defaultAddress) {
              setSelectedAddress(defaultAddress);
              fillAddressForm(defaultAddress);
            } else if (data.addresses.length > 0) {
              // Otherwise select the first address
              setSelectedAddress(data.addresses[0]);
              fillAddressForm(data.addresses[0]);
            } else {
              // No addresses, show the form to add a new one
              setIsAddingNewAddress(true);
            }
          } else {
            console.log('No addresses found in response');
            setIsAddingNewAddress(true);
          }
        } else {
          console.error('Failed to fetch addresses. Status:', response.status);
          const errorText = await response.text();
          console.error('Error details:', errorText);
        }
      } catch (error) {
        console.error('Error fetching addresses:', error);
      }
    };
    
    fetchAddresses();
  }, [user, fillAddressForm]);
  
  // Clear address form to add a new address
  const handleAddNewAddress = () => {
    setSelectedAddress(null);
    setIsAddingNewAddress(true);
    // Reset only address fields, keep other data
    setValue('address', '');
    setValue('city', '');
    setValue('province', '');
    setValue('postalCode', '');
    setValue('saveAddressAsDefault', addresses.length === 0); // اگر هیچ آدرسی وجود ندارد، به صورت پیش‌فرض این گزینه فعال باشد
    setShowAddresses(false);
  };
  
  // Handle selecting an address from the list
  const handleSelectAddress = (address: CustomerAddress) => {
    setSelectedAddress(address);
    setIsAddingNewAddress(false);
    fillAddressForm(address);
    setShowAddresses(false);
  };
  
  // Toggle address dropdown
  const toggleAddressDropdown = () => {
    setShowAddresses(!showAddresses);
  };
  
  // Update user profile with new information
  const updateUserProfile = async (data: { fullName: string, email: string }) => {
    try {
      // Get the auth token
      const authToken = localStorage.getItem('auth_token');
      
      if (!authToken) {
        console.log('No auth token found, skipping profile update');
        return;
      }
      
      // Set up headers with the token
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      };
      
      console.log('Updating user profile with token:', authToken ? 'token-present' : 'no-token');
      
      const response = await fetch('/api/customer/profile', {
        method: 'PATCH',
        headers,
        credentials: 'include', // Include credentials for session cookies
        body: JSON.stringify({
          fullName: data.fullName,
          email: data.email
          // Mobile is intentionally not included as it cannot be updated
        }),
      });
      
      if (response.ok) {
        console.log('User profile updated successfully');
        
        // If using localStorage user info, update the email there too
        if (typeof window !== 'undefined') {
          const userInfoStr = localStorage.getItem('user_info');
          if (userInfoStr) {
            try {
              const userInfo = JSON.parse(userInfoStr);
              localStorage.setItem('user_info', JSON.stringify({
                ...userInfo,
                email: data.email,
                name: data.fullName,
              }));
            } catch (error) {
              console.error('Error updating user info in localStorage:', error);
            }
          }
        }
      } else {
        console.error('Failed to update profile. Status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        // Don't throw an error, just log it - we want the checkout to continue
        console.log('Continuing with checkout despite profile update failure');
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      // Don't throw an error, just log it - we want the checkout to continue
    }
  };
  
  // Save address function
  const saveAddress = async () => {
    try {
      setIsSavingAddress(true);
      
      // Get auth token from localStorage
      const authToken = localStorage.getItem('auth_token');
      
      if (!authToken) {
        console.error('No auth token found for saving address');
        setAddressError('لطفا ابتدا وارد حساب کاربری خود شوید');
        return;
      }
      
      // Create address data from form values
      const addressData = {
        fullName: getValues('fullName'),
        mobile: getValues('deliveryMobile'),
        province: getValues('province'),
        city: getValues('city'),
        address: getValues('address'),
        postalCode: getValues('postalCode'),
        isDefault: true // Make this the default address
      };
      
      // Validate required fields
      if (!addressData.fullName || !addressData.mobile || !addressData.province || 
          !addressData.city || !addressData.address || !addressData.postalCode) {
        setAddressError('لطفا تمام فیلدهای آدرس را پر کنید');
        return;
      }
      
      // Send request to create new address
      const response = await fetch('/api/customer/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        credentials: 'include',
        body: JSON.stringify(addressData),
      });
      
      // Handle unauthorized response
      if (response.status === 401) {
        console.error('Unauthorized when saving address - invalid or expired token');
        setAddressError('مشکل در احراز هویت. لطفاً دوباره وارد شوید.');
        return;
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error saving address:', errorData);
        setAddressError(errorData.error || 'خطا در ذخیره آدرس');
        return;
      }
      
      // Get the saved address from response
      const savedAddress = await response.json();
      
      if (savedAddress && savedAddress.address) {
        // Add to addresses list and select it
        const newAddress = savedAddress.address;
        setAddresses([...addresses, newAddress]);
        setSelectedAddress(newAddress);
        
        // Close the form
        setIsAddingNewAddress(false);
        setAddressError('');
        
        // Show success message
        setAddressSuccess('آدرس با موفقیت ذخیره شد');
        setTimeout(() => setAddressSuccess(''), 3000);
      } else {
        setAddressError('خطا در ذخیره آدرس');
      }
    } catch (error) {
      console.error('Error saving address:', error);
      setAddressError('خطا در ذخیره آدرس');
    } finally {
      setIsSavingAddress(false);
    }
  };
  
  const onSubmit = async (data: CheckoutFormData) => {
    try {
      setSubmitError(null);

      // Check if cart is empty
      if (cart.items.length === 0) {
        setSubmitError('سبد خرید شما خالی است');
        return;
      }
      
      // Ensure user is logged in
      if (!user || !user.id) {
        setSubmitError('لطفا ابتدا وارد حساب کاربری خود شوید');
        return;
      }
      
      // Check if any product in the cart requires an address
      const requiresAddress = cart.items.some(item => item.product.requiresAddress);
      
      // Validate required fields for delivery only if any product requires an address
      if (requiresAddress && (!data.fullName || !data.deliveryMobile || !data.province || !data.city || !data.address || !data.postalCode)) {
        setSubmitError('لطفا تمام فیلدهای آدرس تحویل را کامل کنید');
        return;
      }

      // Validate postal code format (10 digits) only if address is required
      if (requiresAddress && data.postalCode && !/^\d{10}$/.test(data.postalCode)) {
        setSubmitError('کد پستی باید 10 رقم باشد');
        return;
      }

      // Get the seller ID from cart items
      const sellerId = cart.items[0]?.product.seller?.id;
      
      // Check if sellerId exists
      if (!sellerId) {
        setSubmitError('اطلاعات فروشنده یافت نشد');
        return;
      }
      
      // Update user profile if changed
      try {
        await updateUserProfile({
          fullName: data.fullName,
          email: data.email
        });
      } catch (error) {
        console.error('Error updating profile:', error);
        // Continue with order even if profile update fails
      }
      
      // For shipping address, use the deliveryMobile (only if required)
      // Create shipping address string
      const shippingAddressString = requiresAddress 
        ? `${data.fullName}, ${data.deliveryMobile}, ${data.province}, ${data.city}, ${data.address}, کدپستی: ${data.postalCode}`
        : '';
      
      // If adding a new address and address is required, save it first
      if (requiresAddress && isAddingNewAddress && user) {
        try {
          const addressData = {
            fullName: data.fullName,
            mobile: data.deliveryMobile, // Use deliveryMobile instead of mobile
            address: data.address,
            city: data.city,
            province: data.province,
            postalCode: data.postalCode,
            isDefault: data.saveAddressAsDefault
          };
          
          // Get auth token from localStorage
          let authToken = null;
          if (typeof window !== 'undefined') {
            authToken = localStorage.getItem('auth_token');
          }
          
          // Set up headers with token if available
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          };
          
          if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
          }
          
          const response = await fetch('/api/customer/addresses', {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify(addressData),
          });
          
          if (response.ok) {
            const result = await response.json();
            // Add new address to the list
            const newAddress = result.address;
            setAddresses(prev => [...prev, newAddress]);
            setSelectedAddress(newAddress);
          } else {
            // Get and display error message from server
            const errorData = await response.json();
            console.error('Error saving address:', errorData.error);
            setSubmitError(`خطا در ذخیره آدرس: ${errorData.error || 'دسترسی نامعتبر'}`);
            return; // Stop the order process if there's an error saving the address
          }
        } catch (error) {
          console.error('Error saving address:', error);
          // Handle address saving errors gracefully and allow the user
          // to continue with their order, even if address saving failed
          setSubmitError('هشدار: آدرس جدید ذخیره نشد، اما می‌توانید سفارش خود را ادامه دهید');
          // Don't stop the order process here, just warn the user
        }
      }
      
      // Prepare the order data
      const orderData = {
        customerData: {
          ...data,
          contactMobile: data.mobile, // The user's verified mobile
          deliveryMobile: data.deliveryMobile // The delivery mobile
        },
        cartItems: cart.items,
        total: cart.total,
        sellerId,
        paymentMethod: data.paymentMethod,
        userId: user?.id,
        shippingAddress: shippingAddressString,
        customerNotes: data.customerNotes || '', // Add customer notes to order data
        isExistingUser: true // Add flag to indicate this is an existing user
      };
      
      console.log('Order data:', orderData);
      
      // Submit the order
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        credentials: 'include',
        body: JSON.stringify(orderData),
      });
      
      let result;
      
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('خطا در پردازش پاسخ سرور');
      }
      
      if (!response.ok) {
        // Extract error message from different possible response formats
        const errorMessage = 
          result.error || 
          result.message || 
          (typeof result === 'string' ? result : 'خطا در ثبت سفارش');
        
        // Check specifically for duplicate customer error
        if (errorMessage.includes('Customer with this email or mobile already exists')) {
          // This shouldn't happen for logged-in users, handle it differently
          console.error('Duplicate customer error detected despite isExistingUser flag', result);
          throw new Error('خطا در سیستم: شناسایی کاربر امکان پذیر نیست. لطفا با پشتیبانی تماس بگیرید');
        }
        
        throw new Error(errorMessage);
      }
      
      // Check if order number is present in the response
      if (!result.orderNumber) {
        console.error('Order created but no order number returned:', result);
        throw new Error('سفارش ثبت شد اما شماره سفارش دریافت نشد');
      }
      
      // Store order number for the success page
      sessionStorage.setItem('last_order', result.orderNumber);
      
      // Clear the cart
      clearCart();
      
      // Redirect to success page
      router.push('/checkout/success');
      
    } catch (error) {
      console.error('Checkout error:', error);
      
      // Determine the type of error and provide a user-friendly message
      let errorMessage = 'خطا در ثبت سفارش. لطفا دوباره تلاش کنید.';
      
      if (error instanceof Error) {
        // Use specific error message if available
        errorMessage = error.message;
      }
      
      // Check for network error
      if (error instanceof TypeError && error.message.includes('network')) {
        errorMessage = 'اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید';
      }
      
      setSubmitError(errorMessage);
    }
  };
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      maximumFractionDigits: 0
    }).format(price);
  };
  
  // Handle email change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    // Update the form value
    setValue('email', newEmail);
    // Update user data in parent component if function is provided
    if (updateUserData) {
      updateUserData('email', newEmail);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-lg font-medium">اطلاعات تماس</h2>
        
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
            نام و نام خانوادگی
          </label>
          <input
            id="fullName"
            type="text"
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900 bg-white"
            {...register('fullName', { required: 'وارد کردن نام و نام خانوادگی الزامی است' })}
            aria-invalid={errors.fullName ? 'true' : 'false'}
          />
          {errors.fullName && (
            <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            ایمیل (اختیاری)
          </label>
          <input
            id="email"
            type="email"
            dir="ltr"
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900 bg-white"
            {...register('email', {
              required: false, 
              pattern: {
                value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i,
                message: 'لطفا یک ایمیل معتبر وارد کنید'
              }
            })}
            aria-invalid={errors.email ? 'true' : 'false'}
            onChange={handleEmailChange}
            placeholder="example@email.com (اختیاری)"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">
            شماره تماس
          </label>
          <div className="w-full rounded-md border border-gray-300 px-4 py-2 bg-gray-50 text-gray-700">
            {watch('mobile')}
          </div>
          <input
            type="hidden"
            {...register('mobile')}
          />
          <p className="mt-1 text-xs text-gray-500">
            شماره تماس تایید شده و قابل تغییر نیست
          </p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium">آدرس تحویل</h2>
          {addresses.length > 0 && !isAddingNewAddress && (
            <button 
              type="button" 
              onClick={toggleAddressDropdown}
              className="text-blue-500 text-sm flex items-center"
            >
              انتخاب از آدرس‌های قبلی
              {showAddresses ? <FiChevronUp className="mr-1" /> : <FiChevronDown className="mr-1" />}
            </button>
          )}
        </div>
        
        {/* نمایش لیست آدرس‌ها */}
        {addresses.length > 0 && showAddresses && (
          <div className="bg-gray-50 p-3 rounded-md border border-gray-200 mb-4">
            <p className="text-sm text-gray-600 mb-2">آدرس‌های ذخیره شده</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {addresses.map((address) => (
                <div 
                  key={address.id} 
                  className={`p-3 rounded-md border cursor-pointer ${selectedAddress?.id === address.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-100'}`}
                  onClick={() => handleSelectAddress(address)}
                >
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      {selectedAddress?.id === address.id && <FiCheck className="text-blue-500 ml-2" />}
                      <span className="font-medium">{address.fullName}</span>
                    </div>
                    {address.isDefault && (
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded flex items-center">
                        <FiStar className="ml-1 w-3 h-3" />
                        پیش‌فرض
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{address.province}، {address.city}، {address.address}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    کد پستی: {address.postalCode} | شماره تماس: {address.mobile}
                  </p>
                </div>
              ))}
            </div>
            <button 
              type="button" 
              onClick={handleAddNewAddress}
              className="mt-3 w-full py-2 flex items-center justify-center text-sm text-blue-500 border border-blue-500 rounded-md hover:bg-blue-50"
            >
              <FiPlus className="ml-1" />
              افزودن آدرس جدید
            </button>
          </div>
        )}
        
        {/* نمایش آدرس انتخاب شده */}
        {selectedAddress && !isAddingNewAddress && !showAddresses && (
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center">
                  <h3 className="font-medium">{selectedAddress.fullName}</h3>
                  {selectedAddress.isDefault && (
                    <span className="mr-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded flex items-center">
                      <FiStar className="ml-1 w-3 h-3" />
                      پیش‌فرض
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{selectedAddress.province}، {selectedAddress.city}، {selectedAddress.address}</p>
                <p className="text-sm text-gray-600 mt-1">کد پستی: {selectedAddress.postalCode}</p>
                <p className="text-sm text-gray-600 mt-1">شماره تماس: {selectedAddress.mobile}</p>
              </div>
              <div className="flex space-x-2 space-x-reverse">
                <button 
                  type="button"
                  onClick={toggleAddressDropdown}
                  className="p-1 text-gray-500 hover:text-blue-500"
                  aria-label="تغییر آدرس"
                >
                  <FiEdit className="w-5 h-5" />
                </button>
                <button 
                  type="button"
                  onClick={handleAddNewAddress}
                  className="p-1 text-gray-500 hover:text-blue-500"
                  aria-label="افزودن آدرس جدید"
                >
                  <FiPlus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* فرم افزودن آدرس جدید */}
        {isAddingNewAddress && (
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
            <h3 className="text-md font-medium mb-3">افزودن آدرس جدید</h3>
            
            {addressError && (
              <div className="bg-red-50 text-red-600 p-2 rounded mb-3 text-sm">
                {addressError}
              </div>
            )}
            
            {addressSuccess && (
              <div className="bg-green-50 text-green-600 p-2 rounded mb-3 text-sm">
                {addressSuccess}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  نام و نام خانوادگی
                </label>
                <input
                  id="fullName"
                  {...register('fullName')}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              
              <div>
                <label htmlFor="deliveryMobile" className="block text-sm font-medium text-gray-700 mb-1">
                  شماره تماس تحویل گیرنده
                </label>
                <input
                  id="deliveryMobile"
                  {...register('deliveryMobile')}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="09123456789"
                />
                <p className="mt-1 text-xs text-gray-500">
                  می‌توانید برای تحویل، شماره تماس متفاوتی وارد کنید
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1">
                  استان
                </label>
                <input
                  id="province"
                  {...register('province')}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  شهر
                </label>
                <input
                  id="city"
                  {...register('city')}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                آدرس کامل
              </label>
              <textarea
                id="address"
                {...register('address')}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                کد پستی
              </label>
              <input
                id="postalCode"
                {...register('postalCode')}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="10 رقم بدون خط تیره"
              />
            </div>
            
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setIsAddingNewAddress(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                انصراف
              </button>
              
              <button
                type="button"
                onClick={saveAddress}
                disabled={isSavingAddress}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {isSavingAddress ? (
                  <>
                    <span className="ml-2">در حال ذخیره...</span>
                    <TbLoader className="animate-spin" />
                  </>
                ) : (
                  'ذخیره آدرس'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">توضیحات تکمیلی</h3>
        
        <div className="mb-4">
          <label htmlFor="customerNotes" className="block text-sm font-medium text-gray-700 mb-1">
            توضیحات سفارش (اختیاری)
          </label>
          <textarea
            id="customerNotes"
            {...register('customerNotes')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="اگر توضیح خاصی برای سفارش خود دارید، اینجا بنویسید"
          />
        </div>
      </div>
      
      <div className="border-t border-gray-200 pt-6">
        <div className="flex justify-between text-base font-medium text-gray-900 mb-2">
          <p>جمع محصولات</p>
          <p>{formatPrice(cart.total)}</p>
        </div>
        <div className="flex justify-between text-base font-medium text-gray-500 mb-2">
          <p>هزینه ارسال</p>
          <p>رایگان</p>
        </div>
        <div className="flex justify-between text-lg font-bold text-gray-900 mb-6">
          <p>مجموع</p>
          <p>{formatPrice(cart.total)}</p>
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-70 flex items-center justify-center"
          aria-label="ثبت سفارش"
          tabIndex={0}
        >
          {isSubmitting ? (
            <>
              <TbLoader className="animate-spin ml-2" />
              <span>در حال پردازش...</span>
            </>
          ) : 'ثبت سفارش و پرداخت آنلاین'}
        </button>
        
        {submitError && (
          <div className="mt-4 p-3 text-sm text-white bg-red-500 rounded-md text-center flex items-center justify-center">
            <FiX className="ml-2" />
            {submitError}
          </div>
        )}
      </div>
    </form>
  );
};

export default CheckoutForm; 