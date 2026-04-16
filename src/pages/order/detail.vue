<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import { showToast } from 'vant';
import { useRoute, useRouter } from 'vue-router';
import { OrderStatus, type Order } from '@/entities/order';
import { useOrderStore } from '@/stores/order';

defineOptions({
  name: 'OrderDetailPage',
});

const route = useRoute();
const router = useRouter();
const orderStore = useOrderStore();
const isDesktop = useMediaQuery('(min-width: 1024px)');

const orderId = computed<string>(() => String(route.params.id ?? ''));
const order = computed<Order | null>(() => orderStore.currentOrder);

const statusTextMap: Record<OrderStatus, string> = {
  [OrderStatus.PendingPayment]: '待付款',
  [OrderStatus.PendingDelivery]: '待发货',
  [OrderStatus.PendingReceipt]: '待收货',
  [OrderStatus.Completed]: '已完成',
  [OrderStatus.Cancelled]: '已取消',
};

const statusDescMap: Record<OrderStatus, string> = {
  [OrderStatus.PendingPayment]: '请尽快完成支付，超时可能被系统取消',
  [OrderStatus.PendingDelivery]: '商家正在备货，请耐心等待',
  [OrderStatus.PendingReceipt]: '商品已发出，请及时确认收货',
  [OrderStatus.Completed]: '订单已完成，感谢您的支持',
  [OrderStatus.Cancelled]: '订单已取消',
};

const getStatusText = (status: OrderStatus): string => statusTextMap[status];
const getStatusDesc = (status: OrderStatus): string => statusDescMap[status];
const formatPrice = (price: number): string => `￥${price.toFixed(2)}`;

const payOrder = (): void => {
  if (!order.value) {
    return;
  }
  const success = orderStore.payOrder(order.value.id);
  showToast(success ? '支付成功' : '订单状态已变更，请返回列表刷新');
};

const confirmReceipt = (): void => {
  if (!order.value) {
    return;
  }
  orderStore.updateOrderStatus(order.value.id, OrderStatus.Completed);
  showToast('确认收货成功');
};

const cancelOrder = (): void => {
  if (!order.value) {
    return;
  }
  orderStore.cancelOrder(order.value.id);
  showToast('订单已取消');
};

const goList = (): void => {
  void router.replace('/order/list');
};

onMounted(async () => {
  await orderStore.getOrderDetail(orderId.value);
});
</script>

<template>
  <section class="min-h-screen bg-gray-50 p-3 md:p-6">
    <template v-if="order">
      <div class="mx-auto w-full max-w-[1200px] space-y-4">
        <header class="rounded-xl bg-white p-4 shadow-sm">
          <p class="text-lg font-semibold text-gray-900">
            {{ getStatusText(order.status) }}
          </p>
          <p class="mt-1 text-sm text-gray-500">
            {{ getStatusDesc(order.status) }}
          </p>
        </header>

        <div :class="isDesktop ? 'grid grid-cols-12 gap-4' : 'space-y-4'">
          <div :class="isDesktop ? 'col-span-8 space-y-4' : 'space-y-4'">
            <section class="rounded-xl bg-white p-4 shadow-sm">
              <h2 class="text-sm font-semibold text-gray-900">收货地址</h2>
              <p class="mt-2 text-sm text-gray-800">
                {{ order.address.receiverName }}
                {{ order.address.receiverPhone }}
              </p>
              <p class="mt-1 text-xs text-gray-500">
                {{ order.address.province }}{{ order.address.city
                }}{{ order.address.district }}{{ order.address.detail }}
              </p>
            </section>

            <section class="rounded-xl bg-white p-4 shadow-sm">
              <h2 class="text-sm font-semibold text-gray-900">商品清单</h2>
              <div
                v-for="item in order.items"
                :key="item.id"
                class="mt-3 flex items-center gap-3"
              >
                <img
                  :src="item.image"
                  :alt="item.name"
                  class="h-14 w-14 rounded object-cover"
                />
                <div class="min-w-0 flex-1">
                  <p class="line-clamp-1 text-sm text-gray-800">
                    {{ item.name }}
                  </p>
                  <p class="mt-1 text-xs text-gray-500">x{{ item.quantity }}</p>
                </div>
                <p class="text-sm font-semibold text-rose-600">
                  {{ formatPrice(item.price * item.quantity) }}
                </p>
              </div>
            </section>
          </div>

          <aside :class="isDesktop ? 'col-span-4 space-y-4' : 'space-y-4'">
            <section class="rounded-xl bg-white p-4 shadow-sm">
              <h2 class="text-sm font-semibold text-gray-900">金额明细</h2>
              <div class="mt-3 space-y-2 text-sm text-gray-600">
                <p class="flex justify-between">
                  <span>商品总额</span
                  ><span>{{ formatPrice(order.totalAmount) }}</span>
                </p>
                <p class="flex justify-between">
                  <span>运费</span><span>￥0.00</span>
                </p>
                <p
                  class="flex justify-between border-t border-gray-100 pt-2 text-base font-semibold text-rose-600"
                >
                  <span>实付金额</span
                  ><span>{{ formatPrice(order.totalAmount) }}</span>
                </p>
              </div>
            </section>

            <section
              class="rounded-xl bg-white p-4 shadow-sm text-xs text-gray-500"
            >
              <p>订单编号：{{ order.orderNo }}</p>
              <p class="mt-2">创建时间：{{ order.createTime }}</p>
              <p v-if="order.payTime" class="mt-2">
                支付时间：{{ order.payTime }}
              </p>
              <p v-if="order.deliveryTime" class="mt-2">
                发货时间：{{ order.deliveryTime }}
              </p>
              <p v-if="order.receiptTime" class="mt-2">
                收货时间：{{ order.receiptTime }}
              </p>
            </section>

            <section class="rounded-xl bg-white p-4 shadow-sm">
              <div class="flex flex-wrap justify-end gap-2">
                <template v-if="order.status === OrderStatus.PendingPayment">
                  <el-button @click="cancelOrder">取消订单</el-button>
                  <el-button type="primary" @click="payOrder">去付款</el-button>
                </template>
                <el-button
                  v-if="order.status === OrderStatus.PendingReceipt"
                  type="primary"
                  @click="confirmReceipt"
                >
                  确认收货
                </el-button>
                <el-button @click="goList">返回列表</el-button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </template>

    <div v-else class="flex min-h-[60vh] items-center justify-center">
      <VanEmpty description="订单不存在或已删除">
        <VanButton round type="primary" @click="goList">返回订单列表</VanButton>
      </VanEmpty>
    </div>
  </section>
</template>
