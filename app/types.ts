export interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  inventory?: number;
  isActive: boolean;
  requiresAddress: boolean;
  deletedAt?: Date | string | null;
  shopId: string;
  shop?: {
    id: string;
    shopName: string;
  };
  imageUrl?: string;
  images?: {
    id: string;
    imageUrl: string;
  }[];
  displayShops?: string[]; // IDs of shops where this product is displayed
  seller?: {
    id: string;
    shopName: string;
    username?: string;
  };
}

export interface ProductImage {
  id: string;
  imageUrl: string;
  order?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed';

export type PaymentMethod = 'credit_card' | 'cash_on_delivery' | 'bank_transfer';

// Customer address type
export interface CustomerAddress {
  id: string;
  fullName: string;
  mobile: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
} 