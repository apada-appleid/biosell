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
  // بجای گرفتن username از مسیر /shop، مستقیماً از ریشه URL می‌گیریم
  const username = pathname.split("/")[1];

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
  const [isAddingToCart, setIsAddingToCart] = useState(false);

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
        
        // استفاده از API جدید که مستقیماً با نام کاربری کار می‌کند
        const response = await fetch(`/api/${username}`);
        
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
    if (selectedProduct?.inventory && quantity < selectedProduct?.inventory) {
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
        setIsAddingToCart(true);
        
        // استفاده از استور zustand برای مدیریت سبد خرید
        addToCart(selectedProduct, quantity);

        // بستن مودال محصول
        closeProductDetails();

        // Show toast with action buttons and auto-dismiss behavior
        showToast(
          `${quantity} عدد ${selectedProduct.title} به سبد خرید اضافه شد`,
          [
            {
              label: "تکمیل سفارش",
              onClick: () => router.push("/cart"),
              autoDismiss: true
            },
            {
              label: "ادامه خرید",
              onClick: () => {
                // Close toast and continue shopping
                useToastStore.getState().hideToast();
              },
              autoDismiss: true
            },
          ],
          'success',
          8000 // Longer time for user to decide
        );
        
        setIsAddingToCart(false);
      } catch (error) {
        console.error("خطا در افزودن به سبد خرید:", error);
        showToast(
          "خطا در افزودن به سبد خرید. لطفاً دوباره تلاش کنید.",
          undefined,
          'error'
        );
        setIsAddingToCart(false);
      }
    }
  };
  
  // Function to navigate directly to cart
  const handleGoToCart = () => {
    // First close the modal
    closeProductDetails();
    
    // Hide any existing toast notifications
    useToastStore.getState().hideToast();
    
    // Navigate to cart
    router.push("/cart");
  };

  // Handle thumbnail click to change the displayed image
  const handleThumbnailClick = (index: number) => {
    // Determine slide direction for animation
    setSlideDirection(index > currentImageIndex ? "next" : "prev");
    setCurrentImageIndex(index);
  };

  // Touch events for mobile swipe
  const handleTouchStart = (e: TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (selectedProduct?.images && selectedProduct.images.length > 0) {
      if (isLeftSwipe && currentImageIndex < selectedProduct.images.length - 1) {
        // Swiped left - show next image
        setSlideDirection("next");
        setCurrentImageIndex(current => current + 1);
      } else if (isRightSwipe && currentImageIndex > 0) {
        // Swiped right - show previous image
        setSlideDirection("prev");
        setCurrentImageIndex(current => current - 1);
      }
    }
    
    // Reset touch positions
    setTouchStart(null);
    setTouchEnd(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-lg font-semibold text-gray-700">
            در حال بارگذاری فروشگاه...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">خطا</h2>
          <p className="text-lg text-gray-700 mb-6">{error}</p>
          <Link
            href="/"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            بازگشت به صفحه اصلی
          </Link>
        </div>
      </div>
    );
  }

  // Image navigation in carousel
  const navigateToNextImage = () => {
    if (selectedProduct?.images && currentImageIndex < selectedProduct.images.length - 1) {
      setSlideDirection("next");
      setCurrentImageIndex(current => current + 1);
    }
  };

  const navigateToPrevImage = () => {
    if (currentImageIndex > 0) {
      setSlideDirection("prev");
      setCurrentImageIndex(current => current - 1);
    }
  };

  // Handle product click
  const handleProductClick = (product: Product) => {
    openProductDetails(product);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <Link
            href="/"
            className="text-gray-800 hover:text-gray-600"
            aria-label="Back to home"
          >
            <ChevronRight className="h-6 w-6" />
          </Link>
          
          <div className="flex items-center">
            <Link
              href="/cart"
              className="text-gray-700 hover:text-gray-900 relative"
              aria-label="سبد خرید"
            >
              <ShoppingBag className="h-6 w-6" />
              {mounted && (useCartStore.getState().cart.items.length > 0) && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {useCartStore.getState().cart.items.length}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Seller Profile */}
      <div className="bg-white py-6 px-4 border-b border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <div className="relative h-16 w-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
              {seller?.profileImage ? (
                <Image
                  src={ensureValidImageUrl(seller.profileImage)}
                  alt={seller.shopName}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <User className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {seller?.shopName}
              </h1>
              <div className="flex items-center space-x-3 rtl:space-x-reverse mt-1">
                <span className="text-sm text-gray-500">
                  @{seller?.username}
                </span>
              </div>
            </div>
          </div>

          {seller?.bio && (
            <p className="mt-4 text-gray-700 text-sm">{seller.bio}</p>
          )}

          <div className="flex mt-4 space-x-2 rtl:space-x-reverse">
            <a
              href={`https://instagram.com/${seller?.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 space-x-1 rtl:space-x-reverse"
              aria-label={`Visit ${seller?.username} on Instagram`}
            >
              <ExternalLink className="h-4 w-4" />
              <span>اینستاگرام</span>
            </a>
            <button
              onClick={() => {
                navigator.share({
                  title: seller?.shopName,
                  url: window.location.href,
                });
              }}
              className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 space-x-1 rtl:space-x-reverse"
              aria-label="Share this shop"
            >
              <Share2 className="h-4 w-4" />
              <span>اشتراک‌گذاری</span>
            </button>
          </div>
        </div>
      </div>

      {/* Products */}
      <main className="flex-grow px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            محصولات
          </h2>

          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                در حال حاضر محصولی در این فروشگاه موجود نیست.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleProductClick(product)}
                >
                  <div className="relative h-48">
                    <Image
                      src={product.imageUrl || (product.images && product.images.length > 0 ? product.images[0].imageUrl : "/placeholder-product.jpg")}
                      alt={product.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {product.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 truncate">
                      {product.description}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-blue-600 font-semibold">
                        {product.price.toLocaleString("fa-IR")} تومان
                      </span>
                      {product.inventory !== undefined && product.inventory !== null && product.inventory < 10 && product.inventory > 0 && (
                        <span className="text-xs text-red-500">
                          {product.inventory} عدد باقی‌مانده
                        </span>
                      )}
                      {product.inventory !== undefined && product.inventory !== null && product.inventory === 0 && (
                        <span className="text-xs text-red-500">ناموجود</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Product Details Modal */}
      {isProductModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-75 overflow-y-auto p-4">
          <div className="bg-white rounded-lg w-full max-w-xl mx-auto my-8 overflow-hidden relative">
            <button
              className="absolute top-3 right-3 z-10 bg-white bg-opacity-80 rounded-full p-1"
              onClick={closeProductDetails}
              aria-label="Close product details"
            >
              <X className="h-6 w-6 text-gray-700" />
            </button>

            {/* Product Images Carousel */}
            <div className="relative h-80 w-full bg-gray-100">
              {selectedProduct.images && selectedProduct.images.length > 0 ? (
                <>
                  <div
                    className="h-full w-full relative touch-manipulation"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    <div
                      className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
                        slideDirection === "next"
                          ? "translate-x-full rtl:-translate-x-full animate-slide-in-rtl"
                          : slideDirection === "prev"
                          ? "-translate-x-full rtl:translate-x-full animate-slide-in-ltr"
                          : ""
                      }`}
                    >
                      <Image
                        src={selectedProduct.images[currentImageIndex].imageUrl}
                        alt={`${selectedProduct.title} - تصویر ${currentImageIndex + 1}`}
                        fill
                        priority={currentImageIndex === 0}
                        sizes="(max-width: 768px) 100vw, 768px"
                        className="object-contain"
                      />
                    </div>
                  </div>

                  {/* Thumbnails */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 rtl:space-x-reverse">
                    {selectedProduct.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => handleThumbnailClick(index)}
                        className={`h-2 w-2 rounded-full ${
                          index === currentImageIndex
                            ? "bg-blue-600"
                            : "bg-gray-300"
                        }`}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>

                  {/* Navigation arrows */}
                  {selectedProduct.images && selectedProduct.images.length > 1 && (
                    <>
                      <button
                        onClick={navigateToPrevImage}
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-1 ${
                          currentImageIndex === 0
                            ? "opacity-50 cursor-not-allowed"
                            : "opacity-100"
                        }`}
                        disabled={currentImageIndex === 0}
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="h-6 w-6 text-gray-700" />
                      </button>
                      <button
                        onClick={navigateToNextImage}
                        className={`absolute right-3 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-1 ${
                          selectedProduct.images &&
                          currentImageIndex === selectedProduct.images.length - 1
                            ? "opacity-50 cursor-not-allowed"
                            : "opacity-100"
                        }`}
                        disabled={
                          selectedProduct.images &&
                          currentImageIndex === selectedProduct.images.length - 1
                        }
                        aria-label="Next image"
                      >
                        <ChevronRight className="h-6 w-6 text-gray-700" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <Image
                  src={selectedProduct.imageUrl || "/placeholder-product.jpg"}
                  alt={selectedProduct.title}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 768px"
                  className="object-contain"
                />
              )}
            </div>

            {/* Product Details */}
            <div className="p-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {selectedProduct.title}
              </h2>
              <p className="text-gray-600 mb-4">{selectedProduct.description}</p>

              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-blue-600">
                  {selectedProduct.price.toLocaleString("fa-IR")} تومان
                </span>
                {selectedProduct.inventory !== undefined && selectedProduct.inventory !== null && selectedProduct.inventory > 0 ? (
                  <span className="text-sm text-gray-500">
                    موجودی: {selectedProduct.inventory} عدد
                  </span>
                ) : (
                  <span className="text-sm text-red-500">ناموجود</span>
                )}
              </div>

              {selectedProduct.inventory !== undefined && selectedProduct.inventory !== null && selectedProduct.inventory > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-700">تعداد:</span>
                    <div className="flex items-center border border-gray-300 rounded-md">
                      <button
                        onClick={decrementQuantity}
                        className="px-3 py-1 border-r border-gray-300 text-gray-500 hover:bg-gray-100"
                        aria-label="Decrease quantity"
                        disabled={quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="px-4 py-1">{quantity}</span>
                      <button
                        onClick={incrementQuantity}
                        className="px-3 py-1 border-l border-gray-300 text-gray-500 hover:bg-gray-100"
                        aria-label="Increase quantity"
                        disabled={
                          selectedProduct?.inventory !== undefined && 
                          quantity >= selectedProduct?.inventory
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={handleAddToCart}
                      className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 flex items-center justify-center"
                      disabled={!!(isAddingToCart)}
                    >
                      {isAddingToCart ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <span>افزودن به سبد</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleGoToCart}
                      className="border border-blue-600 text-blue-600 py-2 px-4 rounded-md hover:bg-blue-50 transition-colors"
                    >
                      سبد خرید
                    </button>
                  </div>
                </>
              ) : (
                <button
                  disabled
                  className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-md cursor-not-allowed"
                >
                  ناموجود
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 