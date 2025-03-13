import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FiChevronLeft, FiBookmark } from "react-icons/fi";
import { Product } from "@/app/types";
import { useCartStore } from "@/app/store/cart";
import { useToastStore } from "@/app/store/toast";
import { ShoppingBag, Minus, Plus } from "lucide-react";
import { ensureValidImageUrl } from "@/utils/s3-storage";

interface ProductDetailProps {
  product: Product;
  fromUsername?: string | null;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product }) => {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  // const [likesCount, setLikesCount] = useState(0);
  const addToCart = useCartStore((state) => state.addToCart);
  const hydrate = useCartStore((state) => state.hydrate);
  const showToast = useToastStore((state) => state.showToast);
  const [mounted, setMounted] = useState(false);

  // Initialize client-side only values and hydrate cart
  useEffect(() => {
    // Ensure cart is hydrated from localStorage
    const hydrateData = async () => {
      await Promise.resolve();
      hydrate();
      setMounted(true);
    };

    hydrateData();

    // // Generate a random but stable number of likes (based on product ID for consistency)
    // const productIdNumber = parseInt(product.id, 10) || 0;
    // setLikesCount(200 + productIdNumber * 45);
  }, [product.id, hydrate]);

  const incrementQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleAddToCart = () => {
    // Only add to cart if component is mounted
    if (mounted) {
      addToCart(product, quantity);

      // Show toast with action buttons
      showToast(`${quantity} عدد ${product.title} به سبد خرید اضافه شد`, [
        {
          label: "تکمیل سفارش",
          onClick: () => router.push("/cart"),
        },
        {
          label: "ادامه خرید",
          onClick: () => useToastStore.getState().hideToast(),
        },
      ]);
    }
  };

  // Format price to use Persian locale
  const formatPrice = (price: number) => {
    return price.toLocaleString("fa-IR");
  };

  // Process image URLs to ensure they're valid URLs
  const productImages =
    product.images?.map((img) => ({
      ...img,
      imageUrl: ensureValidImageUrl(img.imageUrl),
    })) || [];

  const mainImageUrl =
    productImages.length > 0
      ? productImages[0].imageUrl
      : ensureValidImageUrl(product.imageUrl);

  return (
    <div className="flex flex-col h-full">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => {
            // Implement back functionality
          }}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          <FiChevronLeft className="h-6 w-6 text-gray-800" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900 truncate max-w-[60%]">
          جزئیات محصول
        </h1>
        <div className="w-8" /> {/* Placeholder for balance */}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto md:p-6 md:pb-24">
        <div className="max-w-7xl mx-auto md:grid md:grid-cols-2 md:gap-8">
          {/* Product image section */}
          <div className="md:sticky md:top-20">
            <div className="aspect-square relative bg-gray-100 md:rounded-lg md:overflow-hidden">
              {productImages.length > 0 ? (
                <Image
                  src={mainImageUrl}
                  alt={product.title}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : product.imageUrl ? (
                <Image
                  src={mainImageUrl}
                  alt={product.title}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <FiBookmark className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>

            {/* Image carousel for multiple images */}
            {productImages.length > 1 && (
              <div className="mt-4 px-4 overflow-x-auto">
                <div className="flex space-x-3 rtl:space-x-reverse">
                  {productImages.map((image, index) => (
                    <div
                      key={index}
                      className="w-20 h-20 rounded-md overflow-hidden border border-gray-200 flex-shrink-0 cursor-pointer"
                    >
                      <Image
                        src={image.imageUrl}
                        alt={`${product.title} - تصویر ${index + 1}`}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Product info section */}
          <div className="p-4 md:p-0">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              {product.title}
            </h2>

            <div className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
              {formatPrice(product.price)} تومان
            </div>

            <div className="prose prose-sm text-gray-700 mb-6">
              <p className="whitespace-pre-line">{product.description}</p>
            </div>

            {/* Inventory status */}
            <div className="mb-6 flex items-center">
              <span className="text-sm text-gray-500 ml-2">وضعیت:</span>
              <span
                className={`text-sm font-medium ${
                  (product.inventory || 0) > 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {(product.inventory || 0) > 0 ? "موجود" : "ناموجود"}
              </span>
              {(product.inventory || 0) > 0 && (
                <span className="text-sm text-gray-500 mr-2">
                  ({product.inventory} عدد)
                </span>
              )}
            </div>

            {/* Quantity selector */}
            {(product.inventory || 0) > 0 && (
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تعداد
                </label>
                <div className="flex items-center">
                  <button
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                    className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 bg-white text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-16 text-center text-gray-900 font-medium">
                    {quantity}
                  </span>
                  <button
                    onClick={incrementQuantity}
                    disabled={quantity >= (product.inventory || 0)}
                    className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 bg-white text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky add to cart footer */}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-lg font-bold text-gray-900">
            {formatPrice(product.price * quantity)} تومان
          </div>
          <button
            onClick={handleAddToCart}
            disabled={(product.inventory || 0) <= 0}
            className={`px-6 py-3 rounded-lg font-bold flex items-center ${
              (product.inventory || 0) > 0
                ? "bg-blue-500 hover:bg-blue-600 text-white"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            <ShoppingBag className="ml-2 h-5 w-5" />
            {(product.inventory || 0) > 0 ? "افزودن به سبد خرید" : "ناموجود"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
