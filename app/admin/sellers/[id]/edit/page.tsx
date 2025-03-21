"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  TbLoader2,
  TbAlertTriangle,
  TbArrowLeft,
  TbCheck,
  TbPlus,
} from "react-icons/tb";
import React from "react";

type Seller = {
  id: string;
  username: string;
  email: string;
  shopName: string;
  bio: string | null;
  isActive: boolean;
  subscription: SubscriptionInfo | null;
};

type SubscriptionInfo = {
  id: string;
  planId: string;
  planName: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
};

type Plan = {
  id: string;
  name: string;
  price: number;
  features: string[];
  maxProducts: number;
};

type FormData = {
  username: string;
  email: string;
  password?: string;  // Make password optional
  shopName: string;
  bio: string;
  isActive: boolean;
};

export default function EditSellerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Properly unwrap params using React.use()
  const unwrappedParams = React.use(params);
  const sellerId = unwrappedParams.id;

  const router = useRouter();
  const { data: session, status } = useSession();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    password: "",
    shopName: "",
    bio: "",
    isActive: true,
  });

  // Subscription form data
  const [showSubscriptionForm, setShowSubscriptionForm] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState({
    planId: "",
    durationMonths: 1,
    isActive: true,
  });
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(
    null
  );
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(false);

  useEffect(() => {
    // Redirect if not admin
    if (status === "authenticated" && session?.user?.type !== "admin") {
      router.push("/admin");
    }

    // Fetch seller and plans data
    if (
      status === "authenticated" &&
      session?.user?.type === "admin" &&
      sellerId
    ) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          // Fetch seller data
          const sellerResponse = await fetch(`/api/admin/sellers/${sellerId}`);
          if (!sellerResponse.ok) {
            throw new Error("Failed to fetch seller data");
          }
          const sellerData = await sellerResponse.json();

          // Fetch available plans
          const plansResponse = await fetch("/api/admin/plans");
          if (!plansResponse.ok) {
            throw new Error("Failed to fetch plans");
          }
          const plansData = await plansResponse.json();

          setSeller(sellerData);
          setPlans(plansData);

          // Initialize form data
          setFormData({
            username: sellerData.username,
            email: sellerData.email,
            password: "",
            shopName: sellerData.shopName,
            bio: sellerData.bio || "",
            isActive: sellerData.isActive,
          });

          // Initialize subscription form if a subscription exists
          if (sellerData.subscription) {
            setSubscriptionData({
              planId: sellerData.subscription.planId,
              durationMonths: 1,
              isActive: true,
            });
          } else if (plansData.length > 0) {
            setSubscriptionData({
              planId: plansData[0].id,
              durationMonths: 1,
              isActive: true,
            });
          }
        } catch (error) {
          console.error("Error fetching data:", error);
          setError("خطا در دریافت اطلاعات فروشنده یا پلن‌ها");
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }
  }, [sellerId, session, status, router]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    if (type === "checkbox") {
      const { checked } = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [name]: checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubscriptionChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    if (type === "checkbox") {
      const { checked } = e.target as HTMLInputElement;
      setSubscriptionData({
        ...subscriptionData,
        [name]: checked,
      });
    } else {
      setSubscriptionData({
        ...subscriptionData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!sellerId) return;

    setIsSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      // Create the request payload
      const { password, ...payload } = formData;
      
      const response = await fetch(`/api/admin/sellers/${sellerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "خطا در بروزرسانی اطلاعات فروشنده"
        );
      }

      setSaveSuccess(true);

      // Refresh seller data
      const sellerResponse = await fetch(`/api/admin/sellers/${sellerId}`);
      const sellerData = await sellerResponse.json();
      setSeller(sellerData);

      // Reset password field
      setFormData({
        ...formData,
        password: "",
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error updating seller:", error);
      setError(
        error instanceof Error
          ? error.message
          : "خطا در بروزرسانی اطلاعات فروشنده"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateSubscription = async (e: FormEvent) => {
    e.preventDefault();

    if (!sellerId) return;

    setIsCreatingSubscription(true);
    setSubscriptionError(null);
    setSubscriptionSuccess(false);

    try {
      const response = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sellerId: sellerId,
          planId: subscriptionData.planId,
          durationMonths: Number(subscriptionData.durationMonths),
          isActive: subscriptionData.isActive,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "خطا در ایجاد اشتراک");
      }

      setSubscriptionSuccess(true);
      setShowSubscriptionForm(false);

      // Refresh seller data to show the new subscription
      const sellerResponse = await fetch(`/api/admin/sellers/${sellerId}`);
      const sellerData = await sellerResponse.json();
      setSeller(sellerData);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSubscriptionSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error creating subscription:", error);
      setSubscriptionError(
        error instanceof Error ? error.message : "خطا در ایجاد اشتراک"
      );
    } finally {
      setIsCreatingSubscription(false);
    }
  };

  // Format date to Persian format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <TbLoader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-6">
          <div className="flex">
            <TbAlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <span>فروشنده مورد نظر یافت نشد.</span>
          </div>
        </div>
        <button
          onClick={() => router.push("/admin/sellers")}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <TbArrowLeft className="ml-2 -mr-1 h-5 w-5" />
          بازگشت به لیست فروشندگان
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">ویرایش فروشنده</h1>
        <button
          onClick={() => router.push("/admin/sellers")}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <TbArrowLeft className="ml-2 -mr-1 h-5 w-5" />
          بازگشت به لیست فروشندگان
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-6">
          <div className="flex">
            <TbAlertTriangle className="h-5 w-5 text-red-500 ml-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative mb-6">
          <div className="flex">
            <TbCheck className="h-5 w-5 text-green-500 ml-2" />
            <span>اطلاعات فروشنده با موفقیت بروزرسانی شد.</span>
          </div>
        </div>
      )}

      {subscriptionSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative mb-6">
          <div className="flex">
            <TbCheck className="h-5 w-5 text-green-500 ml-2" />
            <span>اشتراک جدید با موفقیت برای فروشنده ایجاد شد.</span>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-6 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b pb-3">
            اطلاعات فروشنده
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-y-8 gap-x-6 sm:grid-cols-6">
              {/* شماره موبایل و ایمیل */}
              <div className="sm:col-span-3">
                <label
                  htmlFor="mobile"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  شماره موبایل
                </label>
                <div>
                  <input
                    type="text"
                    name="mobile"
                    id="mobile"
                    value={seller.username}
                    disabled
                    className="shadow-sm bg-gray-100 block w-full text-sm border-gray-300 rounded-md p-3"
                    dir="ltr"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">شماره موبایل قابل ویرایش نیست.</p>
              </div>

              <div className="sm:col-span-3">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  ایمیل
                </label>
                <div>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full text-sm border-gray-300 rounded-md p-3"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* نام فروشگاه و رمز عبور */}
              <div className="sm:col-span-3">
                <label
                  htmlFor="shopName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  نام فروشگاه
                </label>
                <div>
                  <input
                    type="text"
                    name="shopName"
                    id="shopName"
                    value={formData.shopName}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full text-sm border-gray-300 rounded-md p-3"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  رمز عبور جدید (اختیاری)
                </label>
                <div>
                  <input
                    type="password"
                    name="password"
                    id="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full text-sm border-gray-300 rounded-md p-3"
                    placeholder="برای حفظ رمز فعلی خالی بگذارید"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* بیوگرافی */}
              <div className="sm:col-span-6">
                <label
                  htmlFor="bio"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  بیوگرافی
                </label>
                <div>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    value={formData.bio}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full text-sm border-gray-300 rounded-md p-3"
                    dir="rtl"
                  ></textarea>
                </div>
              </div>

              {/* وضعیت فعال */}
              <div className="sm:col-span-6 mt-2">
                <div className="flex items-center bg-gray-50 p-4 rounded-md border border-gray-200">
                  <input
                    id="isActive"
                    name="isActive"
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="isActive"
                    className="mr-3 block text-md text-gray-800"
                  >
                    فروشنده فعال است
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-200 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <TbLoader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    در حال ذخیره...
                  </>
                ) : (
                  "ذخیره تغییرات"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Subscription Information */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-6 sm:p-8">
          <div className="flex justify-between items-center mb-6 border-b pb-3">
            <h2 className="text-xl font-semibold text-gray-900">
              اطلاعات اشتراک
            </h2>

            <button
              type="button"
              onClick={() => setShowSubscriptionForm(!showSubscriptionForm)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <TbPlus className="ml-2 -mr-1 h-4 w-4" />
              {showSubscriptionForm ? "انصراف" : "ایجاد اشتراک جدید"}
            </button>
          </div>

          {seller.subscription ? (
            <div className="border rounded-md p-5 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border-r border-gray-200 pr-4">
                  <p className="text-sm font-medium text-gray-500 mb-2">
                    نام پلن:
                  </p>
                  <p className="text-base font-medium text-gray-800">
                    {seller.subscription.planName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">
                    وضعیت:
                  </p>
                  <p className="font-medium">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        seller.subscription.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {seller.subscription.isActive ? "فعال" : "غیرفعال"}
                    </span>
                  </p>
                </div>
                <div className="border-r border-gray-200 pr-4">
                  <p className="text-sm font-medium text-gray-500 mb-2">
                    تاریخ شروع:
                  </p>
                  <p className="text-base font-medium text-gray-800">
                    {formatDate(seller.subscription.startDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">
                    تاریخ پایان:
                  </p>
                  <p className="text-base font-medium text-gray-800">
                    {formatDate(seller.subscription.endDate)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-md border border-gray-200">
              <p className="text-gray-500 text-lg">
                هیچ اشتراک فعالی برای این فروشنده وجود ندارد.
              </p>
            </div>
          )}

          {/* Subscription Form */}
          {showSubscriptionForm && (
            <div className="mt-8 border rounded-md p-6 bg-gray-50">
              <h3 className="text-lg font-medium text-gray-900 mb-5 border-b pb-3">
                ایجاد اشتراک جدید
              </h3>

              {subscriptionError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-5">
                  <div className="flex">
                    <TbAlertTriangle className="h-5 w-5 text-red-500 ml-2" />
                    <span>{subscriptionError}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleCreateSubscription}>
                <div className="grid grid-cols-1 gap-y-8 gap-x-6 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label
                      htmlFor="planId"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      پلن اشتراک
                    </label>
                    <div>
                      <select
                        id="planId"
                        name="planId"
                        value={subscriptionData.planId}
                        onChange={handleSubscriptionChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full text-sm border-gray-300 rounded-md p-3"
                        dir="rtl"
                      >
                        {plans.map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name} ({plan.price.toLocaleString()} تومان)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label
                      htmlFor="durationMonths"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      مدت اشتراک (ماه)
                    </label>
                    <div>
                      <select
                        id="durationMonths"
                        name="durationMonths"
                        value={subscriptionData.durationMonths}
                        onChange={handleSubscriptionChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full text-sm border-gray-300 rounded-md p-3"
                        dir="rtl"
                      >
                        <option value="1">1 ماه</option>
                        <option value="3">3 ماه</option>
                        <option value="6">6 ماه</option>
                        <option value="12">12 ماه</option>
                      </select>
                    </div>
                  </div>

                  <div className="sm:col-span-6 mt-2">
                    <div className="flex items-center bg-white p-4 rounded-md border border-gray-200">
                      <input
                        id="isActive"
                        name="isActive"
                        type="checkbox"
                        checked={subscriptionData.isActive}
                        onChange={handleSubscriptionChange}
                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="isActive"
                        className="mr-3 block text-md text-gray-800"
                      >
                        اشتراک فعال باشد (اشتراک‌های فعلی غیرفعال خواهند شد)
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-gray-200 flex justify-end">
                  <button
                    type="submit"
                    disabled={isCreatingSubscription}
                    className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingSubscription ? (
                      <>
                        <TbLoader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        در حال ایجاد...
                      </>
                    ) : (
                      "ایجاد اشتراک"
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
