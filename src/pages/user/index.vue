<script setup lang="ts">
import { computed } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import { showToast } from 'vant';
import { useRouter } from 'vue-router';
import { OrderStatus } from '@/entities/order';
import { useCouponStore } from '@/stores/coupon';
import { useOrderStore } from '@/stores/order';
import { useUserStore } from '@/stores/user';

defineOptions({
  name: 'UserCenterPage',
});

const router = useRouter();
const userStore = useUserStore();
const couponStore = useCouponStore();
const orderStore = useOrderStore();
const isDesktop = useMediaQuery('(min-width: 1024px)');

const avatar = computed<string>(
  () =>
    userStore.userInfo?.avatar ||
    'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
);
const nickname = computed<string>(
  () => userStore.userInfo?.nickname || '未登录用户',
);
const phone = computed<string>(() => {
  const rawPhone = userStore.userInfo?.phone;
  if (!rawPhone) {
    return '未绑定手机号';
  }
  return rawPhone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2');
});
const couponCount = computed<number>(() => couponStore.unusedCouponCount);
const points = computed<number>(() => userStore.points);

const pendingPaymentCount = computed<number>(
  () =>
    orderStore.orders.filter(
      (order) => order.status === OrderStatus.PendingPayment,
    ).length,
);
const pendingDeliveryCount = computed<number>(
  () =>
    orderStore.orders.filter(
      (order) => order.status === OrderStatus.PendingDelivery,
    ).length,
);
const pendingReceiptCount = computed<number>(
  () =>
    orderStore.orders.filter(
      (order) => order.status === OrderStatus.PendingReceipt,
    ).length,
);
const completedCount = computed<number>(
  () =>
    orderStore.orders.filter((order) => order.status === OrderStatus.Completed)
      .length,
);

const goOrderList = (): void => {
  void router.push('/order/list');
};

const goAddressList = (): void => {
  void router.push('/user/address');
};

const orderStatusCards = computed<
  Array<{ title: string; count: number; colorClass: string }>
>(() => [
  {
    title: '待付款',
    count: pendingPaymentCount.value,
    colorClass: 'text-orange-600',
  },
  {
    title: '待发货',
    count: pendingDeliveryCount.value,
    colorClass: 'text-blue-600',
  },
  {
    title: '待收货',
    count: pendingReceiptCount.value,
    colorClass: 'text-indigo-600',
  },
  {
    title: '已完成',
    count: completedCount.value,
    colorClass: 'text-emerald-600',
  },
]);

const logout = async (): Promise<void> => {
  await userStore.logout();
  showToast('已退出登录');
  await router.replace('/login');
};
</script>

<template>
  <section class="min-h-screen bg-gray-50 px-3 pb-8 pt-3 md:px-0 md:pt-0">
    <template v-if="isDesktop">
      <div class="grid grid-cols-12 gap-5">
        <aside class="col-span-4 space-y-4">
          <div
            class="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-sm"
          >
            <div class="flex items-center gap-4">
              <img
                :src="avatar"
                alt="user avatar"
                class="h-16 w-16 rounded-full border border-white object-cover shadow-sm"
              />
              <div class="min-w-0">
                <h1 class="truncate text-lg font-semibold text-gray-900">
                  {{ nickname }}
                </h1>
                <p class="mt-1 text-sm text-gray-500">{{ phone }}</p>
                <p
                  class="mt-2 inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700"
                >
                  黄金会员
                </p>
              </div>
            </div>
            <div class="mt-6 grid grid-cols-2 gap-3">
              <div class="rounded-xl bg-white/80 p-3 text-center">
                <p class="text-lg font-semibold text-gray-900">
                  {{ couponCount }}
                </p>
                <p class="mt-1 text-xs text-gray-500">优惠券</p>
              </div>
              <div class="rounded-xl bg-white/80 p-3 text-center">
                <p class="text-lg font-semibold text-gray-900">{{ points }}</p>
                <p class="mt-1 text-xs text-gray-500">积分</p>
              </div>
            </div>
          </div>

          <div class="rounded-2xl bg-white p-4 shadow-sm">
            <VanButton plain block type="default" @click="logout"
              >退出登录</VanButton
            >
          </div>
        </aside>

        <div class="col-span-8 space-y-4">
          <div class="rounded-2xl bg-white p-5 shadow-sm">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-semibold text-gray-900">订单状态</h2>
              <button
                type="button"
                class="text-sm text-blue-600"
                @click="goOrderList"
              >
                查看全部订单
              </button>
            </div>
            <div class="mt-4 grid grid-cols-4 gap-3">
              <button
                v-for="item in orderStatusCards"
                :key="item.title"
                type="button"
                class="rounded-xl border border-gray-100 bg-gray-50 px-3 py-4 text-center"
                @click="goOrderList"
              >
                <p :class="['text-lg font-semibold', item.colorClass]">
                  {{ item.count }}
                </p>
                <p class="mt-1 text-xs text-gray-500">{{ item.title }}</p>
              </button>
            </div>
          </div>

          <div class="rounded-2xl bg-white p-5 shadow-sm">
            <h2 class="text-base font-semibold text-gray-900">常用功能</h2>
            <div class="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                class="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-4 text-left hover:bg-gray-50"
                @click="goOrderList"
              >
                <div>
                  <p class="text-sm font-medium text-gray-900">我的订单</p>
                  <p class="mt-1 text-xs text-gray-500">查看历史订单与物流</p>
                </div>
                <span class="text-sm text-gray-400">&gt;</span>
              </button>
              <button
                type="button"
                class="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-4 text-left hover:bg-gray-50"
                @click="goAddressList"
              >
                <div>
                  <p class="text-sm font-medium text-gray-900">收货地址</p>
                  <p class="mt-1 text-xs text-gray-500">管理常用收货地址</p>
                </div>
                <span class="text-sm text-gray-400">&gt;</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <header
        class="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 px-4 py-5 shadow-sm"
      >
        <div class="flex items-center gap-3">
          <img
            :src="avatar"
            alt="user avatar"
            class="h-14 w-14 rounded-full border border-white object-cover shadow-sm"
          />
          <div class="min-w-0">
            <h1 class="truncate text-base font-semibold text-gray-900">
              {{ nickname }}
            </h1>
            <p class="mt-1 text-sm text-gray-500">{{ phone }}</p>
            <p
              class="mt-2 inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700"
            >
              黄金会员
            </p>
          </div>
        </div>
        <div class="mt-4 grid grid-cols-2 gap-2">
          <div class="rounded-xl bg-white/80 p-3 text-center">
            <p class="text-base font-semibold text-gray-900">
              {{ couponCount }}
            </p>
            <p class="mt-1 text-xs text-gray-500">优惠券</p>
          </div>
          <div class="rounded-xl bg-white/80 p-3 text-center">
            <p class="text-base font-semibold text-gray-900">{{ points }}</p>
            <p class="mt-1 text-xs text-gray-500">积分</p>
          </div>
        </div>
      </header>

      <div class="mt-3 rounded-2xl bg-white p-4 shadow-sm">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-gray-900">订单状态</h2>
          <button
            type="button"
            class="text-xs text-blue-600"
            @click="goOrderList"
          >
            全部订单
          </button>
        </div>
        <div class="grid grid-cols-4 gap-2">
          <button
            v-for="item in orderStatusCards"
            :key="item.title"
            type="button"
            class="rounded-lg border border-gray-100 px-2 py-3 text-center"
            @click="goOrderList"
          >
            <p :class="['text-base font-semibold', item.colorClass]">
              {{ item.count }}
            </p>
            <p class="mt-1 text-xs text-gray-500">{{ item.title }}</p>
          </button>
        </div>
      </div>

      <div class="mt-3">
        <VanCellGroup inset>
          <VanCell title="我的订单" is-link @click="goOrderList" />
          <VanCell title="收货地址" is-link @click="goAddressList" />
        </VanCellGroup>
      </div>

      <div class="mt-6 px-2">
        <VanButton plain block type="default" @click="logout"
          >退出登录</VanButton
        >
      </div>
    </template>
  </section>
</template>
