import { OrderStatus, PaymentStatus, PaymentMethod } from '@/app/types';

export interface ProductImage {
  id: string;
  imageUrl: string;
  order?: number;
}

export interface SellerShop {
  id: string;
  shopName: string;
  sellerId: string;
  instagramId?: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Seller {
  id: string;
  username: string;
  email: string;
  bio?: string;
  profileImage?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  inventory: number;
  isActive: boolean;
  requiresAddress: boolean;
  likesCount?: number;
  shopId: string;
  shop?: Partial<SellerShop>;
  seller?: Partial<Seller>;
  images?: ProductImage[];
  displayShops?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  product: {
    id: string;
    title: string;
    price: number;
    image?: string;
  };
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
  name?: string;
  email?: string;
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
  status: OrderStatus;
  createdAt: string;
  user: User;
  addressId?: string;
  customerNotes?: string;
  sellerNotes?: string;
} 