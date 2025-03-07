"use client";

import { useState, useEffect, TouchEvent } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { useCartStore } from "@/app/store/cart";
import { Product, ProductImage } from "@/app/types";
import {
  User,
  Heart,
  MessageCircle,
  ExternalLink,
  Grid,
  ChevronLeft,
  ChevronRight,
  X,
  Share2,
  Minus,
  Plus,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import { useToastStore } from "@/app/store/toast";
import { ensureValidImageUrl } from "@/utils/s3-storage";

// تعریف انواع داده
interface Seller {
  id: string;
  username: string;
  shopName: string;
  bio?: string;
  profileImage?: string;
  isActive: boolean;
}

/**
 * ShopPage component displays a seller's profile and products
 *
 * This component now uses the path segments from Next.js routing
 * instead of directly accessing params to avoid the Next.js warning
 * about synchronously accessing params properties.
 */
export default function ShopPage() {
  const router = useRouter();
  const pathname = usePathname();
  const addToCart = useCartStore((state) => state.addToCart);
  const hydrate = useCartStore((state) => state.hydrate);
  const showToast = useToastStore((state) => state.showToast);

  // Extract username from pathname more reliably
  const username = pathname.split("/shop/")[1]?.split("/")[0];

  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [slideDirection, setSlideDirection] = useState<"next" | "prev" | null>(
    null
  );

  // Ensure image URLs are valid in the product dialog
  const processProductImages = (product: Product) => {
    if (product.images && product.images.length > 0) {
      return {
        ...product,
        images: product.images.map((img: ProductImage) => ({
          ...img,
          imageUrl: ensureValidImageUrl(img.imageUrl),
        })),
      };
    }

    return {
      ...product,
      imageUrl: ensureValidImageUrl(product.imageUrl),
    };
  };

  // Hydrate cart from localStorage on initial load
  useEffect(() => {
    const hydrateData = async () => {
      await Promise.resolve();
      hydrate();
      setMounted(true);
    };

    hydrateData();
  }, [hydrate]);

  // دریافت اطلاعات فروشنده
  useEffect(() => {
    const fetchSeller = async () => {
      try {
        if (!username) return;
        
        const response = await fetch(`/api/shop/${username}`);
        
        if (!response.ok) {
          throw new Error("فروشنده یافت نشد");
        }
        
        const data = await response.json();
        
        if (!data.seller) {
          throw new Error("فروشنده یافت نشد");
        }
        
        setSeller(data.seller);
        
        // پس از دریافت اطلاعات فروشنده، محصولات را دریافت می‌کنیم
        await fetchProducts(data.seller.id);
      } catch (error) {
        setError(error instanceof Error ? error.message : "خطا در دریافت اطلاعات فروشنده");
        setLoading(false);
      }
    };
    
    const fetchProducts = async (sellerId: string) => {
      try {
        const response = await fetch(`/api/products?sellerId=${sellerId}`);
        
        if (!response.ok) {
          throw new Error("خطا در دریافت محصولات");
        }
        
        const data = await response.json();
        
        // Make sure we're getting an array
        const productsList = Array.isArray(data.products) ? data.products : [];
        
        // Process product images to ensure they have valid URLs
        const processedProducts = productsList.map(processProductImages);
        
        setProducts(processedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSeller();
  }, [username]);

  // Reset image index when product changes
  useEffect(() => {
    setCurrentImageIndex(0);
    setSlideDirection(null);
  }, [selectedProduct]);

  // Functions for product details
  const openProductDetails = (product: Product) => {
    setSelectedProduct(processProductImages(product));
    setQuantity(1);
    setCurrentImageIndex(0);
    setSlideDirection(null);
    setIsProductModalOpen(true);
  };

  const closeProductDetails = () => {
    setSelectedProduct(null);
    setIsProductModalOpen(false);
  };

  // توابع مربوط به تعداد محصول
  const incrementQuantity = () => {
    if (selectedProduct?.inventory && quantity < selectedProduct.inventory) {
      setQuantity((prev) => prev + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  // تابع افزودن به سبد خرید
  const handleAddToCart = () => {
    if (selectedProduct) {
      try {
        // استفاده از استور zustand برای مدیریت سبد خرید
        addToCart(selectedProduct, quantity);

        // Show toast with action buttons
        showToast(
          `${quantity} عدد ${selectedProduct.title} به سبد خرید اضافه شد`,
          [
            {
              label: "تکمیل سفارش",
              onClick: () => router.push("/cart"),
            },
            {
              label: "ادامه خرید",
              onClick: () => {
                useToastStore.getState().hideToast();
                closeProductDetails();
              },
            },
          ]
        );

        // بستن مودال محصول
        closeProductDetails();
      } catch (error) {
        console.error("خطا در افزودن به سبد خرید:", error);
        alert("خطا در افزودن به سبد خرید. لطفاً دوباره تلاش کنید.");
      }
    }
  };

  // Handle thumbnail click to change the displayed image
  const handleThumbnailClick = (index: number) => {
    // Determine slide direction for animation
    setSlideDirection(index > currentImageIndex ? "next" : "prev");
    setCurrentImageIndex(index);
  };

  // Swipe functionality for image gallery
  const handleTouchStart = (e: TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isSignificantSwipe = Math.abs(distance) > 50; // Minimum swipe distance

    if (!isSignificantSwipe) {
      // If the swipe wasn't significant, reset touch state and return
      setTouchStart(null);
      setTouchEnd(null);
      return;
    }

    if (!selectedProduct?.images || selectedProduct.images.length <= 1) {
      // No need for swipe if there's only one image
      setTouchStart(null);
      setTouchEnd(null);
      return;
    }

    // FIX: Corrected the swipe direction logic to match RTL expectations and our new animations
    // When swiping right-to-left (distance > 0), we show the next image
    // When swiping left-to-right (distance < 0), we show the previous image
    if (distance > 0) {
      // Swipe right-to-left (show next image)
      setSlideDirection("next");
      setCurrentImageIndex((prev) =>
        selectedProduct.images && prev === selectedProduct.images.length - 1
          ? 0
          : prev + 1
      );
    } else {
      // Swipe left-to-right (show previous image)
      setSlideDirection("prev");
      setCurrentImageIndex((prev) =>
        selectedProduct.images && prev === 0
          ? selectedProduct.images.length - 1
          : prev - 1
      );
    }

    // Reset touch state
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Navigation functions for image gallery
  const navigateToNextImage = () => {
    if (!selectedProduct?.images) return;
    setSlideDirection("next");
    const imagesLength = selectedProduct.images.length;
    setCurrentImageIndex((prev) => (prev === imagesLength - 1 ? 0 : prev + 1));
  };

  const navigateToPrevImage = () => {
    if (!selectedProduct?.images) return;
    setSlideDirection("prev");
    const imagesLength = selectedProduct.images.length;
    setCurrentImageIndex((prev) => (prev === 0 ? imagesLength - 1 : prev - 1));
  };

  // نمایش بارگذاری
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-700 text-lg">در حال بارگذاری...</p>
      </div>
    );
  }

  // نمایش خطا
  if (error || !seller) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white border border-gray-200 shadow-md rounded-lg max-w-md w-full p-8 text-center">
          <div className="mx-auto w-20 h-20 flex items-center justify-center rounded-full bg-red-50 mb-6">
            <X className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            فروشنده یافت نشد
          </h2>
          <p className="text-gray-600 mb-6">
            {error === "فروشنده یافت نشد"
              ? "متأسفانه فروشنده مورد نظر شما در سیستم وجود ندارد."
              : error || "مشکلی در بارگذاری اطلاعات فروشنده رخ داده است."}
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            بازگشت به صفحه اصلی
          </button>
        </div>
      </div>
    );
  }

  const handleProductClick = (product: Product) => {
    openProductDetails(product);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white max-w-6xl mx-auto">
      {/* هدر فروشگاه */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <h1 className="text-xl font-semibold text-gray-900">
            {seller.shopName}
          </h1>
          <Link href="/cart" className="relative">
            <ShoppingBag className="h-6 w-6 text-gray-800" />
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* بخش پروفایل */}
        <div className="p-4 border-b border-gray-200 md:px-8 md:py-6">
          <div className="md:max-w-4xl md:mx-auto">
            <div className="flex items-center">
              <div className="relative h-20 w-20 md:h-24 md:w-24 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                {seller.profileImage ? (
                  <Image
                    src={seller.profileImage}
                    alt={seller.shopName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <User className="h-10 w-10 md:h-12 md:w-12 text-gray-400" />
                  </div>
                )}
              </div>

              <div className="flex-1 mr-4 md:mr-6">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                  @{seller.username}
                </h2>
                <p className="text-gray-700 text-sm md:text-base mt-1">
                  {seller.bio || `فروشگاه رسمی ${seller.shopName}`}
                </p>
              </div>
            </div>

            {/* آمار فروشگاه */}
            <div className="flex justify-around mt-5 md:w-1/2 md:justify-between">
              <div className="text-center">
                <div className="font-bold text-gray-900 md:text-lg">
                  {products.length}
                </div>
                <div className="text-xs md:text-sm text-gray-600 font-medium">
                  محصولات
                </div>
              </div>
              <div className="text-center">
                <div className="font-bold text-gray-900 md:text-lg">0</div>
                <div className="text-xs md:text-sm text-gray-600 font-medium">
                  مشتریان
                </div>
              </div>
              <div className="text-center">
                <div className="font-bold text-gray-900 md:text-lg">0</div>
                <div className="text-xs md:text-sm text-gray-600 font-medium">
                  نظرات
                </div>
              </div>
            </div>

            <div className="mt-4 md:mt-6 md:max-w-xs">
              <button className="w-full bg-blue-500 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-600 transition-colors">
                دنبال کردن
              </button>
            </div>
          </div>
        </div>

        {/* گرید محصولات */}
        <div className="p-1 md:p-4 md:max-w-6xl md:mx-auto">
          {products && products.length > 0 ? (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 md:gap-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="aspect-square cursor-pointer relative md:rounded-md md:shadow-sm md:overflow-hidden"
                  onClick={() => openProductDetails(product)}
                >
                  {product.images && product.images.length > 0 ? (
                    <Image
                      src={product.images[0].imageUrl}
                      alt={product.title}
                      fill
                      className="object-cover"
                    />
                  ) : product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <Grid className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-xs md:text-sm font-medium">
                    {product.price.toLocaleString("fa-IR")} تومان
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Grid className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                این فروشگاه هنوز محصولی ندارد
              </p>
            </div>
          )}
        </div>
      </main>

      {/* فوتر */}
      <footer className="bg-white border-t border-gray-200 py-4 px-6 text-center">
        <p className="text-xs md:text-sm text-gray-600">
          قدرت گرفته از <span className="font-medium">بایوسل</span>
        </p>
      </footer>

      {/* مودال نمایش جزئیات محصول */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-75 flex justify-center items-start md:items-center">
          <div className="bg-white w-full h-full md:h-auto md:max-w-5xl md:max-h-[85vh] md:rounded-lg md:overflow-hidden flex flex-col">
            {/* هدر مودال */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <button
                onClick={closeProductDetails}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
              <h2 className="text-lg font-semibold text-gray-900 truncate mx-2 text-center">
                {selectedProduct.title}
              </h2>
              <div className="w-6" />
            </div>

            {/* محتوای مودال */}
            <div className="flex-1 overflow-y-auto p-0 md:p-4">
              <div className="md:grid md:grid-cols-2 md:gap-8">
                {/* تصویر محصول */}
                <div className="md:sticky md:top-0">
                  <div
                    className="aspect-square relative bg-gray-100 md:rounded-lg overflow-hidden"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    {/* Navigation arrows for desktop */}
                    {selectedProduct.images &&
                      selectedProduct.images.length > 1 && (
                        <>
                          <button
                            onClick={navigateToNextImage}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-2 shadow-md z-10 hidden md:block"
                            aria-label="تصویر بعدی"
                          >
                            <ChevronLeft className="h-5 w-5 text-gray-600" />
                          </button>
                          <button
                            onClick={navigateToPrevImage}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-2 shadow-md z-10 hidden md:block"
                            aria-label="تصویر قبلی"
                          >
                            <ChevronRight className="h-5 w-5 text-gray-600" />
                          </button>
                        </>
                      )}

                    {/* Image slider container */}
                    <div className="relative w-full h-full overflow-hidden">
                      {/* Display the current image with slide animation */}
                      {selectedProduct.images &&
                      selectedProduct.images.length > 0 ? (
                        <div
                          className={`w-full h-full ${
                            slideDirection === "next"
                              ? "animate-slide-next"
                              : slideDirection === "prev"
                              ? "animate-slide-prev"
                              : ""
                          }`}
                        >
                          <Image
                            src={
                              selectedProduct.images[currentImageIndex].imageUrl
                            }
                            alt={selectedProduct.title}
                            fill
                            className="object-contain"
                            priority={true}
                          />

                          {/* Improved swipe indicator with better design */}
                          {selectedProduct.images.length > 1 && (
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 rtl:space-x-reverse px-3 py-2 bg-black bg-opacity-30 rounded-full md:hidden">
                              {selectedProduct.images.map((_, index) => (
                                <div
                                  key={index}
                                  className={`rounded-full transition-all duration-300 ${
                                    currentImageIndex === index
                                      ? "w-3 h-3 bg-white"
                                      : "w-2 h-2 bg-white bg-opacity-50"
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ) : selectedProduct.imageUrl ? (
                        <Image
                          src={selectedProduct.imageUrl}
                          alt={selectedProduct.title}
                          fill
                          className="object-contain"
                          priority={true}
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Grid className="h-16 w-16 text-gray-300" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* نمایش تصاویر چندگانه */}
                  {selectedProduct.images &&
                    selectedProduct.images.length > 1 && (
                      <div className="mt-2 px-4 overflow-x-auto">
                        <div className="flex space-x-2 rtl:space-x-reverse">
                          {selectedProduct.images.map((image, index) => (
                            <div
                              key={index}
                              onClick={() => handleThumbnailClick(index)}
                              className={`w-16 h-16 rounded-md overflow-hidden border flex-shrink-0 cursor-pointer transition-all duration-200 ${
                                currentImageIndex === index
                                  ? "border-blue-500 ring-2 ring-blue-300"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                              aria-label={`نمایش تصویر ${index + 1}`}
                              tabIndex={0}
                              onKeyDown={(e) =>
                                e.key === "Enter" && handleThumbnailClick(index)
                              }
                            >
                              <Image
                                src={image.imageUrl}
                                alt={`${selectedProduct.title} - تصویر ${
                                  index + 1
                                }`}
                                width={64}
                                height={64}
                                className="object-cover w-full h-full"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                {/* اطلاعات محصول */}
                <div className="p-4 md:p-0">
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                    {selectedProduct.title}
                  </h1>

                  <div className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
                    {selectedProduct.price.toLocaleString("fa-IR")} تومان
                  </div>

                  <div className="prose prose-sm text-gray-700 mb-6">
                    <p className="whitespace-pre-line">
                      {selectedProduct.description}
                    </p>
                  </div>

                  {/* دکمه‌های عملیاتی */}
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-4 rtl:space-x-reverse">
                      <button className="text-gray-500 hover:text-red-500">
                        <Heart className="h-6 w-6" />
                      </button>
                      <button className="text-gray-500 hover:text-blue-500">
                        <MessageCircle className="h-6 w-6" />
                      </button>
                      <button className="text-gray-500 hover:text-black">
                        <Share2 className="h-6 w-6" />
                      </button>
                    </div>
                    <div className="text-sm text-gray-500">
                      {(selectedProduct.likes_count ||
                        selectedProduct?.likesCount ||
                        0) > 0
                        ? `${
                            selectedProduct.likes_count ||
                            selectedProduct?.likesCount
                          } لایک`
                        : "0 لایک"}
                    </div>
                  </div>

                  {/* انتخاب تعداد */}
                  {selectedProduct.inventory &&
                    selectedProduct.inventory > 0 && (
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          تعداد
                        </label>
                        <div className="flex items-center">
                          <button
                            className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-300 bg-white text-gray-500 hover:bg-gray-100"
                            onClick={decrementQuantity}
                            disabled={quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-12 text-center text-gray-900 font-medium">
                            {quantity}
                          </span>
                          <button
                            className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-300 bg-white text-gray-500 hover:bg-gray-100"
                            onClick={incrementQuantity}
                            disabled={
                              !selectedProduct.inventory ||
                              quantity >= selectedProduct.inventory
                            }
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}

                  {/* دکمه افزودن به سبد خرید */}
                  {selectedProduct.inventory &&
                  selectedProduct.inventory > 0 ? (
                    <button
                      className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                      onClick={handleAddToCart}
                    >
                      افزودن به سبد خرید
                    </button>
                  ) : (
                    <button
                      className="w-full bg-gray-200 text-gray-500 py-3 rounded-lg font-semibold cursor-not-allowed"
                      disabled
                    >
                      ناموجود
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
