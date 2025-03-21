"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import LoadingSpinner from "@/components/LoadingSpinner";

type FormData = {
  shopName: string;
  instagramId?: string;
  description?: string;
  isActive: boolean;
};

interface ShopData extends FormData {
  id: string;
  isDefault: boolean;
  createdAt: string;
}

export default function EditShopPage({ params }: { params: Promise<{ id: string }> }) {
  const [shop, setShop] = useState<ShopData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shopId, setShopId] = useState<string | null>(null);
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>();

  useEffect(() => {
    const extractShopId = async () => {
      const resolvedParams = await params;
      setShopId(resolvedParams.id);
    };
    
    extractShopId();
  }, [params]);

  useEffect(() => {
    const fetchShop = async () => {
      if (!shopId) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/seller/shops/${shopId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch shop details");
        }
        
        const data = await response.json();
        setShop(data.shop);
        
        // Initialize form with shop data
        reset({
          shopName: data.shop.shopName,
          instagramId: data.shop.instagramId || "",
          description: data.shop.description || "",
          isActive: data.shop.isActive
        });
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchShop();
  }, [shopId, reset]);

  const onSubmit = async (data: FormData) => {
    if (!shopId) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const response = await fetch(`/api/seller/shops/${shopId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update shop");
      }
      
      router.push("/seller/shops");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!shopId) return;
    
    if (!confirm("آیا از حذف این فروشگاه اطمینان دارید؟ این عملیات قابل بازگشت نیست.")) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/seller/shops/${shopId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete shop");
      }
      
      router.push("/seller/shops");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">ویرایش فروشگاه</h1>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error && !shop) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">ویرایش فروشگاه</h1>
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <p>خطا در بارگذاری اطلاعات: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 text-red-600 hover:text-red-800 font-medium"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">ویرایش فروشگاه</h1>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4">
          <p>فروشگاه مورد نظر یافت نشد.</p>
          <Link 
            href="/seller/shops"
            className="mt-2 text-indigo-600 hover:text-indigo-800 font-medium block"
          >
            بازگشت به لیست فروشگاه‌ها
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">ویرایش فروشگاه</h1>
        <div className="flex items-center mt-2">
          <p className="text-gray-500">{shop.shopName}</p>
          {shop.isDefault && (
            <span className="mr-2 bg-green-100 text-green-800 text-xs px-2.5 py-0.5 rounded-full">
              پیش‌فرض
            </span>
          )}
        </div>
      </div>
      
      <div className="bg-white border rounded-lg overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
              <p>{error}</p>
            </div>
          )}
          
          <div className="mb-6">
            <label htmlFor="shopName" className="block text-sm font-medium text-gray-700 mb-1">
              نام فروشگاه <span className="text-red-500">*</span>
            </label>
            <input
              id="shopName"
              type="text"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.shopName ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="مثال: فروشگاه بیوسل"
              {...register("shopName", {
                required: "نام فروشگاه الزامی است",
                minLength: {
                  value: 3,
                  message: "نام فروشگاه باید حداقل 3 کاراکتر باشد",
                },
                maxLength: {
                  value: 100,
                  message: "نام فروشگاه نباید بیشتر از 100 کاراکتر باشد",
                },
              })}
            />
            {errors.shopName && (
              <p className="mt-1 text-sm text-red-600">{errors.shopName.message}</p>
            )}
          </div>
          
          <div className="mb-6">
            <label htmlFor="instagramId" className="block text-sm font-medium text-gray-700 mb-1">
              شناسه اینستاگرام (بدون @)
            </label>
            <input
              id="instagramId"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="مثال: biosell.official"
              {...register("instagramId")}
            />
            <p className="mt-1 text-sm text-gray-500">
              اگر فروشگاه شما صفحه اینستاگرام دارد، شناسه آن را وارد کنید.
            </p>
          </div>
          
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              توضیحات
            </label>
            <textarea
              id="description"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="توضیحات مختصری درباره فروشگاه خود وارد کنید..."
              {...register("description")}
            ></textarea>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center">
              <input
                id="isActive"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                {...register("isActive")}
              />
              <label htmlFor="isActive" className="mr-2 block text-sm text-gray-700">
                فروشگاه فعال است
              </label>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              غیرفعال کردن فروشگاه باعث می‌شود محصولات آن در فروشگاه نمایش داده نشوند.
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting || shop.isDefault}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {shop.isDefault ? "فروشگاه پیش‌فرض قابل حذف نیست" : "حذف فروشگاه"}
            </button>
            
            <div className="flex items-center space-x-4 space-x-reverse">
              <Link
                href="/seller/shops"
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                انصراف
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSubmitting ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 