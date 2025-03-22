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
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  Share2,
  Minus,
  Plus,
  ShoppingBag,
  Loader2,
  MessageCircle,
  Heart,
  Send,
  Bookmark,
} from "lucide-react";
import { useToastStore } from "@/app/store/toast";
import { ensureValidImageUrl } from "@/utils/s3-storage";

// تعریف انواع داده
interface Shop {
  id: string;
  shopName: string;
  instagramId?: string;
  isActive: boolean;
}

interface Seller {
  id: string;
  username: string;
  bio?: string;
  profileImage?: string;
  isActive: boolean;
  shopId?: string;
  shopName?: string; // For backward compatibility
  instagramId?: string;
  defaultShop?: Shop;
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
  const [slideDirection, setSlideDirection] = useState<"next" | "prev" | null>(null);
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
        
        let sellerData = null;
        let error = null;
        
        // Method 1: Try the standard shop API
        try {
          const response = await fetch(`/api/shop/${username}`);
          if (response.ok) {
            const data = await response.json();
            if (data && data.seller) {
              sellerData = data.seller;
            }
          }
        } catch (e) {
          error = e;
          console.error("Error with shop API:", e);
        }
        
        // Method 2: Try legacy API if method 1 fails
        if (!sellerData) {
          try {
            const response = await fetch(`/api/${username}`);
            if (response.ok) {
              const data = await response.json();
              if (data && data.seller) {
                sellerData = data.seller;
              }
            }
          } catch (e) {
            error = e;
            console.error("Error with legacy API:", e);
          }
        }
        
        // Method 3: If both API methods fail, try the debug API
        if (!sellerData) {
          try {
            const response = await fetch(`/api/debug?username=${username}`);
            if (response.ok) {
              const data = await response.json();
              console.log("Debug data:", data);
              
              if (data.debug.anyShop) {
                // If there's any shop, try to use it
                const shop = data.debug.anyShop;
                const sellerId = shop.sellerId;
                
                // Create a simple seller object with limited data
                sellerData = {
                  id: sellerId,
                  username: username,
                  bio: "",
                  isActive: true,
                  shopId: shop.id,
                  shopName: shop.shopName,
                  instagramId: shop.instagramId,
                  defaultShop: shop
                };
              }
            }
          } catch (e) {
            error = e;
            console.error("Error with debug API:", e);
          }
        }
        
        // If we still don't have any data, show an error
        if (!sellerData) {
          throw new Error("فروشنده یا فروشگاه یافت نشد");
        }
        
        // Set seller data
        setSeller(sellerData);
        
        // Fetch products based on the shop ID
        await fetchProducts(sellerData.shopId);
        
      } catch (error) {
        console.error("Error fetching seller data:", error);
        setError(error instanceof Error ? error.message : "خطا در دریافت اطلاعات فروشنده");
        setLoading(false);
      }
    };
    
    const fetchProducts = async (shopId: string) => {
      try {
        if (!shopId) {
          throw new Error("شناسه فروشگاه نامعتبر است");
        }
        
        const response = await fetch(`/api/products?shopId=${shopId}`);
        
        if (!response.ok) {
          throw new Error("خطا در دریافت محصولات");
        }
        
        const data = await response.json();
        
        // Make sure we're getting an array
        const productsList = Array.isArray(data.products) ? data.products : [];
        
        // Filter out inactive or deleted products
        const activeProducts = productsList.filter(
          (product: any) => product.isActive && !product.deletedAt
        );
        
        // Process product images to ensure they have valid URLs
        const processedProducts = activeProducts.map(processProductImages);
        
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

        // Show toast with action buttons and improved UX
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

  // Navigate to next/prev images - corrected for proper RTL behavior
  const navigateToNextImage = () => {
    if (selectedProduct?.images && currentImageIndex < selectedProduct.images.length - 1) {
      setSlideDirection("next");
      setCurrentImageIndex(current => current + 1);
      
      // Reset slide direction after animation completes
      setTimeout(() => {
        setSlideDirection(null);
      }, 300);
    }
  };

  const navigateToPrevImage = () => {
    if (currentImageIndex > 0) {
      setSlideDirection("prev");
      setCurrentImageIndex(current => current - 1);
      
      // Reset slide direction after animation completes
      setTimeout(() => {
        setSlideDirection(null);
      }, 300);
    }
  };

  // Handle thumbnail click
  const handleThumbnailClick = (index: number) => {
    if (index === currentImageIndex) return;
    
    // Set direction based on index comparison - reversed for RTL
    setSlideDirection(index > currentImageIndex ? "next" : "prev");
    setCurrentImageIndex(index);
    
    // Reset slide direction after animation completes
    setTimeout(() => {
      setSlideDirection(null);
    }, 300);
  };

  // Handle touch events for swipe - corrected for RTL
  const handleTouchStart = (e: TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;
    
    // Corrected for RTL interfaces:
    // Right to left swipe (positive distance): show previous image
    // Left to right swipe (negative distance): show next image
    if (distance > minSwipeDistance && currentImageIndex > 0) {
      // Finger moved right to left -> show previous image
      navigateToPrevImage();
    } else if (distance < -minSwipeDistance && selectedProduct?.images && currentImageIndex < selectedProduct.images.length - 1) {
      // Finger moved left to right -> show next image
      navigateToNextImage();
    }
    
    // Reset touch values
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Get shop name from either defaultShop or legacy shopName
  const getShopName = () => {
    if (seller?.defaultShop?.shopName) {
      return seller.defaultShop.shopName;
    }
    return seller?.shopName || seller?.username || "";
  };

  // Get instagram ID from either defaultShop or legacy field
  const getInstagramId = () => {
    if (seller?.defaultShop?.instagramId) {
      return seller.defaultShop.instagramId;
    }
    return seller?.instagramId || "";
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

  // Handle product click
  const handleProductClick = (product: Product) => {
    openProductDetails(product);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Instagram-like Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-20">
        <div className="flex items-center justify-between w-full max-w-screen-lg mx-auto">
          <div className="w-10">
            <Link
              href="/"
              className="text-gray-800 hover:text-gray-600"
              aria-label="Back to home"
              tabIndex={0}
            >
              <ChevronRight className="h-6 w-6" />
            </Link>
          </div>
          
          <div className="flex-1 text-center">
            <h1 className="text-gray-900 text-base font-normal">{getInstagramId() || seller?.shopName || username}</h1>
          </div>
          
          <div className="w-10 flex justify-end">
            <Link
              href="/cart"
              className="text-gray-700 hover:text-gray-900 relative"
              aria-label="سبد خرید"
              tabIndex={0}
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

      {/* Compact Profile Info */}
      <div className="bg-white py-4 px-4 border-b border-gray-200">
        <div className="flex items-center justify-between w-full max-w-screen-lg mx-auto">
          {/* Profile Image */}
          <div className="relative h-20 w-20 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
            {seller?.profileImage ? (
              <Image
                src={ensureValidImageUrl(seller.profileImage)}
                alt={getShopName()}
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : (
              <User className="h-10 w-10 text-gray-400" />
            )}
          </div>
          
          {/* Profile Stats */}
          <div className="flex space-x-4 rtl:space-x-reverse">
            <div className="text-center">
              <div className="text-gray-900 font-semibold">{products.length || 1}</div>
              <div className="text-gray-500 text-xs">پست‌ها</div>
            </div>
            <div className="text-center">
              <div className="text-gray-900 font-semibold">10.5K</div>
              <div className="text-gray-500 text-xs">فالوور</div>
            </div>
            <div className="text-center">
              <div className="text-gray-900 font-semibold">28</div>
              <div className="text-gray-500 text-xs">دنبال شده</div>
            </div>
          </div>
        </div>
        
        {/* Shop Name & Bio - Only */}
        <div className="mt-3 max-w-screen-lg mx-auto">
          <h2 className="text-gray-900 font-semibold text-base">{getShopName()}</h2>
          
          {seller?.bio ? (
            <p className="mt-1 text-gray-700 text-sm">{seller.bio}</p>
          ) : (
            <p className="mt-1 text-gray-700 text-sm">هرچیزی که اپلی باشه اینجا هست</p>
          )}
          
          {/* Instagram link if available */}
          {getInstagramId() && (
            <div className="mt-2">
              <a 
                href={`https://instagram.com/${getInstagramId()}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 text-sm flex items-center hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5 ml-1" />
                {getInstagramId()}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Category Highlights */}
      <div className="bg-white border-t border-gray-200 px-1 py-4 overflow-x-auto">
        <div className="flex space-x-2 rtl:space-x-reverse px-3 max-w-screen-lg mx-auto">
          {["موبایل", "ساعت", "اکسسوری", "هدفون", "لپ تاپ"].map((label, index) => (
            <div key={index} className="flex flex-col items-center min-w-[72px]">
              <div className="h-16 w-16 rounded-full border border-gray-300 flex items-center justify-center mb-1">
                <div className="h-[60px] w-[60px] rounded-full bg-gray-100 flex items-center justify-center">
                  {index === 0 && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                      <path d="M12 18h.01" />
                    </svg>
                  )}
                  {index === 1 && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                      <circle cx="12" cy="12" r="7" />
                      <polyline points="12 9 12 12 13.5 13.5" />
                      <path d="M16.51 17.35l-.35 3.83a2 2 0 0 1-2 1.82H9.83a2 2 0 0 1-2-1.82l-.35-3.83m.01-10.7l.35-3.83A2 2 0 0 1 9.83 1h4.35a2 2 0 0 1 2 1.82l.35 3.83" />
                    </svg>
                  )}
                  {index === 2 && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                  )}
                  {index === 3 && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                    </svg>
                  )}
                  {index === 4 && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                      <line x1="12" y1="17" x2="12" y2="17.01" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-gray-700 text-xs text-center">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="flex-grow bg-white border-t border-gray-200 pt-1">
        {products.length === 0 ? (
          <div className="text-center py-12 max-w-screen-lg mx-auto">
            <p className="text-gray-500">
              در حال حاضر محصولی در این فروشگاه موجود نیست.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 max-w-screen-lg mx-auto gap-[2px]">
            {products.map((product) => (
              <div
                key={product.id}
                className="aspect-square relative cursor-pointer"
                onClick={() => handleProductClick(product)}
              >
                <Image
                  src={product.imageUrl || (product.images && product.images.length > 0 ? product.images[0].imageUrl : "/placeholder-product.jpg")}
                  alt={product.title}
                  fill
                  sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
                  className="object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent pt-8 pb-2 px-2">
                  <div className="flex flex-col">
                    <h3 className="text-white text-[11px] sm:text-xs font-medium line-clamp-1 mb-1">{product.title}</h3>
                    <span className="text-white text-[11px] sm:text-xs font-bold">
                      {product.price.toLocaleString("fa-IR")} تومان
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Details Modal */}
      {isProductModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-0 md:p-4 overflow-hidden">
          <div className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:w-[480px] md:rounded-xl overflow-hidden relative flex flex-col">
            {/* Close button */}
            <button
              className="absolute top-3 right-3 z-30 text-black bg-transparent p-1"
              onClick={closeProductDetails}
              aria-label="بستن"
              tabIndex={0}
            >
              <X className="h-6 w-6" />
            </button>

            {/* Product Images Carousel */}
            <div className="relative h-[50vh] md:h-[400px] w-full bg-gray-50 flex-shrink-0">
              {selectedProduct.images && selectedProduct.images.length > 0 ? (
                <>
                  {/* Main Carousel Container - Simplified approach */}
                  <div 
                    className="h-full w-full relative overflow-hidden touch-pan-x"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    {/* Single Image Display - Only show current image */}
                    <div className="h-full w-full relative">
                      <Image
                        src={selectedProduct.images[currentImageIndex].imageUrl}
                        alt={`${selectedProduct.title} - تصویر ${currentImageIndex + 1}`}
                        fill
                        priority
                        sizes="(max-width: 768px) 100vw, 480px"
                        className="object-contain"
                      />
                    </div>
                    
                    {/* Navigation Arrows - z-index increased to ensure visibility */}
                    {selectedProduct.images.length > 1 && (
                      <>
                        {/* Previous Image Button */}
                        <button 
                          className={`absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-1.5 z-20 ${
                            currentImageIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
                          }`}
                          onClick={navigateToPrevImage}
                          disabled={currentImageIndex === 0}
                          aria-label="تصویر قبلی"
                        >
                          <ChevronRight className="h-5 w-5 text-gray-700" />
                        </button>
                        
                        {/* Next Image Button */}
                        <button 
                          className={`absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-1.5 z-20 ${
                            currentImageIndex === selectedProduct.images.length - 1 ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
                          }`}
                          onClick={navigateToNextImage}
                          disabled={currentImageIndex === selectedProduct.images.length - 1}
                          aria-label="تصویر بعدی"
                        >
                          <ChevronLeft className="h-5 w-5 text-gray-700" />
                        </button>
                      </>
                    )}
                  </div>
                  
                  {/* Dots indicators - z-index increased */}
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center z-20">
                    <div className="flex space-x-1.5 rtl:space-x-reverse">
                      {selectedProduct.images?.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => handleThumbnailClick(index)}
                          className={`w-2 h-2 rounded-full ${
                            index === currentImageIndex
                              ? "bg-blue-500"
                              : "bg-gray-300"
                          }`}
                          aria-label={`رفتن به تصویر ${index + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Thumbnails preview - NEW */}
                  <div className="absolute -bottom-16 left-0 right-0 flex justify-center z-20 px-4 overflow-x-auto scrollbar-hide">
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      {selectedProduct.images?.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => handleThumbnailClick(index)}
                          className={`w-12 h-12 border-2 rounded-md overflow-hidden ${
                            index === currentImageIndex
                              ? "border-blue-500"
                              : "border-transparent"
                          }`}
                          aria-label={`رفتن به تصویر ${index + 1}`}
                        >
                          <div className="relative h-full w-full">
                            <Image 
                              src={image.imageUrl}
                              alt={`${selectedProduct.title} - تصویر کوچک ${index + 1}`}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <Image
                  src={selectedProduct.imageUrl || "/placeholder-product.jpg"}
                  alt={selectedProduct.title}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 480px"
                  className="object-contain"
                />
              )}
            </div>

            {/* Product Info - Adjusted to accommodate thumbnails */}
            <div className="p-4 pt-20 flex-grow overflow-y-auto">
              {/* Product Title and Price - RTL alignment */}
              <div className="flex flex-col space-y-1 mb-3 text-right">
                <h2 className="text-xl font-bold text-right">
                  {selectedProduct.title}
                </h2>
                <p className="text-gray-500 text-sm">
                  بهترین و گران‌ترین آیفون ساخته شده تا به امروز
                </p>
              </div>

              {/* Inventory - Instagram Style */}
              <div className="flex justify-between items-center py-2 mb-3">
                <span className="text-blue-500 font-bold text-lg">
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

              {selectedProduct.inventory !== undefined && selectedProduct.inventory !== null && selectedProduct.inventory > 0 && (
                <>
                  {/* Quantity Selector - Instagram Style */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-gray-700">تعداد:</span>
                    <div className="flex items-center">
                      <button
                        onClick={decrementQuantity}
                        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full text-gray-500"
                        aria-label="کاهش تعداد"
                        disabled={quantity <= 1}
                        tabIndex={0}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="mx-4 text-center w-6">{quantity}</span>
                      <button
                        onClick={incrementQuantity}
                        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full text-gray-500"
                        aria-label="افزایش تعداد"
                        disabled={
                          selectedProduct?.inventory !== undefined && 
                          quantity >= selectedProduct?.inventory
                        }
                        tabIndex={0}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons - Instagram Style */}
                  <button
                    onClick={handleAddToCart}
                    className="w-full bg-blue-500 text-white py-2.5 px-4 rounded-md hover:bg-blue-600 transition-colors disabled:bg-blue-300 flex items-center justify-center"
                    disabled={!!(isAddingToCart)}
                    tabIndex={0}
                  >
                    {isAddingToCart ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      "افزودن به سبد"
                    )}
                  </button>
                </>
              )}
              
              {selectedProduct.inventory !== undefined && selectedProduct.inventory !== null && selectedProduct.inventory === 0 && (
                <button
                  disabled
                  className="w-full bg-gray-200 text-gray-500 py-2.5 px-4 rounded-md cursor-not-allowed mb-3"
                  tabIndex={-1}
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