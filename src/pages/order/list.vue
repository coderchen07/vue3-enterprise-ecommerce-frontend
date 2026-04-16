<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import { showToast } from 'vant';
import { useRouter } from 'vue-router';
import { OrderStatus, type Order } from '@/entities/order';
import { useOrderStore } from '@/stores/order';

defineOptions({
  name: 'OrderListPage',
});

type OrderTabValue = 'all' | OrderStatus;

const router = useRouter();
const orderStore = useOrderStore();
const isDesktop = useMediaQuery('(min-width: 1024px)');
const activeTab = ref<OrderTabValue>('all');
const loading = ref<boolean>(false);
const page = ref<number>(1);
const pageSize = 10;
const displayOrders = ref<Order[]>([]);

const total = computed<number>(() => displayOrders.value.length);
const pagedOrders = computed<Order[]>(() => {
  if (!isDesktop.value) {
    return displayOrders.value;
  }
  const start = (page.value - 1) * pageSize;
  const end = start + pageSize;
  return displayOrders.value.slice(start, end);
});

const statusTextMap: Record<OrderStatus, string> = {
  [OrderStatus.PendingPayment]: '待付款',
  [OrderStatus.PendingDelivery]: '待发货',
  [OrderStatus.PendingReceipt]: '待收货',
  [OrderStatus.Completed]: '已完成',
  [OrderStatus.Cancelled]: '已取消',
};

const loadOrders = async (): Promise<void> => {
  loading.value = true;
  try {
    displayOrders.value = await orderStore.ordersByStatus(activeTab.value);
    page.value = 1;
  } finally {
    loading.value = false;
  }
};

watch(activeTab, () => {
  void loadOrders();
});

watch(
  () => orderStore.orders,
  () => {
    void loadOrders();
  },
  { deep: true, immediate: true },
);

const getStatusText = (status: OrderStatus): string => statusTextMap[status];

const viewDetail = (orderId: string): void => {
  void router.push(`/order/detail/${orderId}`);
};

const payOrder = (orderId: string): void => {
  const success = orderStore.payOrder(orderId);
  showToast(success ? '支付成功' : '订单状态已变更，请刷新后重试');
};

const remindDelivery = (): void => {
  showToast('已提醒发货');
};

const confirmReceipt = (orderId: string): void => {
  orderStore.updateOrderStatus(orderId, OrderStatus.Completed);
  showToast('确认收货成功');
};

const cancelOrder = (orderId: string): void => {
  orderStore.cancelOrder(orderId);
  showToast('订单已取消');
};

const removeOrder = (orderId: string): void => {
  orderStore.removeOrder(orderId);
  showToast('订单已删除');
};

const goProducts = (): void => {
  void router.push('/products');
};
</script>

<template>
  <section class="min-h-screen bg-gray-50">
    <template v-if="isDesktop">
      <div class="space-y-4">
        <div class="rounded-xl bg-white p-4 shadow-sm">
          <h1 class="text-xl font-semibold text-gray-900">我的订单</h1>
          <el-tabs v-model="activeTab" class="mt-2">
            <el-tab-pane label="全部" name="all" />
            <el-tab-pane label="待付款" :name="OrderStatus.PendingPayment" />
            <el-tab-pane label="待发货" :name="OrderStatus.PendingDelivery" />
            <el-tab-pane label="待收货" :name="OrderStatus.PendingReceipt" />
            <el-tab-pane label="已完成" :name="OrderStatus.Completed" />
          </el-tabs>
        </div>

        <div class="rounded-xl bg-white p-4 shadow-sm">
          <el-table v-loading="loading" :data="pagedOrders" row-key="id">
            <el-table-column label="订单号" width="220">
              <template #default="{ row }">
                <button
                  type="button"
                  class="text-blue-600 hover:underline"
                  @click="viewDetail(row.id)"
                >
                  {{ row.orderNo }}
                </button>
              </template>
            </el-table-column>
            <el-table-column label="商品信息" min-width="280">
              <template #default="{ row }">
                <div class="space-y-2">
                  <div
                    v-for="item in row.items.slice(0, 2)"
                    :key="item.id"
                    class="flex items-center gap-2"
                  >
                    <img
                      :src="item.image"
                      :alt="item.name"
                      class="h-10 w-10 rounded object-cover"
                    />
                    <span class="line-clamp-1 text-sm text-gray-700">{{
                      item.name
                    }}</span>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="金额" width="140" align="right">
              <template #default="{ row }">
                <span class="font-semibold text-rose-600"
                  >￥{{ row.totalAmount.toFixed(2) }}</span
                >
              </template>
            </el-table-column>
            <el-table-column label="状态" width="120">
              <template #default="{ row }">
                <span>{{ getStatusText(row.status) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="280">
              <template #default="{ row }">
                <div class="flex flex-wrap gap-2">
                  <el-button link type="primary" @click="viewDetail(row.id)"
                    >查看详情</el-button
                  >
                  <el-button
                    v-if="row.status === OrderStatus.PendingPayment"
                    link
                    type="danger"
                    @click="payOrder(row.id)"
                  >
                    去付款
                  </el-button>
                  <el-button
                    v-if="row.status === OrderStatus.PendingPayment"
                    link
                    @click="cancelOrder(row.id)"
                  >
                    取消订单
                  </el-button>
                  <el-button
                    v-if="row.status === OrderStatus.PendingDelivery"
                    link
                    @click="remindDelivery"
                  >
                    提醒发货
                  </el-button>
                  <el-button
                    v-if="row.status === OrderStatus.PendingReceipt"
                    link
                    type="success"
                    @click="confirmReceipt(row.id)"
                  >
                    确认收货
                  </el-button>
                  <el-button
                    v-if="row.status === OrderStatus.Cancelled"
                    link
                    type="danger"
                    @click="removeOrder(row.id)"
                  >
                    删除订单
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <div v-if="displayOrders.length === 0" class="py-12">
            <el-empty description="暂无订单" />
          </div>

          <div v-else class="mt-4 flex justify-end">
            <el-pagination
              background
              layout="prev, pager, next"
              :page-size="pageSize"
              :total="total"
              :current-page="page"
              @current-change="(nextPage) => (page = nextPage)"
            />
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <header class="sticky top-0 z-10 bg-white shadow-sm">
        <VanTabs v-model:active="activeTab" sticky>
          <VanTab title="全部" name="all" />
          <VanTab title="待付款" :name="OrderStatus.PendingPayment" />
          <VanTab title="待发货" :name="OrderStatus.PendingDelivery" />
          <VanTab title="待收货" :name="OrderStatus.PendingReceipt" />
          <VanTab title="已完成" :name="OrderStatus.Completed" />
        </VanTabs>
      </header>

      <div class="space-y-3 p-3">
        <template v-if="displayOrders.length > 0">
          <article
            v-for="order in displayOrders"
            :key="order.id"
            class="rounded-xl bg-white p-3 shadow-sm"
          >
            <div
              class="flex items-center justify-between border-b border-gray-100 pb-2 text-xs text-gray-500"
            >
              <span>订单号：{{ order.orderNo }}</span>
              <span class="text-rose-600">{{
                getStatusText(order.status)
              }}</span>
            </div>
            <button
              type="button"
              class="mt-2 flex w-full items-center gap-3 text-left"
              @click="viewDetail(order.id)"
            >
              <img
                :src="order.items[0]?.image"
                :alt="order.items[0]?.name"
                class="h-14 w-14 rounded object-cover"
              />
              <div class="min-w-0 flex-1">
                <p class="line-clamp-1 text-sm text-gray-800">
                  {{ order.items[0]?.name }}
                </p>
                <p class="mt-1 text-xs text-gray-500">
                  共 {{ order.items.length }} 件商品
                </p>
              </div>
              <span class="text-sm font-semibold text-rose-600"
                >￥{{ order.totalAmount.toFixed(2) }}</span
              >
            </button>
            <div class="mt-3 flex justify-end gap-2">
              <VanButton size="small" @click="viewDetail(order.id)"
                >详情</VanButton
              >
              <VanButton
                v-if="order.status === OrderStatus.PendingPayment"
                size="small"
                type="danger"
                @click="payOrder(order.id)"
              >
                去付款
              </VanButton>
              <VanButton
                v-if="order.status === OrderStatus.PendingPayment"
                size="small"
                plain
                @click="cancelOrder(order.id)"
              >
                取消
              </VanButton>
              <VanButton
                v-if="order.status === OrderStatus.PendingReceipt"
                size="small"
                type="primary"
                @click="confirmReceipt(order.id)"
              >
                确认收货
              </VanButton>
              <VanButton
                v-if="order.status === OrderStatus.Cancelled"
                size="small"
                plain
                type="danger"
                @click="removeOrder(order.id)"
              >
                删除订单
              </VanButton>
            </div>
          </article>
        </template>
        <VanEmpty v-else description="暂无订单">
          <VanButton round type="primary" @click="goProducts">去逛逛</VanButton>
        </VanEmpty>
      </div>
    </template>
  </section>
</template>
