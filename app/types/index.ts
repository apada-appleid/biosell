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
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt: string;
  user: User;
} 