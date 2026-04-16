import type { CartItem } from '@/entities/cart';
import { delete as deleteRequest, get, post, put } from '@/shared/api/request';

export interface AddCartItemPayload {
  productId: string;
  skuId: string;
  quantity: number;
}

export interface UpdateCartItemPayload {
  quantity: number;
}

/**
 * 当前用户购物车
 */
export function getCart(): Promise<CartItem[]> {
  return get<CartItem[]>('/cart');
}

/**
 * 加入购物车
 */
export function addCartItem(payload: AddCartItemPayload): Promise<CartItem> {
  return post<CartItem>('/cart/items', payload);
}

/**
 * 更新购物车行数量
 */
export function updateCartItem(
  itemId: string,
  payload: UpdateCartItemPayload,
): Promise<CartItem> {
  return put<CartItem>(`/cart/items/${itemId}`, payload);
}

/**
 * 移除购物车行
 */
export function removeCartItem(itemId: string): Promise<void> {
  return deleteRequest<void>(`/cart/items/${itemId}`);
}
