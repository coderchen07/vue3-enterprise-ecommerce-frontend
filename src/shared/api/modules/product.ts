import type { Product, ProductCategory } from '@/entities/product';
import { mockProducts } from '@/shared/data/products.mock';

export interface ProductListQuery {
  page?: number;
  pageSize?: number;
  size?: number;
  keyword?: string;
  category?: ProductCategory;
  minPrice?: number;
  maxPrice?: number;
  brands?: string[];
  tags?: string[];
}

export interface ProductSearchParams {
  keyword: string;
  page: number;
  size: number;
  category?: ProductCategory;
}

export interface ProductPageResult {
  list: Product[];
  page: number;
  size: number;
  total: number;
}

export interface ProductListPageQuery {
  page: number;
  size: number;
  keyword?: string;
  category?: ProductCategory;
  minPrice?: number;
  maxPrice?: number;
  brands?: string[];
  tags?: string[];
}

const filterProducts = (params: {
  keyword?: string;
  category?: ProductCategory;
  minPrice?: number;
  maxPrice?: number;
  brands?: string[];
  tags?: string[];
}): Product[] => {
  const keyword = params.keyword?.trim().toLowerCase() ?? '';
  const category = params.category;
  const rawMinPrice = params.minPrice ?? 0;
  const rawMaxPrice = params.maxPrice ?? Number.MAX_SAFE_INTEGER;
  const minPrice = Math.max(0, Math.min(rawMinPrice, rawMaxPrice));
  const maxPrice = Math.max(rawMinPrice, rawMaxPrice);
  const brands = params.brands ?? [];
  const tags = params.tags ?? [];

  return mockProducts.filter((item) => {
    const matchCategory = category ? item.category === category : true;
    const matchKeyword = keyword
      ? `${item.name} ${item.desc}`.toLowerCase().includes(keyword)
      : true;
    const matchPrice = item.price >= minPrice && item.price <= maxPrice;
    const matchBrand = brands.length > 0 ? brands.includes(item.brand) : true;
    const matchTags =
      tags.length > 0 ? tags.every((tag) => item.tags.includes(tag)) : true;
    return (
      matchCategory && matchKeyword && matchPrice && matchBrand && matchTags
    );
  });
};

/**
 * 商品列表（分页参数与后端约定一致时可按需扩展）
 */
export async function getProductList(
  params?: ProductListQuery,
): Promise<Product[]> {
  const page = Math.max(1, params?.page ?? 1);
  const pageSize = Math.max(1, params?.size ?? params?.pageSize ?? 10);
  const filtered = filterProducts({
    keyword: params?.keyword,
    category: params?.category,
    minPrice: params?.minPrice,
    maxPrice: params?.maxPrice,
    brands: params?.brands,
    tags: params?.tags,
  });
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return filtered.slice(start, end);
}

export async function getProductListPage(
  params: ProductListPageQuery,
): Promise<ProductPageResult> {
  const page = Math.max(1, params.page);
  const size = Math.max(1, params.size);
  const filtered = filterProducts({
    keyword: params.keyword,
    category: params.category,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    brands: params.brands,
    tags: params.tags,
  });
  const start = (page - 1) * size;
  const end = start + size;
  return {
    list: filtered.slice(start, end),
    page,
    size,
    total: filtered.length,
  };
}

/**
 * 商品详情
 */
export async function getProductDetail(productId: string): Promise<Product> {
  const found = mockProducts.find((item) => item.id === productId);
  if (!found) {
    throw new Error('商品不存在');
  }
  return found;
}

/**
 * 商品搜索（分页）
 */
export async function searchProducts(
  params: ProductSearchParams,
): Promise<ProductPageResult> {
  const keyword = params.keyword.trim().toLowerCase();
  const category = params.category;
  const filtered = mockProducts.filter((item) => {
    const matchCategory = category ? item.category === category : true;
    if (!keyword) {
      return matchCategory;
    }
    return (
      matchCategory &&
      `${item.name} ${item.desc}`.toLowerCase().includes(keyword)
    );
  });
  const start = (params.page - 1) * params.size;
  const end = start + params.size;
  return {
    list: filtered.slice(start, end),
    page: params.page,
    size: params.size,
    total: filtered.length,
  };
}
