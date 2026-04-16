/**
 * 购物车行项（与后端购物车条目字段对齐的 MVP 定义）
 */
export interface CartItem {
  id: string;
  productId: string;
  skuId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  stock: number;
  isSeckill?: boolean;
  seckillPrice?: number;
}
