'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, ShoppingBag, User, Heart, MessageCircle, ExternalLink, Grid, ChevronLeft, X, Share2, Minus, Plus } from 'lucide-react';

// Types for our products and seller
interface ProductImage {
  id: string;
  imageUrl: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  description?: string;
  images: ProductImage[];
  inventory: number;
  isActive: boolean;
  isLiked: boolean;
  inStock: boolean;
  imageUrl?: string;
  likes_count?: number;
}

interface Seller {
  id: string;
  username: string;
  shopName: string;
  bio?: string;
  profileImage?: string;
}

export default function SellerShopPage() {
  const params = useParams();
  const username = params.username as string;
  
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  
  // Fetch seller and products
  useEffect(() => {
    const fetchSellerAndProducts = async () => {
      try {
        setLoading(true);
        
        // First fetch the seller info
        const sellerRes = await fetch(`/api/shop/seller?username=${username}`);
        if (!sellerRes.ok) {
          throw new Error('فروشنده یافت نشد');
        }
        const sellerData = await sellerRes.json();
        setSeller(sellerData);
        
        // Then fetch their products
        const productsRes = await fetch(`/api/shop/products?sellerId=${sellerData.id}`);
        if (!productsRes.ok) {
          throw new Error('خطا در بارگذاری محصولات');
        }
        const productsData = await productsRes.json();
        setProducts(productsData.products);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'خطا در بارگذاری اطلاعات');
      } finally {
        setLoading(false);
      }
    };
    
    if (username) {
      fetchSellerAndProducts();
    }
  }, [username]);
  
  // تابع باز کردن جزئیات محصول
  const openProductDetails = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1); // ریست کردن تعداد به 1 هنگام انتخاب محصول جدید
    // Add to browser history so back button works
    window.history.pushState({ product: product.id }, '', `/shop/${username}/product/${product.id}`);
  };
  
  // تابع بستن جزئیات محصول
  const closeProductDetails = () => {
    setSelectedProduct(null);
    window.history.back();
  };
  
  // Handle browser back button
  useEffect(() => {
    const handlePopState = () => {
      setSelectedProduct(null);
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  
  // تابع افزایش تعداد
  const incrementQuantity = () => {
    if (selectedProduct?.inventory && quantity < selectedProduct.inventory) {
      setQuantity(prev => prev + 1);
    }
  };
  
  // تابع کاهش تعداد
  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };
  
  // تابع افزودن به سبد خرید با localStorage
  const handleAddToCart = () => {
    if (selectedProduct) {
      try {
        // خواندن سبد خرید موجود از localStorage
        const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
        
        // بررسی اینکه آیا محصول قبلاً در سبد خرید وجود دارد
        const existingItemIndex = cartItems.findIndex(
          (item: any) => item.product.id === selectedProduct.id
        );
        
        if (existingItemIndex >= 0) {
          // اگر محصول قبلاً در سبد خرید بود، تعداد را اضافه کن
          cartItems[existingItemIndex].quantity += quantity;
        } else {
          // اگر محصول جدید است، آن را به سبد خرید اضافه کن
          cartItems.push({
            product: selectedProduct,
            quantity: quantity
          });
        }
        
        // ذخیره سبد خرید به‌روزرسانی شده در localStorage
        localStorage.setItem('cart', JSON.stringify(cartItems));
        
        // نمایش پیام موفقیت‌آمیز
        alert(`${quantity} عدد ${selectedProduct.title} به سبد خرید اضافه شد`);
        
        // بستن مودال
        closeProductDetails();
      } catch (error) {
        console.error('خطا در افزودن به سبد خرید:', error);
        alert('خطا در افزودن به سبد خرید. لطفاً دوباره تلاش کنید.');
      }
    }
  };
  
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }
  
  if (error || !seller) {
    return (
      <div className="flex flex-col min-h-screen bg-white p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-medium text-gray-900 mb-2">
              {error || 'فروشنده یافت نشد'}
            </h2>
            <p className="text-gray-600">
              لطفاً بعداً دوباره امتحان کنید یا با پشتیبانی تماس بگیرید.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-white max-w-6xl mx-auto">
      {/* Instagram-like header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <h1 className="text-xl font-semibold text-gray-900">{seller.shopName}</h1>
          <Link href="/cart" className="relative">
            <ShoppingBag className="h-6 w-6 text-gray-800" />
            {/* Show badge if items in cart */}
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              0
            </span>
          </Link>
        </div>
      </header>
      
      <main className="flex-1">
        {/* Profile section similar to Instagram */}
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
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">@{seller.username}</h2>
                <p className="text-gray-700 text-sm md:text-base mt-1">
                  {seller.bio || `فروشگاه رسمی ${seller.shopName}`}
                </p>
              </div>
            </div>
            
            {/* Stats row */}
            <div className="flex justify-around mt-5 md:w-1/2 md:justify-between">
              <div className="text-center">
                <div className="font-bold text-gray-900 md:text-lg">{products.length}</div>
                <div className="text-xs md:text-sm text-gray-600 font-medium">محصولات</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-gray-900 md:text-lg">0</div>
                <div className="text-xs md:text-sm text-gray-600 font-medium">مشتریان</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-gray-900 md:text-lg">0</div>
                <div className="text-xs md:text-sm text-gray-600 font-medium">نظرات</div>
              </div>
            </div>
            
            <div className="mt-4 md:mt-6 md:max-w-xs">
              <button className="w-full bg-blue-500 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-600 transition-colors">
                دنبال کردن
              </button>
            </div>
          </div>
        </div>
        
        {/* Product grid similar to Instagram posts */}
        <div className="p-1 md:p-4 md:max-w-6xl md:mx-auto">
          {products.length > 0 ? (
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
                  ) : (
                    <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                      <ShoppingBag className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-xs md:text-sm font-medium">
                    {product.price.toLocaleString()} تومان
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">محصولی وجود ندارد</h3>
                <p className="text-gray-600 text-sm">
                  هنوز هیچ محصولی توسط این فروشنده اضافه نشده است.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 px-6 text-center">
        <p className="text-xs md:text-sm text-gray-600">
          قدرت گرفته از <span className="font-medium">شاپ‌گرام</span>
        </p>
      </footer>
      
      {/* Product detail modal - shown when a product is selected */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-75 flex justify-center items-start md:items-center">
          <div className="bg-white w-full h-full md:h-auto md:max-w-5xl md:max-h-[85vh] md:rounded-lg md:overflow-hidden flex flex-col">
            {/* Modal header */}
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
              <div className="w-6" /> {/* Empty div for spacing */}
            </div>
            
            {/* Modal content */}
            <div className="flex-1 overflow-y-auto p-0 md:p-4">
              <div className="md:grid md:grid-cols-2 md:gap-8">
                {/* Product image */}
                <div className="md:sticky md:top-0">
                  <div className="aspect-square relative bg-gray-100 md:rounded-lg overflow-hidden">
                    {selectedProduct.images && selectedProduct.images.length > 0 ? (
                      <Image 
                        src={selectedProduct.images[0].imageUrl} 
                        alt={selectedProduct.title} 
                        fill 
                        className="object-contain"
                      />
                    ) : selectedProduct.imageUrl ? (
                      <Image 
                        src={selectedProduct.imageUrl} 
                        alt={selectedProduct.title} 
                        fill 
                        className="object-contain"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <ShoppingBag className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Multiple image carousel if available */}
                  {selectedProduct.images && selectedProduct.images.length > 1 && (
                    <div className="mt-2 px-4 overflow-x-auto">
                      <div className="flex space-x-2 rtl:space-x-reverse">
                        {selectedProduct.images.map((image, index) => (
                          <div
                            key={index}
                            className="w-16 h-16 rounded-md overflow-hidden border border-gray-200 flex-shrink-0 cursor-pointer"
                          >
                            <Image
                              src={image.imageUrl}
                              alt={`${selectedProduct.title} - تصویر ${index + 1}`}
                              width={64}
                              height={64}
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Product info */}
                <div className="p-4 md:p-0">
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                    {selectedProduct.title}
                  </h1>
                  
                  <div className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
                    {selectedProduct.price.toLocaleString('fa-IR')} تومان
                  </div>
                  
                  <div className="prose prose-sm text-gray-700 mb-6">
                    <p className="whitespace-pre-line">{selectedProduct.description}</p>
                  </div>
                  
                  {/* Product actions */}
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-4 rtl:space-x-reverse">
                      <button className="text-gray-500 hover:text-red-500">
                        <Heart className={`h-6 w-6 ${selectedProduct.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                      </button>
                      <button className="text-gray-500 hover:text-blue-500">
                        <MessageCircle className="h-6 w-6" />
                      </button>
                      <button className="text-gray-500 hover:text-black">
                        <Share2 className="h-6 w-6" />
                      </button>
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedProduct.likes_count ? `${selectedProduct.likes_count} لایک` : '0 لایک'}
                    </div>
                  </div>
                  
                  {/* Quantity selector */}
                  {(selectedProduct.inventory && selectedProduct.inventory > 0) && (
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
                          disabled={!selectedProduct.inventory || quantity >= selectedProduct.inventory}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Fix inventory check */}
                  <div className="mb-6 flex items-center">
                    <span className="text-sm text-gray-500 ml-2">وضعیت:</span>
                    <span className={`text-sm font-medium ${
                      selectedProduct?.inventory && selectedProduct.inventory > 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {selectedProduct?.inventory && selectedProduct.inventory > 0 
                        ? 'موجود' 
                        : 'ناموجود'
                      }
                    </span>
                    {selectedProduct?.inventory && selectedProduct.inventory > 0 && (
                      <span className="text-sm text-gray-500 mr-2">
                        ({selectedProduct.inventory} عدد)
                      </span>
                    )}
                  </div>
                  
                  {/* Add to cart button */}
                  {(selectedProduct.inventory && selectedProduct.inventory > 0) ? (
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