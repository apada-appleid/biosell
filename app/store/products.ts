import { create } from 'zustand';
import { Product } from '../types';
import axios from 'axios';

interface ProductsState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  getProduct: (id: string) => Product | undefined;
}

// Mock data for initial development - will be replaced with Instagram API integration
const mockProducts: Product[] = [
  {
    id: '1',
    title: 'Blue Denim Jacket',
    description: 'Classic blue denim jacket, perfect for any casual outfit.',
    price: 79.99,
    imageUrl: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0',
    instagramPostUrl: 'https://www.instagram.com/p/sample1/',
    available: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'White Sneakers',
    description: 'Minimalist white sneakers that go with everything.',
    price: 59.99,
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772',
    instagramPostUrl: 'https://www.instagram.com/p/sample2/',
    available: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    title: 'Black Leather Bag',
    description: 'Stylish black leather bag with gold hardware.',
    price: 129.99,
    imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa',
    instagramPostUrl: 'https://www.instagram.com/p/sample3/',
    available: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '4',
    title: 'Round Sunglasses',
    description: 'Vintage-inspired round sunglasses with UV protection.',
    price: 39.99,
    imageUrl: 'https://images.unsplash.com/photo-1577803645773-f96470509666',
    instagramPostUrl: 'https://www.instagram.com/p/sample4/',
    available: true,
    createdAt: new Date().toISOString()
  }
];

export const useProductsStore = create<ProductsState>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,
  
  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // In a real implementation, we would fetch from Instagram API
      // For now, we'll use mock data with a timeout to simulate network request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      set({ products: mockProducts, isLoading: false });
    } catch (error) {
      console.error('Error fetching products:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch products', 
        isLoading: false 
      });
    }
  },
  
  getProduct: (id: string) => {
    return get().products.find(product => product.id === id);
  }
})); 