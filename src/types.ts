export interface Category {
  id: number;
  name: string;
  slug: string;
  sort_order?: number;
}

export interface ProductAttribute {
  id: number;
  name: string;
  terms: string[];
}

export interface ProductImage {
  id: number;
  src: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  price: number;
  regular_price: number;
  is_published: boolean;
  isOnHot?: boolean;
  short_description: string;
  description: string;
  features?: string[];
  categories: { id: number; name: string; slug: string }[];
  tags: { id: number; name: string; slug: string }[];
  images: ProductImage[];
  attributes: ProductAttribute[];
  in_stock: boolean;
  sort_order?: number;
}

