export interface ProductImage {
  id: string;
  imageUrl: string;
  order?: number;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  instagramPostUrl?: string;
  available: boolean;
  createdAt: string;
  images?: ProductImage[];
  inventory?: number;
  isActive?: boolean;
  likes_count?: number;
  likesCount?: number;
  sellerId?: string;
  seller?: {
    id: string;
    username: string;
    shopName: string;
  };
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

/**
 * @deprecated Use CustomerAddress instead. This interface is kept for backward compatibility.
 */
export interface Address {
  id: string;
  fullName: string;
  mobile: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
  userId?: string;
  customerId?: string;
}

/**
 * New interface for customer addresses
 */
export interface CustomerAddress {
  id: string;
  fullName: string;
  mobile: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
  customerId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  mobile?: string;
}

export interface Customer {
  id: string;
  fullName?: string;
  email?: string;
  mobile?: string;
  // Legacy fields kept for backward compatibility
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  // New field for customer addresses
  addresses?: CustomerAddress[];
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt: string;
  user: User;
} 