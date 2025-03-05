'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useProductsStore } from '@/app/store/products';
import ProductDetail from '@/app/components/products/ProductDetail';
import { Product } from '@/app/types';
import { FiChevronLeft } from 'react-icons/fi';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/app/store/cart';
import { 
  Heart as FiHeart,
  MessageCircle as FiMessageCircle,
  Share2 as FiShare2,
  Bookmark as FiBookmark,
  Plus as FiPlus,
  Minus as FiMinus 
} from 'lucide-react';

/**
 * ProductDetailsPage component displays detailed information about a product
 * 
 * NOTE: In future versions of Next.js, `params` will be a Promise that needs to be
 * unwrapped with React.use() before accessing properties.
 * 
 * Future implementation will look like:
 * ```
 * const unwrappedParams = React.use(params as any);
 * const id = unwrappedParams.id;
 * ```
 * 
 * For now, we're using direct access which is still supported for migration purposes.
 */
export default function ProductDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const productId = params.id as string;
  const username = searchParams.get('username');

  const { products, fetchProducts, getProduct } = useProductsStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [likesCount, setLikesCount] = useState(0);
  
  const addToCart = useCartStore((state) => state.addToCart);

  useEffect(() => {
    const loadProduct = async () => {
      setIsLoading(true);
      
      // If products are not loaded yet, fetch them with the username if available
      if (products.length === 0) {
        await fetchProducts(username || undefined);
      }
      
      const foundProduct = getProduct(productId);
      
      if (foundProduct) {
        setProduct(foundProduct);
        setLikesCount(foundProduct.likes_count || 50 + Math.floor(Math.random() * 100));
      }
      
      setIsLoading(false);
    };
    
    loadProduct();
  }, [productId, products.length, fetchProducts, getProduct, username]);
  
  const incrementQuantity = () => {
    if (product?.inventory && quantity < product.inventory) {
      setQuantity(prev => prev + 1);
    } else if (!product?.inventory) {
      setQuantity(prev => prev + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      // استفاده از ذخیره در localStorage برای سازگاری با کد قبلی
      try {
        const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
        const existingItemIndex = cartItems.findIndex(
          (item: any) => item.product.id === product.id
        );
        
        if (existingItemIndex >= 0) {
          cartItems[existingItemIndex].quantity += quantity;
        } else {
          cartItems.push({
            product: product,
            quantity: quantity
          });
        }
        
        localStorage.setItem('cart', JSON.stringify(cartItems));
        
        // همچنین از استور استفاده کنیم اگر وجود داشته باشد
        if (typeof addToCart === 'function') {
          addToCart(product, quantity);
        }
        
        alert(`${quantity} عدد ${product.title} به سبد خرید اضافه شد`);
      } catch (error) {
        console.error('خطا در افزودن به سبد خرید:', error);
        alert('خطا در افزودن به سبد خرید. لطفاً دوباره تلاش کنید.');
      }
    }
  };

  // فرمت کردن قیمت به صورت فارسی
  const formatPrice = (price: number) => {
    return price.toLocaleString('fa-IR');
  };

  // نام فروشگاه را از دیتای موجود بگیریم یا پیش‌فرض قرار دهیم
  const businessName = product?.seller?.shopName || "فروشگاه بایوسل";
  
  // لینک بازگشت
  const backLinkHref = product?.sellerId 
    ? `/shop/${product.seller?.username || 'seller'}` 
    : '/';

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-white max-w-md mx-auto">
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <Link 
              href={username ? `/shop/${username}` : "/"} 
              className="text-gray-800"
              aria-label="Back"
              tabIndex={0}
            >
              <FiChevronLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">Product Detail</h1>
            <div className="w-6"></div>
          </div>
        </header>
        
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="flex flex-col min-h-screen bg-white max-w-md mx-auto">
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <Link 
              href={username ? `/shop/${username}` : "/"} 
              className="text-gray-800"
              aria-label="Back"
              tabIndex={0}
            >
              <FiChevronLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">Product Detail</h1>
            <div className="w-6"></div>
          </div>
        </header>
        
        <div className="p-4 text-center">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Product Not Found</h2>
          <p className="text-gray-700 mb-6">We couldn&apos;t find the product you&apos;re looking for.</p>
          <Link 
            href={username ? `/shop/${username}` : "/"}
            className="bg-blue-500 text-white px-6 py-2 rounded-md"
            aria-label="Back to shop"
            tabIndex={0}
          >
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }
  
  return <ProductDetail product={product} fromUsername={username} />;
} 