'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { XCircle, Upload, Loader2, CheckCircle } from 'lucide-react';
import Image from "next/image";

interface ProductImage {
  id?: string;
  imageUrl?: string; // For existing images
  file?: File;  // For file uploads
  preview: string;
  isNew?: boolean; // To track if it's a new upload
}

interface ProductImageData {
  id: string;
  imageUrl: string;
}

interface ProductFormData {
  title: string;
  description: string;
  price: string;
  inventory: string;
  isActive: boolean;
  images: ProductImage[];
  shopId: string; // Main shop ID
  shopIds: string[]; // Additional shop IDs for display in multiple shops
}

/**
 * ProductEditPage component for editing product details
 * 
 * NOTE: This is a client component that uses useParams() hook.
 * In server components, future versions of Next.js will require unwrapping params with React.use()
 * but that's not applicable here since we're using the client-side hook.
 */
export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;
  const { status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    description: '',
    price: '',
    inventory: '0',
    isActive: true,
    images: [],
    shopId: '',
    shopIds: []
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [hasPendingSubscription, setHasPendingSubscription] = useState<boolean>(false);
  const [pendingSubscriptionStatus, setPendingSubscriptionStatus] = useState<string | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [shops, setShops] = useState<{ id: string; shopName: string; isDefault: boolean }[]>([]);
  const [loadingShops, setLoadingShops] = useState(true);

  // Check subscription status
  useEffect(() => {
    const checkSubscription = async () => {
      if (status === 'authenticated') {
        try {
          const response = await fetch('/api/seller/subscription/check');
          const data = await response.json();
          
          setHasSubscription(data.hasActiveSubscription);
          setHasPendingSubscription(data.hasPendingSubscription || false);
          setPendingSubscriptionStatus(data.pendingPaymentStatus);
        } catch (error) {
          console.error('Error checking subscription:', error);
          setHasSubscription(false);
          setHasPendingSubscription(false);
        } finally {
          setCheckingSubscription(false);
        }
      }
    };
    
    if (status === 'authenticated') {
      checkSubscription();
    }
  }, [status]);

  // Fetch seller's shops
  useEffect(() => {
    const fetchShops = async () => {
      if (status === 'authenticated') {
        try {
          setLoadingShops(true);
          const response = await fetch('/api/seller/shops');
          
          if (!response.ok) {
            throw new Error('Failed to fetch shops');
          }
          
          const data = await response.json();
          
          if (data.shops && data.shops.length > 0) {
            setShops(data.shops);
          }
        } catch (error) {
          console.error('Error fetching shops:', error);
        } finally {
          setLoadingShops(false);
        }
      }
    };
    
    fetchShops();
  }, [status]);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId || status !== 'authenticated') return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/seller/products/${productId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            router.push('/seller/products');
            return;
          }
          throw new Error('Failed to fetch product');
        }
        
        const product = await response.json();
        
        // Get associated shops
        const productShopsResponse = await fetch(`/api/seller/products/${productId}/shops`);
        let shopIds: string[] = [];
        
        if (productShopsResponse.ok) {
          const { shops: productShops } = await productShopsResponse.json();
          shopIds = productShops.map((shop: any) => shop.shopId);
        }
        
        // Initialize form data with fetched product
        setFormData({
          title: product.title || '',
          description: product.description || '',
          price: String(product.price) || '',
          inventory: String(product.inventory) || '0',
          isActive: product.isActive ?? true,
          shopId: product.shopId,
          shopIds: shopIds,
          images: product.images?.map((img: ProductImageData) => ({
            id: img.id,
            imageUrl: img.imageUrl,
            preview: img.imageUrl,
            isNew: false
          })) || []
        });
      } catch (error) {
        console.error('Error fetching product:', error);
        setSubmitError('خطا در بارگذاری اطلاعات محصول');
        
        // Use mock data for testing if API fails
        setFormData({
          title: 'محصول نمونه',
          description: 'توضیحات محصول نمونه',
          price: '150000',
          inventory: '10',
          isActive: true,
          shopId: '',
          shopIds: [],
          images: [
            {
              id: '1',
              imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
              preview: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
              isNew: false
            }
          ]
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProduct();
  }, [productId, router, status]);

  // Handle input changes
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  // Handle toggle change
  const handleToggleChange = () => {
    setFormData({
      ...formData,
      isActive: !formData.isActive
    });
  };

  // Handle image uploads
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages: ProductImage[] = [...formData.images];
      
      Array.from(e.target.files).forEach(file => {
        // Create a preview URL for the image
        const preview = URL.createObjectURL(file);
        newImages.push({
          file,
          preview,
          isNew: true
        });
      });
      
      setFormData({
        ...formData,
        images: newImages
      });
      
      // Clear any image-related errors
      if (errors.images) {
        setErrors({
          ...errors,
          images: ''
        });
      }
    }
  };

  // Remove an image
  const handleRemoveImage = async (index: number) => {
    const newImages = [...formData.images];
    const imageToRemove = newImages[index];
    
    // If it's a new image (not saved), just remove it from state
    if (imageToRemove.isNew && imageToRemove.preview) {
      URL.revokeObjectURL(imageToRemove.preview);
      newImages.splice(index, 1);
      
      setFormData({
        ...formData,
        images: newImages
      });
      return;
    }
    
    // If it's an existing image, delete it from the server
    if (imageToRemove.id) {
      try {
        const response = await fetch(`/api/seller/products/images/${imageToRemove.id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          console.error('Error deleting image:', await response.json());
          return;
        }
      } catch (error) {
        console.error('Error deleting image:', error);
        return;
      }
    }
    
    // Remove the image from state
    newImages.splice(index, 1);
    
    setFormData({
      ...formData,
      images: newImages
    });
  };

  // Handle main shop selection
  const handleShopChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const selectedShopId = e.target.value;
    setFormData({
      ...formData,
      shopId: selectedShopId,
      // Add the main shop to the shopIds array if not already included
      shopIds: formData.shopIds.includes(selectedShopId) 
        ? formData.shopIds 
        : [...formData.shopIds, selectedShopId]
    });
  };

  // Handle multiple shop selection
  const handleShopSelectionChange = (e: ChangeEvent<HTMLInputElement>) => {
    const shopId = e.target.value;
    const isChecked = e.target.checked;
    
    let newShopIds: string[];
    
    if (isChecked) {
      // Add to selected shops
      newShopIds = [...formData.shopIds, shopId];
    } else {
      // If this is the main shop, don't allow unselecting
      if (shopId === formData.shopId) {
        return;
      }
      // Remove from selected shops
      newShopIds = formData.shopIds.filter(id => id !== shopId);
    }
    
    setFormData({
      ...formData,
      shopIds: newShopIds
    });
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'عنوان محصول الزامی است';
    }
    
    if (!formData.price.trim()) {
      newErrors.price = 'قیمت محصول الزامی است';
    } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = 'قیمت باید یک عدد مثبت باشد';
    }
    
    if (formData.inventory.trim() && (isNaN(Number(formData.inventory)) || Number(formData.inventory) < 0)) {
      newErrors.inventory = 'موجودی باید یک عدد غیرمنفی باشد';
    }

    if (!formData.shopId) {
      newErrors.shopId = 'انتخاب فروشگاه اصلی الزامی است';
    }

    if (formData.shopIds.length === 0) {
      newErrors.shopIds = 'حداقل یک فروشگاه باید انتخاب شود';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Prepare update data
      const updateData = {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        inventory: Number(formData.inventory),
        isActive: formData.isActive,
        shopId: formData.shopId,
        shopIds: formData.shopIds
      };
      
      // Update product
      const response = await fetch(`/api/seller/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.error || 'خطا در بروزرسانی محصول');
      }
      
      // Process new image uploads
      const newImages = formData.images.filter(img => img.isNew && img.file);
      
      if (newImages.length > 0) {
        const imageFormData = new FormData();
        imageFormData.append('productId', productId);
        
        newImages.forEach(image => {
          if (image.file) {
            imageFormData.append('images', image.file);
          }
        });
        
        const imageUploadResponse = await fetch('/api/seller/products/images', {
          method: 'POST',
          body: imageFormData
        });
        
        if (!imageUploadResponse.ok) {
          console.error('Error uploading new images:', await imageUploadResponse.json());
        }
      }
      
      // Show success message
      setSubmitSuccess(true);
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/seller/products');
      }, 1500);
      
    } catch (error) {
      console.error('Error updating product:', error);
      setSubmitError(error instanceof Error ? error.message : 'خطایی رخ داده است. لطفا دوباره تلاش کنید.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading' || isLoading || checkingSubscription) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  // Show subscription message if user doesn't have an active subscription
  if (hasSubscription === false) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">ویرایش محصول</h1>
        </div>
        
        {hasPendingSubscription ? (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 text-center">
            <div className="mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="text-xl font-bold text-gray-900 mb-2">اشتراک در انتظار تایید</h2>
              <p className="text-gray-700 mb-4">
                {pendingSubscriptionStatus === 'pending' ? 
                  'اشتراک شما در انتظار تایید پرداخت است. پس از تایید پرداخت توسط ادمین، می‌توانید محصولات خود را ویرایش کنید.' :
                  pendingSubscriptionStatus === 'rejected' ?
                  'متاسفانه پرداخت شما تایید نشده است. لطفا با پشتیبانی تماس بگیرید یا مجددا اقدام به خرید اشتراک نمایید.' :
                  'اشتراک شما هنوز فعال نشده است. لطفا مجددا تلاش کنید یا با پشتیبانی تماس بگیرید.'}
              </p>
              
              <button
                onClick={() => router.push('/seller/dashboard')}
                className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium mx-2"
              >
                بازگشت به داشبورد
              </button>
              
              {pendingSubscriptionStatus === 'rejected' && (
                <button
                  onClick={() => router.push('/seller/plans')}
                  className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium mx-2 mt-2 sm:mt-0"
                >
                  خرید اشتراک جدید
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 text-center">
            <div className="mb-4">
              <XCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">نیاز به اشتراک فعال</h2>
              <p className="text-gray-700 mb-6">
                برای ویرایش محصولات، شما نیاز به یک اشتراک فعال دارید. لطفا ابتدا یک پلن اشتراک را انتخاب کنید.
              </p>
              
              <button
                onClick={() => router.push('/seller/plans')}
                className="px-5 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                مشاهده پلن‌های اشتراک
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">ویرایش محصول</h1>
        <button
          type="button"
          onClick={() => router.push('/seller/products')}
          className="text-blue-600 hover:text-blue-800"
        >
          بازگشت به لیست محصولات
        </button>
      </div>
      
      {submitSuccess && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 rounded-md p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="mr-3">
              <p className="text-sm font-medium">محصول با موفقیت بروزرسانی شد. در حال انتقال به صفحه محصولات...</p>
            </div>
          </div>
        </div>
      )}
      
      {submitError && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
          <div className="flex">
            <XCircle className="h-5 w-5 text-red-400" />
            <div className="mr-3">
              <p className="text-sm font-medium">{submitError}</p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Product Details */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          {/* Title */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              عنوان محصول <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              dir="rtl"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>
          
          {/* Description */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              توضیحات محصول
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              dir="rtl"
            ></textarea>
          </div>
          
          {/* Price and Inventory */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                قیمت (تومان) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                dir="rtl"
              />
              {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
            </div>
            
            <div>
              <label htmlFor="inventory" className="block text-sm font-medium text-gray-700 mb-1">
                موجودی
              </label>
              <input
                type="text"
                id="inventory"
                name="inventory"
                value={formData.inventory}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                dir="rtl"
              />
              {errors.inventory && <p className="mt-1 text-sm text-red-600">{errors.inventory}</p>}
            </div>
          </div>
          
          {/* Active Status */}
          <div className="flex items-center mb-6">
            <button 
              type="button"
              onClick={handleToggleChange}
              className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 ${
                formData.isActive ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              role="switch"
              aria-checked={formData.isActive}
            >
              <span 
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                  formData.isActive ? 'translate-x-0' : 'translate-x-5'
                }`} 
              />
            </button>
            <span className="mr-3 text-sm text-gray-700">محصول فعال باشد</span>
          </div>
          
          {/* Shop Selection */}
          <div className="space-y-4 mt-6">
            <div>
              <label htmlFor="shopId" className="block text-sm font-medium text-gray-700">
                فروشگاه اصلی <span className="text-red-500">*</span>
              </label>
              {loadingShops ? (
                <div className="flex items-center mt-1">
                  <Loader2 className="h-5 w-5 text-gray-400 animate-spin ml-2" />
                  <span className="text-sm text-gray-500">در حال بارگذاری فروشگاه‌ها...</span>
                </div>
              ) : shops.length > 0 ? (
                <select
                  id="shopId"
                  name="shopId"
                  value={formData.shopId}
                  onChange={handleShopChange}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="" disabled>انتخاب فروشگاه</option>
                  {shops.map(shop => (
                    <option key={shop.id} value={shop.id}>
                      {shop.shopName} {shop.isDefault ? '(پیش‌فرض)' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="mt-1 text-sm text-red-600">
                  شما هنوز هیچ فروشگاهی ندارید. لطفا ابتدا یک فروشگاه ایجاد کنید.
                </div>
              )}
              {errors.shopId && (
                <p className="mt-1 text-sm text-red-600">{errors.shopId}</p>
              )}
            </div>

            {/* Multiple Shop Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نمایش محصول در فروشگاه‌ها
              </label>
              {loadingShops ? (
                <div className="flex items-center">
                  <Loader2 className="h-5 w-5 text-gray-400 animate-spin ml-2" />
                  <span className="text-sm text-gray-500">در حال بارگذاری فروشگاه‌ها...</span>
                </div>
              ) : shops.length > 0 ? (
                <div className="space-y-2">
                  {shops.map(shop => (
                    <div key={shop.id} className="flex items-center">
                      <input
                        id={`shop-${shop.id}`}
                        name="shopIds"
                        type="checkbox"
                        value={shop.id}
                        checked={formData.shopIds.includes(shop.id)}
                        onChange={handleShopSelectionChange}
                        disabled={shop.id === formData.shopId} // Main shop always selected
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded ml-2"
                      />
                      <label htmlFor={`shop-${shop.id}`} className="text-sm text-gray-700">
                        {shop.shopName} {shop.id === formData.shopId ? '(فروشگاه اصلی)' : ''}
                      </label>
                    </div>
                  ))}
                </div>
              ) : null}
              {errors.shopIds && (
                <p className="mt-1 text-sm text-red-600">{errors.shopIds}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                محصول علاوه بر فروشگاه اصلی، در فروشگاه‌های انتخاب شده نیز نمایش داده می‌شود.
              </p>
            </div>
          </div>
          
          {/* Current Images */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              تصاویر محصول
            </label>
            
            {/* Image Upload */}
            <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="images" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                    <span>آپلود فایل</span>
                    <input 
                      id="images" 
                      name="images" 
                      type="file" 
                      className="sr-only" 
                      multiple 
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </label>
                  <p className="pr-1">یا بکشید و رها کنید</p>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF تا 10MB
                </p>
              </div>
            </div>
            
            {errors.images && <p className="mt-1 text-sm text-red-600">{errors.images}</p>}
            
            {/* Preview Images */}
            {formData.images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="relative h-24 w-full overflow-hidden rounded-md">
                      <Image 
                        src={image.preview} 
                        alt={`Preview ${index}`}
                        fill
                        sizes="100px"
                        className="object-cover"
                        priority={index === 0}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 bg-red-100 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end mt-8">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                در حال ذخیره...
              </span>
            ) : 'بروزرسانی محصول'}
          </button>
        </div>
      </form>
    </div>
  );
} 