// Define enums that match the Prisma schema
export enum UserRole {
  admin = 'admin',
  superadmin = 'superadmin'
}

export enum PlanPaymentStatus {
  pending = 'pending',
  approved = 'approved',
  rejected = 'rejected'
}

export enum OrderStatus {
  pending = 'pending',
  processing = 'processing',
  completed = 'completed',
  cancelled = 'cancelled'
}

export enum PaymentMethod {
  cash_on_delivery = 'cash_on_delivery',
  credit_card = 'credit_card',
  bank_transfer = 'bank_transfer'
}

export enum PaymentStatus {
  pending = 'pending',
  paid = 'paid',
  failed = 'failed'
}

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