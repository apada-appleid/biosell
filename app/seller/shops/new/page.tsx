"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";

type FormData = {
  shopName: string;
  instagramId?: string;
  description?: string;
};

export default function NewShopPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const response = await fetch("/api/seller/shops", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create shop");
      }
      
      router.push("/seller/shops");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">افزودن فروشگاه جدید</h1>
        <p className="text-gray-500 mt-1">
          اطلاعات فروشگاه جدید خود را وارد کنید.
        </p>
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
          
          <div className="flex items-center justify-end space-x-4 space-x-reverse">
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
              {isSubmitting ? "در حال ذخیره..." : "ذخیره"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 