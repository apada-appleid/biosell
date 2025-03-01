'use client';

import { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { XCircle, Upload, Loader2, CheckCircle } from 'lucide-react';

interface ProductImage {
  id?: string; // Optional since new uploads won't have IDs yet
  file?: File;  // For file uploads
  preview: string; // URL for preview (blob URL or actual URL)
}

interface ProductFormData {
  title: string;
  description: string;
  price: string;
  inventory: string;
  isActive: boolean;
  images: ProductImage[];
}

export default function NewProductPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    description: '',
    price: '',
    inventory: '0',
    isActive: true,
    images: []
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  // Check if user has an active subscription
  useEffect(() => {
    const checkSubscription = async () => {
      if (status === 'authenticated') {
        try {
          const response = await fetch('/api/seller/subscription/check');
          const data = await response.json();
          
          setHasSubscription(data.hasActiveSubscription);
        } catch (error) {
          console.error('Error checking subscription:', error);
          setHasSubscription(false);
        } finally {
          setCheckingSubscription(false);
        }
      }
    };
    
    if (status === 'authenticated') {
      checkSubscription();
    } else if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

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
          preview
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
  const handleRemoveImage = (index: number) => {
    const newImages = [...formData.images];
    
    // If the image has a preview URL created with URL.createObjectURL,
    // we should revoke it to avoid memory leaks
    if (newImages[index].preview && newImages[index].file) {
      URL.revokeObjectURL(newImages[index].preview);
    }
    
    newImages.splice(index, 1);
    
    setFormData({
      ...formData,
      images: newImages
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
      // First, create the product
      const productData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        inventory: parseInt(formData.inventory || '0'),
        isActive: formData.isActive
      };
      
      const response = await fetch('/api/seller/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        // Check for specific error types
        if (response.status === 403 && responseData.error === 'No active subscription found') {
          // Handle subscription error with a user-friendly message
          setSubmitError('شما اشتراک فعالی ندارید. لطفا ابتدا یک پلن اشتراک تهیه کنید.');
          
          // Add a small delay before redirecting to the plans page
          setTimeout(() => {
            router.push('/seller/plans');
          }, 3000);
          
          return;
        } else if (response.status === 403 && responseData.error.includes('maximum number of products')) {
          // Handle product limit error
          setSubmitError('شما به حداکثر تعداد محصولات مجاز در پلن خود رسیده‌اید. لطفا پلن خود را ارتقا دهید.');
          return;
        }
        
        // Handle other errors
        throw new Error(responseData.error || 'خطا در ایجاد محصول');
      }
      
      // Upload images if there are any
      if (formData.images.length > 0) {
        const imageFormData = new FormData();
        imageFormData.append('productId', responseData.id);
        
        formData.images.forEach(image => {
          if (image.file) {
            imageFormData.append('images', image.file);
          }
        });
        
        const imageResponse = await fetch('/api/seller/products/images', {
          method: 'POST',
          body: imageFormData
        });
        
        if (!imageResponse.ok) {
          console.error('Error uploading images:', await imageResponse.json());
        }
      }
      
      // Show success message before redirecting
      setSubmitSuccess(true);
      
      // Redirect after a short delay to show the success message
      setTimeout(() => {
        router.push('/seller/products');
      }, 1500);
      
    } catch (error) {
      console.error('Error creating product:', error);
      setSubmitError(error instanceof Error ? error.message : 'خطایی رخ داده است. لطفا دوباره تلاش کنید.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading' || checkingSubscription) {
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
          <h1 className="text-2xl font-bold text-gray-900">افزودن محصول جدید</h1>
        </div>
        
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 text-center">
          <div className="mb-4">
            <XCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">نیاز به اشتراک فعال</h2>
            <p className="text-gray-700 mb-6">
              برای افزودن محصول جدید، شما نیاز به یک اشتراک فعال دارید. لطفا ابتدا یک پلن اشتراک را انتخاب کنید.
            </p>
            
            <button
              onClick={() => router.push('/seller/plans')}
              className="px-5 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              مشاهده پلن‌های اشتراک
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">افزودن محصول جدید</h1>
        <p className="mt-1 text-sm text-gray-600">اطلاعات محصول جدید خود را وارد کنید.</p>
      </div>
      
      {submitSuccess && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 rounded-md p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="mr-3">
              <p className="text-sm font-medium">محصول با موفقیت ایجاد شد. در حال انتقال به صفحه محصولات...</p>
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
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
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
        
        {/* Image Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            تصاویر محصول
          </label>
          
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
                    <img 
                      src={image.preview} 
                      alt={`Preview ${index}`} 
                      className="h-full w-full object-cover"
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
        
        {/* Submit Button */}
        <div className="flex justify-end mt-8">
          <button
            type="button"
            onClick={() => router.push('/seller/products')}
            className="ml-3 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            انصراف
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                در حال ثبت...
              </span>
            ) : 'ذخیره محصول'}
          </button>
        </div>
      </form>
    </div>
  );
} 