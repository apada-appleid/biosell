export interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  inventory: number;
  isActive: boolean;
  deletedAt?: Date | string | null;
  shopId: string;
  shop?: {
    id: string;
    shopName: string;
  };
  imageUrl?: string;
  images?: ProductImage[];
  displayShops?: string[]; // IDs of shops where this product is displayed
}

export interface ProductImage {
  id: string;
  imageUrl: string;
  order?: number;
} 