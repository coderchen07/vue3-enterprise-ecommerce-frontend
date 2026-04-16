import type { Order, OrderAddress, OrderStatus } from '@/entities/order';
import { OrderStatus as OrderStatusEnum } from '@/entities/order';

export interface CreateOrderPayload {
  items: Array<{
    id: string;
    productId: string;
    skuId: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
  }>;
  address: OrderAddress;
  couponId?: string;
  couponName?: string;
  couponDiscount?: number;
  pointsUsed?: number;
  finalPaidAmount?: number;
}

export interface MockOrderListQuery {
  status?: OrderStatus | 'all';
}

const createOrderNo = (): string =>
  `OD${Date.now()}${Math.floor(Math.random() * 1000)}`;

export async function createMockOrder(
  payload: CreateOrderPayload,
): Promise<Order> {
  const now = new Date().toISOString();
  const itemsTotal = payload.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const couponDiscount = payload.couponDiscount ?? 0;
  const pointsUsed = Math.max(0, Math.floor(payload.pointsUsed ?? 0));
  const prePayAmount = Math.max(0, itemsTotal - couponDiscount);
  const fallbackPaidAmount = Math.max(0, prePayAmount - pointsUsed);
  const totalAmount = Math.max(
    0,
    payload.finalPaidAmount ?? fallbackPaidAmount,
  );
  return {
    id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    orderNo: createOrderNo(),
    totalAmount,
    couponId: payload.couponId,
    couponName: payload.couponName,
    couponDiscount: couponDiscount > 0 ? couponDiscount : undefined,
    pointsUsed: pointsUsed > 0 ? pointsUsed : undefined,
    status: OrderStatusEnum.PendingPayment,
    items: payload.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      skuId: item.skuId,
      name: item.name,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
    })),
    address: payload.address,
    createTime: now,
  };
}

export async function filterMockOrders(
  orders: Order[],
  query?: MockOrderListQuery,
): Promise<Order[]> {
  if (!query || query.status === undefined || query.status === 'all') {
    return [...orders];
  }
  return orders.filter((order) => order.status === query.status);
}

export async function getMockOrderDetail(
  orders: Order[],
  orderId: string,
): Promise<Order | null> {
  return orders.find((order) => order.id === orderId) ?? null;
}
