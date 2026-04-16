<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCartStore } from '@/stores/cart';

defineOptions({
  name: 'PcLayout',
});

const router = useRouter();
const route = useRoute();
const cartStore = useCartStore();

const searchKeyword = ref<string>('');
const activeMenu = computed<string>(() => {
  if (route.path !== '/products') {
    return route.path;
  }
  const feature =
    typeof route.query.feature === 'string' ? route.query.feature : 'default';
  if (
    feature === 'seckill' ||
    feature === 'coupon' ||
    feature === 'signin' ||
    feature === 'redpacket'
  ) {
    return feature;
  }
  return 'default';
});

const miniCartItems = computed(() => cartStore.items.slice(0, 3));
const miniCartTotal = computed<number>(() =>
  miniCartItems.value.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0,
  ),
);

const goSearch = (): void => {
  const keyword = searchKeyword.value.trim();
  void router.push({
    path: '/search',
    query: keyword ? { keyword } : undefined,
  });
};

watch(
  () => route.query.keyword,
  (value) => {
    if (typeof value === 'string') {
      searchKeyword.value = value;
    }
  },
  { immediate: true },
);

const handleMenuSelect = (index: string): void => {
  if (index === 'default') {
    void router.push('/products');
    return;
  }
  if (
    index === 'seckill' ||
    index === 'coupon' ||
    index === 'signin' ||
    index === 'redpacket'
  ) {
    void router.push({
      path: '/products',
      query: {
        feature: index,
      },
    });
    return;
  }
};
</script>

<template>
  <el-container class="min-h-screen bg-gray-100">
    <el-header class="!h-auto border-b border-gray-200 bg-white">
      <div
        class="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-6"
      >
        <div class="flex min-w-[180px] items-center">
          <div class="text-xl font-bold text-rose-600">电商前端平台</div>
        </div>

        <div class="mx-2 max-w-2xl flex-1">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索商品"
            clearable
            @keyup.enter="goSearch"
          >
            <template #append>
              <el-button @click="goSearch">搜索</el-button>
            </template>
          </el-input>
        </div>

        <div class="flex items-center gap-5 text-sm text-gray-700">
          <button type="button" @click="router.push('/order/list')">
            我的订单
          </button>
          <el-popover placement="bottom" trigger="hover" :width="280">
            <template #reference>
              <button type="button" @click="router.push('/cart')">
                购物车({{ cartStore.totalCount }})
              </button>
            </template>
            <div class="space-y-3">
              <p class="text-sm font-semibold text-gray-800">购物车预览</p>
              <p
                v-if="miniCartItems.length === 0"
                class="text-xs text-gray-500"
              >
                购物车为空
              </p>
              <div
                v-for="item in miniCartItems"
                :key="item.id"
                class="flex items-center gap-2"
              >
                <img
                  :src="item.image"
                  :alt="item.name"
                  class="h-8 w-8 rounded object-cover"
                />
                <p class="line-clamp-1 flex-1 text-xs text-gray-700">
                  {{ item.name }}
                </p>
                <span class="text-xs text-rose-600"
                  >￥{{ (item.price * item.quantity).toFixed(2) }}</span
                >
              </div>
              <p class="text-right text-xs text-gray-700">
                小计：￥{{ miniCartTotal.toFixed(2) }}
              </p>
            </div>
          </el-popover>
          <button type="button" @click="router.push('/user')">个人中心</button>
        </div>
      </div>

      <div class="border-t border-gray-100 bg-white">
        <div class="mx-auto max-w-[1200px]">
          <el-menu
            mode="horizontal"
            :default-active="activeMenu"
            @select="handleMenuSelect"
          >
            <el-menu-item index="default">首页</el-menu-item>
            <el-menu-item index="seckill">秒杀</el-menu-item>
            <el-menu-item index="coupon">优惠券</el-menu-item>
            <el-menu-item index="signin">签到</el-menu-item>
            <el-menu-item index="redpacket">领红包</el-menu-item>
          </el-menu>
        </div>
      </div>
    </el-header>

    <el-main class="!p-6">
      <div class="mx-auto w-full max-w-[1200px]">
        <slot />
      </div>
    </el-main>

    <el-footer class="border-t border-gray-200 bg-white !py-8">
      <div
        class="mx-auto grid max-w-[1200px] grid-cols-4 gap-6 text-sm text-gray-600"
      >
        <div>
          <p class="mb-2 font-semibold text-gray-800">帮助中心</p>
          <p>账户管理</p>
          <p>购物指南</p>
        </div>
        <div>
          <p class="mb-2 font-semibold text-gray-800">关于我们</p>
          <p>平台介绍</p>
          <p>联系我们</p>
        </div>
        <div>
          <p class="mb-2 font-semibold text-gray-800">售后服务</p>
          <p>退换货政策</p>
          <p>发票说明</p>
        </div>
        <div>
          <p class="mb-2 font-semibold text-gray-800">商务合作</p>
          <p>品牌入驻</p>
          <p>渠道代理</p>
        </div>
      </div>
      <p class="mt-6 text-center text-xs text-gray-500">
        Copyright © 电商前端平台
      </p>
    </el-footer>
  </el-container>
</template>
