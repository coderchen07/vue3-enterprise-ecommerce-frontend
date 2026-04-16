import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { OrderStatus, type Order, type OrderAddress } from '@/entities/order';
import {
  createMockOrder,
  filterMockOrders,
  getMockOrderDetail,
} from '@/shared/api/modules/order';
import { useCartStore } from '@/stores/cart';
import { useCouponStore } from '@/stores/coupon';
import { useUserStore } from '@/stores/user';

interface CreateOrderInputItem {
  id: string;
  productId: string;
  skuId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

interface CreateOrderInput {
  items: CreateOrderInputItem[];
  address: OrderAddress;
  couponId?: string;
  couponName?: string;
  couponDiscount?: number;
  pointsUsed?: number;
  finalPaidAmount?: number;
}

export const useOrderStore = defineStore(
  'order',
  () => {
    const orders = ref<Order[]>([]);
    const currentOrder = ref<Order | null>(null);

    const sortedOrders = computed<Order[]>(() =>
      [...orders.value].sort(
        (a, b) =>
          new Date(b.createTime).getTime() - new Date(a.createTime).getTime(),
      ),
    );

    const pendingCount = computed<number>(
      () =>
        orders.value.filter(
          (order) => order.status === OrderStatus.PendingPayment,
        ).length,
    );

    const ordersByStatus = async (
      status: OrderStatus | 'all',
    ): Promise<Order[]> => filterMockOrders(sortedOrders.value, { status });

    const createOrder = async (data: CreateOrderInput): Promise<Order> => {
      const cartStore = useCartStore();
      const couponStore = useCouponStore();
      const userStore = useUserStore();
      const order = await createMockOrder({
        items: data.items,
        address: data.address,
        couponId: data.couponId,
        couponName: data.couponName,
        couponDiscount: data.couponDiscount,
        pointsUsed: data.pointsUsed,
        finalPaidAmount: data.finalPaidAmount,
      });
      orders.value = [order, ...orders.value];

      if (data.couponId) {
        couponStore.useCoupon(data.couponId);
      }
      if (data.pointsUsed && data.pointsUsed > 0) {
        userStore.deductPoints(data.pointsUsed);
      }

      const orderedIds = new Set(data.items.map((item) => item.id));
      cartStore.items.forEach((item) => {
        if (orderedIds.has(item.id)) {
          cartStore.removeItem(item.id);
        }
      });
      currentOrder.value = order;
      return order;
    };

    const payOrder = (id: string): boolean => {
      const index = orders.value.findIndex((order) => order.id === id);
      if (index < 0) {
        return false;
      }
      const targetOrder = orders.value[index];
      if (targetOrder.status !== OrderStatus.PendingPayment) {
        return false;
      }
      updateOrderStatus(id, OrderStatus.PendingDelivery);
      const userStore = useUserStore();
      userStore.addPoints(targetOrder.totalAmount);
      userStore.addConsumption(targetOrder.totalAmount);
      return true;
    };

    const updateOrderStatus = (id: string, status: OrderStatus): void => {
      const index = orders.value.findIndex((order) => order.id === id);
      if (index < 0) {
        return;
      }

      const now = new Date().toISOString();
      const target = orders.value[index];
      orders.value[index] = {
        ...target,
        status,
        payTime: status === OrderStatus.PendingDelivery ? now : target.payTime,
        deliveryTime:
          status === OrderStatus.PendingReceipt ? now : target.deliveryTime,
        receiptTime:
          status === OrderStatus.Completed ? now : target.receiptTime,
      };
      if (currentOrder.value?.id === id) {
        currentOrder.value = orders.value[index];
      }
    };

    const cancelOrder = (id: string): void => {
      updateOrderStatus(id, OrderStatus.Cancelled);
    };

    const removeOrder = (id: string): void => {
      orders.value = orders.value.filter((order) => order.id !== id);
      if (currentOrder.value?.id === id) {
        currentOrder.value = null;
      }
    };

    const getOrderDetail = async (id: string): Promise<Order | null> => {
      const detail = await getMockOrderDetail(orders.value, id);
      currentOrder.value = detail;
      return detail;
    };

    return {
      orders,
      currentOrder,
      sortedOrders,
      pendingCount,
      ordersByStatus,
      createOrder,
      payOrder,
      updateOrderStatus,
      cancelOrder,
      removeOrder,
      getOrderDetail,
    };
  },
  {
    persist: {
      key: 'order-store',
      storage: localStorage,
      pick: ['orders'],
    },
  },
);
