/**
 * 商品 SKU（Product.skus 子结构）
 */
export interface ProductSku {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export type ProductCategory = 'digital' | 'fashion' | 'food' | 'home';

/**
 * 商品领域实体（与后端商品资源字段对齐的 MVP 定义）
 */
export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  categoryName: string;
  brand: string;
  tags: string[];
  desc: string;
  price: number;
  originalPrice?: number;
  mainImage: string;
  images: string[];
  skus: ProductSku[];
  stock: number;
  sales: number;
}
