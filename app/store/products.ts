import { create } from 'zustand';
import { Product, ProductImage } from '../types';
import axios from 'axios';

interface ProductsState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  username: string | null;
  fetchProducts: (username?: string) => Promise<void>;
  getProduct: (id: string) => Product | undefined;
}

// Mock product data for fallback
const mockProducts: Product[] = [
  {
    id: '1',
    title: 'محصول آبی',
    description: 'توضیحات محصول آبی به صورت تستی',
    price: 799000,
    imageUrl: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0',
    available: true,
    createdAt: new Date().toISOString(),
    images: [
      {
        id: '1-1',
        imageUrl: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0'
      }
    ],
    inventory: 10,
    isActive: true
  },
  {
    id: '2',
    title: 'کفش سفید',
    description: 'کفش مینیمال سفید که با همه چیز ست می‌شود',
    price: 599000,
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772',
    available: true,
    createdAt: new Date().toISOString(),
    images: [
      {
        id: '2-1',
        imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772'
      }
    ],
    inventory: 5,
    isActive: true
  },
  {
    id: '3',
    title: 'کیف چرم مشکی',
    description: 'کیف چرم مشکی شیک با سخت‌افزار طلایی',
    price: 1290000,
    imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa',
    available: true,
    createdAt: new Date().toISOString(),
    images: [
      {
        id: '3-1',
        imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa'
      }
    ],
    inventory: 3,
    isActive: true
  },
  {
    id: '4',
    title: 'عینک آفتابی گرد',
    description: 'عینک آفتابی گرد با الهام از طرح‌های قدیمی با محافظت UV',
    price: 399000,
    imageUrl: 'https://images.unsplash.com/photo-1577803645773-f96470509666',
    available: true,
    createdAt: new Date().toISOString(),
    images: [
      {
        id: '4-1',
        imageUrl: 'https://images.unsplash.com/photo-1577803645773-f96470509666'
      }
    ],
    inventory: 20,
    isActive: true
  }
];

export const useProductsStore = create<ProductsState>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,
  username: null,
  
  fetchProducts: async (username?: string) => {
    set({ isLoading: true, error: null });
    
    try {
      let products: Product[];
      
      if (username) {
        try {
          // First try to fetch from our seller API
          const response = await axios.get(`/api/shop/seller?username=${username}`);
          const seller = response.data;
          
          // Then fetch the products for this seller
          const productsResponse = await axios.get(`/api/shop/products?sellerId=${seller.id}`);
          
          // Ensure all products have the required fields
          products = productsResponse.data.products.map((product: any) => ({
            ...product,
            available: product.isActive, // Map isActive to available
            // Make sure each product has an imageUrl for backward compatibility
            imageUrl: product.images && product.images.length > 0 
              ? product.images[0].imageUrl 
              : 'https://via.placeholder.com/400'
          }));
        } catch (apiError) {
          console.error('API fetch failed, using mock data:', apiError);
          // Fallback to mock data if API call fails
          products = mockProducts;
        }
        
        set({ username: username });
      } else {
        // No username specified, use mock data
        products = mockProducts;
      }
      
      set({ products, isLoading: false });
    } catch (error) {
      console.error('Error fetching products:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch products', 
        isLoading: false,
        products: mockProducts // Use mock products as fallback on error
      });
    }
  },
  
  getProduct: (id: string) => {
    return get().products.find(product => product.id === id);
  }
})); 