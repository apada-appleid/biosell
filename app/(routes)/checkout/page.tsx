"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/app/store/cart";
import { useToastStore } from "@/app/store/toast";
import {
  FiArrowLeft,
  FiCheck,
  FiCreditCard,
  FiDollarSign,
} from "react-icons/fi";
import { TbLoader, TbPlus, TbCheck, TbMapPin, TbX } from "react-icons/tb";
import { uploadReceiptToS3 } from "@/utils/s3-storage";
import { CustomerAddress, CartItem, Product } from "@/app/types";

interface UserInfo {
  id: string;
  name?: string;
  email?: string;
  mobile?: string;
}

interface FormData {
  fullName: string;
  email: string;
  mobile: string;
  province: string;
  city: string;
  address: string;
  postalCode: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { showToast, hideToast } = useToastStore();
  const { cart } = useCartStore();
  const clearCart = useCartStore((state) => state.clearCart);
  const updateCartItem = useCartStore((state) => state.updateItem);

  const [localUser, setLocalUser] = useState<UserInfo | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    mobile: "",
    province: "",
    city: "",
    address: "",
    postalCode: "",
  });

  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [addressFormData, setAddressFormData] = useState({
    fullName: "",
    mobile: "",
    address: "",
    city: "",
    province: "",
    postalCode: "",
    isDefault: false,
  });
  const [isAddressRequired, setIsAddressRequired] = useState(true);
  const [isValidatingCart, setIsValidatingCart] = useState(false);
  const [hasCartChanges, setHasCartChanges] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate cart items (fetch fresh data for all products)
  const validateCartItems = useCallback(async () => {
    if (cart.items.length === 0) return;
    
    setIsValidatingCart(true);
    let hasChanges = false;
    
    try {
      // Collect all product IDs from cart
      const productIds = cart.items.map(item => item.product.id);
      
      // Batch fetch latest product data
      const response = await fetch(`/api/products/batch?ids=${productIds.join(',')}`);
      
      if (!response.ok) {
        console.error("Failed to validate products:", await response.text());
        return;
      }
      
      const data = await response.json();
      const freshProducts = data.products || [];
      
      if (!freshProducts.length) return;
      
      // Map products by ID for easy lookup
      const productMap = new Map<string, Product>(
        freshProducts.map((product: Product) => [product.id, product])
      );
      
      // Update each cart item with fresh data if needed
      for (const item of cart.items) {
        const freshProduct = productMap.get(item.product.id) as Product | undefined;
        
        // Skip if product no longer exists or is inactive
        if (!freshProduct || freshProduct.isActive === false) {
          hasChanges = true;
          showToast(
            `محصول "${item.product.title}" دیگر در دسترس نیست و از سبد خرید حذف شد.`, 
            undefined, 
            "info"
          );
          continue;
        }
        
        // Check for price changes
        if (freshProduct.price !== item.product.price) {
          hasChanges = true;
          showToast(
            `قیمت محصول "${item.product.title}" تغییر کرده است و بروزرسانی شد.`,
            undefined,
            "info"
          );
          
          // Update cart item with new price
          updateCartItem({
            ...item,
            product: {
              ...item.product,
              price: freshProduct.price
            }
          });
        }
        
        // Check for inventory changes
        if (freshProduct.inventory !== undefined && freshProduct.inventory < item.quantity) {
          hasChanges = true;
          const newQty = Math.max(0, freshProduct.inventory);
          
          showToast(
            `موجودی محصول "${item.product.title}" تغییر کرده و به ${newQty} عدد تنظیم شد.`,
            undefined,
            "info"
          );
          
          // Update cart item with new quantity
          updateCartItem({
            ...item,
            quantity: newQty,
            product: {
              ...item.product,
              inventory: freshProduct.inventory
            }
          });
        }
        
        // Update requiresAddress value if it changed
        if (freshProduct.requiresAddress !== item.product.requiresAddress) {
          updateCartItem({
            ...item,
            product: {
              ...item.product,
              requiresAddress: freshProduct.requiresAddress
            }
          });
          hasChanges = true;
        }
      }
      
      if (hasChanges) {
        setHasCartChanges(true);
      }
      
      // After validation, check if any product requires address
      const addressRequired = cart.items.some(item => 
        item.product.requiresAddress !== false
      );
      setIsAddressRequired(addressRequired);
      
    } catch (error) {
      console.error("Error validating cart items:", error);
    } finally {
      setIsValidatingCart(false);
    }
  }, [cart.items, showToast, updateCartItem]);

  // Initialize component
  useEffect(() => {
    setMounted(true);

    // Only redirect to cart if it's empty AND an order wasn't just completed
    if (cart.items.length === 0 && !orderComplete) {
      router.push("/cart");
      return;
    }
    
    // Validate cart items when page loads
    validateCartItems();

    // Check if any product requires address
    const addressRequired = cart.items.some(item => 
      item.product.requiresAddress !== false // Handle undefined case as true
    );
    
    // Debug logging
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        "Address required:", 
        addressRequired, 
        "Products:", 
        cart.items.map(i => ({
          title: i.product.title, 
          requiresAddress: i.product.requiresAddress === undefined 
            ? "undefined (defaulting to required)" 
            : i.product.requiresAddress
        }))
      );
    }
    
    setIsAddressRequired(addressRequired);
    
    // Hide any active toasts when entering checkout
    if (typeof window !== "undefined") {
      // Dismiss any existing toasts
      hideToast();

      try {
        const authToken = localStorage.getItem("auth_token");
        const userInfoStr = localStorage.getItem("user_info");

        if (authToken && userInfoStr) {
          const userInfo = JSON.parse(userInfoStr);
          setLocalUser({
            id: userInfo.id,
            name: userInfo.name || "",
            email: userInfo.email || "",
            mobile: userInfo.mobile || "",
          });
          // Fill in form with user info
          setFormData((prevData) => ({
            ...prevData,
            fullName: userInfo.name || "",
            email: userInfo.email || "",
            mobile: userInfo.mobile || "",
          }));
        }
      } catch (error) {
        console.error("Error getting local user:", error);
      }
    }
  }, [hideToast, cart.items, router, orderComplete, validateCartItems]);

  // Update form data when session changes
  useEffect(() => {
    if (session?.user) {
      setFormData((prevData) => ({
        ...prevData,
        fullName: session.user.name || "",
        email: session.user.email || "",
        mobile: session.user.mobile || "",
      }));
    }
  }, [session]);

  // Check authentication and handle redirects
  useEffect(() => {
    if (!mounted || status === "loading") return;

    // Redirect if not a customer
    if (status === "authenticated" && session?.user?.type !== "customer") {
      router.push("/auth/customer-login?callbackUrl=/checkout");
      return;
    }

    // Redirect if not authenticated
    if (status === "unauthenticated" && !localUser) {
      router.push("/auth/customer-login?callbackUrl=/checkout");
      return;
    }
  }, [status, router, localUser, session, mounted]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type and size
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      showToast(
        "لطفاً فقط تصاویر با فرمت JPG یا PNG آپلود کنید.",
        undefined,
        "error"
      );
      return;
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      showToast("حجم تصویر نباید بیشتر از 5 مگابایت باشد.", undefined, "error");
      return;
    }

    setReceiptImage(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const fetchAddresses = useCallback(async () => {
    try {
      setIsAddressLoading(true);

      // دریافت توکن احراز هویت
      const token = localStorage.getItem("auth_token");

      if (!token) {
        console.error("No authentication token found");
        router.push("/auth/customer-login?callbackUrl=/checkout");
        return;
      }

      const response = await fetch("/api/customer/addresses", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        console.error("Error fetching addresses:", response.statusText);
        return;
      }

      const data = await response.json();

      if (data && data.addresses) {
        setAddresses(data.addresses);

        // اگر آدرس پیش‌فرضی وجود دارد، آن را انتخاب کن
        const defaultAddress = data.addresses.find(
          (address: CustomerAddress) => address.isDefault
        );
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);

          // پر کردن فرم با اطلاعات آدرس انتخاب شده
          setFormData((prevData) => ({
            ...prevData,
            fullName: defaultAddress.fullName,
            mobile: defaultAddress.mobile,
            address: defaultAddress.address,
            city: defaultAddress.city,
            province: defaultAddress.province,
            postalCode: defaultAddress.postalCode,
          }));
        } else if (data.addresses.length > 0) {
          // اگر آدرس پیش‌فرض نداریم، اولین آدرس را انتخاب کن
          setSelectedAddressId(data.addresses[0].id);

          // پر کردن فرم با اطلاعات آدرس انتخاب شده
          setFormData((prevData) => ({
            ...prevData,
            fullName: data.addresses[0].fullName,
            mobile: data.addresses[0].mobile,
            address: data.addresses[0].address,
            city: data.addresses[0].city,
            province: data.addresses[0].province,
            postalCode: data.addresses[0].postalCode,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    } finally {
      setIsAddressLoading(false);
    }
  }, [router, setIsAddressLoading]);

  const handleSelectAddress = (addressId: string) => {
    setSelectedAddressId(addressId);

    // یافتن آدرس انتخاب شده
    const selectedAddress = addresses.find(
      (address) => address.id === addressId
    );
    if (selectedAddress) {
      // پر کردن فرم با اطلاعات آدرس انتخاب شده
      setFormData((prevData) => ({
        ...prevData,
        fullName: selectedAddress.fullName,
        mobile: selectedAddress.mobile,
        address: selectedAddress.address,
        city: selectedAddress.city,
        province: selectedAddress.province,
        postalCode: selectedAddress.postalCode,
      }));
    }
  };

  const handleAddNewAddress = () => {
    setShowAddressForm(true);
    setSelectedAddressId(null);
  };

  const handleAddressFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setAddressFormData({
      ...addressFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaveNewAddress = async () => {
    try {
      setIsAddressLoading(true);

      // بررسی اعتبار داده‌ها
      if (
        !addressFormData.fullName ||
        !addressFormData.mobile ||
        !addressFormData.address ||
        !addressFormData.city ||
        !addressFormData.province ||
        !addressFormData.postalCode
      ) {
        setError("لطفاً تمام فیلدهای آدرس را پر کنید.");
        return;
      }

      // دریافت توکن احراز هویت
      const token = localStorage.getItem("auth_token");

      if (!token) {
        setError("مشکل در احراز هویت. لطفاً دوباره وارد شوید.");
        return;
      }

      const response = await fetch("/api/customer/addresses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          ...addressFormData,
          isDefault: addresses.length === 0, // اگر اولین آدرس است، آن را پیش‌فرض قرار می‌دهیم
        }),
      });

      if (!response.ok) {
        throw new Error("خطا در ذخیره آدرس");
      }

      const data = await response.json();

      // آدرس جدید را به لیست اضافه کن
      await fetchAddresses();

      // آدرس جدید را انتخاب کن
      if (data && data.address) {
        setSelectedAddressId(data.address.id);

        // پر کردن فرم با اطلاعات آدرس جدید
        setFormData((prevData) => ({
          ...prevData,
          fullName: data.address.fullName,
          mobile: data.address.mobile,
          address: data.address.address,
          city: data.address.city,
          province: data.address.province,
          postalCode: data.address.postalCode,
        }));
      }

      // بستن فرم آدرس جدید
      setShowAddressForm(false);

      // نمایش پیام موفقیت
      showToast("آدرس جدید با موفقیت اضافه شد", undefined, "success");
    } catch (error) {
      console.error("Error saving new address:", error);
      setError("خطا در ذخیره آدرس جدید");
    } finally {
      setIsAddressLoading(false);
    }
  };

  useEffect(() => {
    if (mounted && (session?.user?.id || localStorage.getItem("auth_token"))) {
      fetchAddresses();
    }
  }, [mounted, session, fetchAddresses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    // Dismiss any existing toasts before processing
    hideToast();

    try {
      // Basic validation - only validate address fields if required
      if (!formData.fullName || !formData.mobile) {
        throw new Error("لطفاً نام و شماره موبایل را وارد کنید.");
      }

      // Only validate address fields if address is required
      if (isAddressRequired && (
        !formData.address || 
        !formData.city || 
        !formData.province || 
        !formData.postalCode
      )) {
        throw new Error("لطفاً تمام فیلدهای آدرس را پر کنید.");
      }

      // Check if cart is empty
      if (cart.items.length === 0) {
        throw new Error("سبد خرید شما خالی است.");
      }

      // Get seller ID from cart
      // First convert to unknown then to our extended type to avoid type errors
      const productInCart = cart.items[0]?.product;
      console.log("Product in cart:", productInCart); // Debug log
      
      const product = productInCart as unknown as {
        id: string;
        sellerId?: string;
        shopId?: string;
        shop?: {
          id?: string;
          sellerId?: string;
        }
      };
      
      let sellerId = null;
      
      // Try all possible ways to get the sellerId
      if (product?.sellerId) {
        // Method 1: Direct sellerId property (old format)
        sellerId = product.sellerId;
        console.log("Found sellerId directly:", sellerId);
      } else if (product?.shop?.sellerId) {
        // Method 2: Through the shop object
        sellerId = product.shop.sellerId;
        console.log("Found sellerId through shop object:", sellerId);
      } else if (product?.shopId) {
        // Method 3: Fetch shop details using shopId
        try {
          // Use the public API endpoint instead of the seller-authenticated one
          console.log("Fetching shop info for shopId:", product.shopId);
          const response = await fetch(`/api/shops/${product.shopId}`);
          if (response.ok) {
            const data = await response.json();
            sellerId = data.shop?.sellerId || null;
            console.log("Found sellerId from API:", sellerId);
          } else {
            console.error("Shop API response not OK:", await response.text());
          }
        } catch (error) {
          console.error("Error fetching shop:", error);
        }
      } else if (product?.shop?.id) {
        // Method 4: Try using shop.id if shopId is not directly available
        try {
          console.log("Trying with shop.id:", product.shop.id);
          const response = await fetch(`/api/shops/${product.shop.id}`);
          if (response.ok) {
            const data = await response.json();
            sellerId = data.shop?.sellerId || null;
            console.log("Found sellerId from API using shop.id:", sellerId);
          }
        } catch (error) {
          console.error("Error fetching shop using shop.id:", error);
        }
      } else {
        // Method 5: Last resort - try to fetch the product details directly
        try {
          if (product?.id) {
            console.log("Last resort: fetching product directly:", product.id);
            const response = await fetch(`/api/products/${product.id}`);
            if (response.ok) {
              const productData = await response.json();
              if (productData.product?.shop?.sellerId) {
                sellerId = productData.product.shop.sellerId;
                console.log("Found sellerId from direct product API:", sellerId);
              }
            }
          }
        } catch (error) {
          console.error("Error fetching product directly:", error);
        }
      }
      
      // If we still don't have a sellerId, throw an error
      if (!sellerId) {
        throw new Error("اطلاعات فروشنده یافت نشد.");
      }

      // Create shipping address string (only if required or provided)
      let shippingAddress = null;
      if (isAddressRequired || (formData.address && formData.city)) {
        shippingAddress = `${formData.fullName}, ${formData.mobile}, ${formData.province || ''}, ${formData.city || ''}, ${formData.address || ''}, کدپستی: ${formData.postalCode || ''}`;
      }

      // Validate receipt upload for bank transfer
      if (!receiptImage) {
        throw new Error("لطفاً تصویر فیش واریزی را آپلود کنید.");
      }

      // Upload receipt to S3
      let receiptInfo = null;
      setUploadStatus("uploading");
      try {
        // Upload receipt to private S3 bucket via server API
        receiptInfo = await uploadReceiptToS3(
          receiptImage,
          `orders/${Date.now()}`
        );
        setUploadStatus("success");
      } catch (uploadError) {
        console.error("Error uploading receipt:", uploadError);
        setUploadStatus("error");
        throw new Error("خطا در آپلود فیش واریزی. لطفاً دوباره تلاش کنید.");
      }

      // Get auth token
      const authToken = localStorage.getItem("auth_token") || "";

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
        paymentMethod: "bank_transfer",
        shippingAddress,
        receiptInfo,
        addressId: isAddressRequired ? selectedAddressId : null,
      };

      // Create order
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "خطا در ثبت سفارش.");
      }

      const data = await response.json();

      // Set orderComplete flag to true to prevent cart redirect
      setOrderComplete(true);

      // First redirect to order page
      router.push(`/customer/orders/${data.orderId}`);

      // After redirect is initiated, clear cart and show toast
      setTimeout(() => {
        clearCart();
        showToast("سفارش شما با موفقیت ثبت شد!", undefined, "success");
      }, 100);
    } catch (err) {
      console.error("Error submitting order:", err);
      setError(err instanceof Error ? err.message : "خطا در ثبت سفارش.");
      showToast(
        err instanceof Error ? err.message : "خطا در ثبت سفارش.",
        undefined,
        "error"
      );
      setIsProcessing(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fa-IR", {
      style: "currency",
      currency: "IRR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Loading state
  if (!mounted || status === "loading" || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

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

      {isValidatingCart && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md mb-6 flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
          <span>در حال بروزرسانی اطلاعات محصولات...</span>
        </div>
      )}

      {hasCartChanges && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md mb-6">
          <p className="font-medium">تغییراتی در سبد خرید شما اعمال شده است.</p>
          <p className="text-sm mt-1">برخی محصولات تغییر قیمت یا موجودی داشته‌اند. لطفاً جزئیات را بررسی کنید.</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      {/* افزودن خلاصه سفارش در بالای صفحه برای نمای موبایل */}
      <div className="block lg:hidden mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-lg font-bold mb-4 text-gray-800 pb-3 border-b border-gray-200">
            خلاصه سفارش
          </h2>

          <div className="space-y-4 mb-4">
            {cart.items.map((item: CartItem) => (
              <div
                key={`${item.product.id}-${item.quantity}`}
                className="flex items-start space-x-3 space-x-reverse"
              >
                <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0 border border-gray-200">
                  {item.product.images && item.product.images.length > 0 ? (
                    <Image
                      src={item.product.images[0].imageUrl}
                      alt={item.product.title}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="bg-gray-100 w-full h-full flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800 text-sm">
                    {item.product.title}
                  </h3>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-500">
                      تعداد: {item.quantity}
                    </span>
                    <span className="text-sm font-medium">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-3 mt-3">
            <div className="flex justify-between py-2">
              <span className="text-gray-700">جمع خرید</span>
              <span className="font-medium">{formatPrice(cart.total)}</span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-gray-700">هزینه ارسال</span>
              <span className="font-medium text-green-600">رایگان</span>
            </div>

            <div className="flex justify-between py-3 border-t border-gray-200 mt-2 pt-2">
              <span className="font-bold text-gray-900">جمع کل</span>
              <span className="font-bold text-blue-600 text-lg">
                {formatPrice(cart.total)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid برای فرم تکمیل سفارش و خلاصه سفارش در دسکتاپ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* فرم تکمیل سفارش */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* اطلاعات شخصی */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-lg font-medium mb-4 text-gray-800">
                اطلاعات شخصی
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
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
                  <label
                    htmlFor="mobile"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
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
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
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
            <div className={`bg-white p-6 rounded-lg shadow-sm border ${!isAddressRequired ? 'border-green-100' : 'border-gray-100'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-medium text-gray-800">
                    آدرس تحویل
                  </h2>
                  {!isAddressRequired && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                      اختیاری
                    </span>
                  )}
                </div>

                {!isAddressRequired && (
                  <p className="text-sm text-gray-600">
                    محصول انتخابی شما نیازی به آدرس برای تحویل ندارد.
                  </p>
                )}

                {!showAddressForm && addresses.length > 0 && (
                  <button
                    type="button"
                    onClick={handleAddNewAddress}
                    className="inline-flex items-center px-3 py-1.5 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
                  >
                    <TbPlus className="ml-1 h-4 w-4" />
                    آدرس جدید
                  </button>
                )}
              </div>

              {isAddressLoading ? (
                <div className="py-10 flex justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <>
                  {!showAddressForm && addresses.length > 0 ? (
                    <div className="space-y-4 mb-6">
                      {addresses.map((address) => (
                        <div
                          key={address.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-all duration-150 ${
                            selectedAddressId === address.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-blue-300"
                          }`}
                          onClick={() => handleSelectAddress(address.id)}
                        >
                          <div className="flex items-start">
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-1 ml-3 ${
                                selectedAddressId === address.id
                                  ? "border-blue-500 bg-blue-500"
                                  : "border-gray-300"
                              }`}
                            >
                              {selectedAddressId === address.id && (
                                <TbCheck className="text-white h-4 w-4" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-bold text-gray-900">
                                  {address.fullName}
                                </h3>
                                {address.isDefault && (
                                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                                    پیش‌فرض
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {address.mobile}
                              </p>
                              <p className="text-sm text-gray-800 mt-2">
                                {address.province}، {address.city}،{" "}
                                {address.address}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                کد پستی: {address.postalCode}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}

                      {!isAddressRequired && (
                        <div
                          className={`border rounded-lg p-4 cursor-pointer transition-all duration-150 ${
                            selectedAddressId === null
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200 hover:border-green-300"
                          }`}
                          onClick={() => setSelectedAddressId(null)}
                        >
                          <div className="flex items-start">
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-1 ml-3 ${
                                selectedAddressId === null
                                  ? "border-green-500 bg-green-500"
                                  : "border-gray-300"
                              }`}
                            >
                              {selectedAddressId === null && (
                                <TbCheck className="text-white h-4 w-4" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-gray-900">
                                بدون آدرس فیزیکی
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                محصول شما نیازی به آدرس فیزیکی برای تحویل ندارد
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : showAddressForm ? (
                    <div className="border border-gray-200 rounded-lg p-5">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-900">
                          افزودن آدرس جدید {!isAddressRequired && "(اختیاری)"}
                        </h3>
                        <button
                          type="button"
                          onClick={() => setShowAddressForm(false)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <TbX className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            نام و نام خانوادگی گیرنده *
                          </label>
                          <input
                            name="fullName"
                            type="text"
                            value={addressFormData.fullName}
                            onChange={handleAddressFormChange}
                            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            شماره موبایل گیرنده *
                          </label>
                          <input
                            name="mobile"
                            type="tel"
                            value={addressFormData.mobile}
                            onChange={handleAddressFormChange}
                            dir="ltr"
                            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            استان *
                          </label>
                          <input
                            name="province"
                            type="text"
                            value={addressFormData.province}
                            onChange={handleAddressFormChange}
                            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            شهر *
                          </label>
                          <input
                            name="city"
                            type="text"
                            value={addressFormData.city}
                            onChange={handleAddressFormChange}
                            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            آدرس دقیق پستی *
                          </label>
                          <textarea
                            name="address"
                            value={addressFormData.address}
                            onChange={handleAddressFormChange}
                            rows={3}
                            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            کد پستی *
                          </label>
                          <input
                            name="postalCode"
                            type="text"
                            value={addressFormData.postalCode}
                            onChange={handleAddressFormChange}
                            dir="ltr"
                            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                            placeholder="10 رقم بدون خط تیره"
                          />
                        </div>
                      </div>

                      <div className="mt-5 flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setShowAddressForm(false)}
                          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          انصراف
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveNewAddress}
                          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                          disabled={isAddressLoading}
                        >
                          {isAddressLoading ? (
                            <span className="flex items-center">
                              <TbLoader className="animate-spin ml-2 h-4 w-4" />
                              در حال ذخیره...
                            </span>
                          ) : (
                            "ذخیره آدرس"
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 px-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <TbMapPin className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-base font-medium text-gray-800">
                        {isAddressRequired ? "آدرسی ثبت نشده است" : "آدرس برای این محصول اختیاری است"}
                      </h3>
                      <p className="mt-2 text-sm text-gray-600 text-center">
                        {isAddressRequired 
                          ? "برای تکمیل سفارش نیاز به ثبت آدرس دارید. لطفاً آدرس خود را وارد کنید."
                          : "محصول شما نیازی به آدرس فیزیکی ندارد. در صورت تمایل می‌توانید آدرس اضافه کنید."}
                      </p>
                      <button
                        type="button"
                        onClick={handleAddNewAddress}
                        className={`mt-4 px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${
                          isAddressRequired 
                            ? "border-transparent bg-blue-600 hover:bg-blue-700 text-white" 
                            : "border-green-300 bg-green-50 hover:bg-green-100 text-green-700"
                        }`}
                      >
                        افزودن آدرس{!isAddressRequired && " (اختیاری)"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* روش پرداخت */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-lg font-medium mb-4 text-gray-800">
                روش پرداخت
              </h2>

              <div className="space-y-4">
                <div className="border rounded-lg p-4 cursor-not-allowed opacity-60 transition-all duration-200">
                  <div className="flex items-center">
                    <div className="w-5 h-5 rounded-full border-gray-300 flex-shrink-0 ml-3"></div>
                    <div className="flex items-center">
                      <FiCreditCard className="ml-2 text-gray-600" />
                      <div className="flex-grow">
                        <h3 className="font-medium text-gray-900">
                          پرداخت آنلاین
                        </h3>
                        <p className="text-sm text-gray-500">
                          پرداخت آنلاین با تمامی کارت‌های بانکی عضو شتاب
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pr-8 text-xs text-red-600 bg-red-50 p-2 rounded-md border border-red-100">
                    پرداخت آنلاین در حال حاضر فعال نیست. لطفاً از روش انتقال
                    بانکی استفاده کنید.
                  </div>
                </div>

                <div className="border rounded-lg p-4 border-blue-500 bg-blue-50">
                  <div className="flex items-center">
                    <div className="w-5 h-5 rounded-full border-2 border-blue-500 bg-blue-500 flex-shrink-0 ml-3"></div>
                    <div className="flex items-center">
                      <FiDollarSign className="ml-2 text-gray-600" />
                      <div className="flex-grow">
                        <h3 className="font-medium text-gray-900">
                          انتقال بانکی
                        </h3>
                        <p className="text-sm text-gray-500">
                          واریز به حساب و آپلود فیش پرداخت
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-700 mb-2">
                      لطفا مبلغ{" "}
                      <span className="font-bold">
                        {formatPrice(cart.total)}
                      </span>{" "}
                      را به شماره حساب زیر واریز نمایید:
                    </p>
                    <div className="bg-white p-3 rounded border border-gray-200 text-center mb-3">
                      <p className="font-bold text-gray-900 text-lg">
                        IR06-0570-0123-4567-8901-2345-67
                      </p>
                      <p className="text-sm text-gray-600">
                        بانک ملت - به نام شرکت بایوسل
                      </p>
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
                          receiptPreview
                            ? "border-blue-300 bg-blue-50"
                            : "border-gray-300 hover:border-blue-300"
                        }`}
                      >
                        {receiptPreview ? (
                          <div className="relative">
                            <Image
                              src={receiptPreview}
                              alt="پیش‌نمایش فیش"
                              width={300}
                              height={200}
                              className="max-h-48 max-w-md mx-auto object-contain rounded"
                            />
                            <p className="text-sm text-blue-600 mt-2">
                              برای تغییر تصویر کلیک کنید
                            </p>
                          </div>
                        ) : (
                          <>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-12 w-12 mx-auto text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <p className="mt-2 text-sm text-gray-600">
                              تصویر فیش واریزی را اینجا بکشید و رها کنید یا کلیک
                              کنید
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              فرمت‌های مجاز: JPG و PNG (حداکثر 5 مگابایت)
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* دکمه ثبت سفارش */}
            <div className="mt-6">
              <button
                type="submit"
                disabled={isProcessing || !receiptImage}
                className={`w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg transition-all duration-300 font-medium 
                  ${
                    isProcessing
                      ? "opacity-80"
                      : "opacity-100 hover:shadow-lg hover:shadow-blue-500/20 animate-pulse-button"
                  } 
                  disabled:opacity-70 disabled:cursor-not-allowed disabled:animate-none`}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {uploadStatus === "uploading"
                      ? "در حال آپلود فیش..."
                      : "در حال پردازش..."}
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <FiCheck className="ml-2 h-5 w-5" />
                    آپلود فیش و تکمیل سفارش
                  </span>
                )}
              </button>
              <p className="text-center text-xs text-gray-500 mt-2">
                با کلیک روی این دکمه، شما با تمام شرایط و قوانین بایوسل موافقت
                می‌کنید
              </p>
            </div>
          </form>
        </div>

        {/* خلاصه سفارش برای نمای دسکتاپ */}
        <div className="hidden lg:block">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 sticky top-4">
            <h2 className="text-lg font-bold mb-4 text-gray-800 pb-3 border-b border-gray-200">
              خلاصه سفارش
            </h2>

            <div className="divide-y divide-gray-200">
              {cart.items.map((item: CartItem) => (
                <div
                  key={`${item.product.id}-${item.quantity}`}
                  className="py-3 flex items-start space-x-3 space-x-reverse"
                >
                  <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0 border border-gray-200">
                    {item.product.images && item.product.images.length > 0 ? (
                      <Image
                        src={item.product.images[0].imageUrl}
                        alt={item.product.title}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="bg-gray-100 w-full h-full flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800 text-sm">
                      {item.product.title}
                    </h3>
                    <p className="text-xs text-gray-600 mt-1">
                      تعداد: {item.quantity}
                    </p>
                    <p className="font-medium text-gray-900 mt-1">
                      {formatPrice(item.product.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}

              <div className="py-3 mt-2">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-gray-600">جمع سبد خرید:</p>
                  <p className="font-medium">{formatPrice(cart.total)}</p>
                </div>

                <div className="flex justify-between items-center mb-2">
                  <p className="text-gray-600">هزینه ارسال:</p>
                  <p className="font-medium text-green-600">رایگان</p>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-200 mt-2">
                  <p className="text-lg font-bold text-gray-800">
                    مبلغ قابل پرداخت:
                  </p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatPrice(cart.total)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="flex items-start">
                <svg
                  className="h-5 w-5 text-blue-500 mt-0.5 ml-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-xs leading-relaxed text-gray-600">
                  تحویل سفارش شما پس از تایید پرداخت، بین ۲ تا ۵ روز کاری انجام
                  خواهد شد.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
