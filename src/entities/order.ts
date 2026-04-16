export const OrderStatus = {
  PendingPayment: 'pending_payment',
  PendingDelivery: 'pending_delivery',
  PendingReceipt: 'pending_receipt',
  Completed: 'completed',
  Cancelled: 'cancelled',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

/**
 * 订单收货地址（MVP 结构化字段，若后端为 JSON 字符串可再适配映射层）
 */
export interface OrderAddress {
  receiverName: string;
  receiverPhone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
}

/**
 * 订单行项
 */
export interface OrderItem {
  id: string;
  productId: string;
  skuId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

/**
 * 订单领域实体（与后端订单资源字段对齐的 MVP 定义）
 */
export interface Order {
  id: string;
  orderNo: string;
  totalAmount: number;
  pointsUsed?: number;
  couponId?: string;
  couponName?: string;
  couponDiscount?: number;
  status: OrderStatus;
  items: OrderItem[];
  address: OrderAddress;
  createTime: string;
  payTime?: string;
  deliveryTime?: string;
  receiptTime?: string;
}
