<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import { showToast } from 'vant';
import { useRouter } from 'vue-router';
import { useSeckill } from '@/features/seckill/composables/useSeckill';
import { useCartStore } from '@/stores/cart';

defineOptions({
  name: 'SeckillPage',
});

const router = useRouter();
const cartStore = useCartStore();
const isDesktop = useMediaQuery('(min-width: 1024px)');
const { items, validTo, formatCountdown, isSeckillValid } = useSeckill();
const countdownText = ref<string>('');
let timer: number | undefined;

const updateCountdown = (): void => {
  countdownText.value = formatCountdown(validTo.value);
};

onMounted(() => {
  updateCountdown();
  timer = window.setInterval(updateCountdown, 1000);
});

onBeforeUnmount(() => {
  if (timer) {
    window.clearInterval(timer);
  }
});

const canBuy = computed<boolean>(() =>
  items.value.every((item) => isSeckillValid(item)),
);
const formatPrice = (price: number): string => `￥${price.toFixed(2)}`;
const formatDiscount = (rate: number): string => `${(rate * 10).toFixed(1)}折`;

const addToCart = (itemId: string): void => {
  const item = items.value.find((product) => product.id === itemId);
  if (!item) {
    return;
  }
  if (!isSeckillValid(item)) {
    showToast('当前秒杀已结束');
    return;
  }
  if (item.stock < 1) {
    showToast('库存不足');
    return;
  }
  const sku = item.skus[0];
  cartStore.addItem({
    id: `${item.id}-${sku.id}-seckill`,
    productId: item.id,
    skuId: sku.id,
    name: `${item.name} ${sku.name}`,
    image: item.mainImage,
    price: item.seckillPrice,
    quantity: 1,
    stock: sku.stock,
    isSeckill: true,
    seckillPrice: item.seckillPrice,
  });
  showToast('已加入购物车');
};

const buyNow = (itemId: string): void => {
  const item = items.value.find((product) => product.id === itemId);
  if (!item) {
    return;
  }
  if (!isSeckillValid(item)) {
    showToast('当前秒杀已结束');
    return;
  }
  if (item.stock < 1) {
    showToast('库存不足');
    return;
  }
  const sku = item.skus[0];
  void router.push({
    path: '/order/checkout',
    state: {
      items: [
        {
          id: `${item.id}-${sku.id}-seckill`,
          productId: item.id,
          skuId: sku.id,
          name: `${item.name} ${sku.name}`,
          image: item.mainImage,
          price: item.seckillPrice,
          quantity: 1,
          stock: sku.stock,
          isSeckill: true,
          seckillPrice: item.seckillPrice,
        },
      ],
    },
  });
};
</script>

<template>
  <section class="min-h-screen bg-gray-50 p-3 md:p-4">
    <div class="mx-auto w-full max-w-[1200px]">
      <header
        class="mb-4 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 p-4 text-white shadow-sm"
      >
        <p class="text-lg font-semibold">今日秒杀，手慢无</p>
        <p class="mt-1 text-sm opacity-95">
          距结束 {{ countdownText }}
          <span v-if="!canBuy" class="ml-2">（已结束）</span>
        </p>
      </header>

      <div
        class="grid gap-3"
        :class="isDesktop ? 'grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'"
      >
        <article
          v-for="item in items"
          :key="item.id"
          class="flex flex-col rounded-xl bg-white p-3 shadow-sm"
        >
          <img
            :src="item.mainImage"
            :alt="item.name"
            class="h-44 w-full rounded-lg bg-gray-100 object-cover"
          />
          <h3 class="mt-3 line-clamp-2 text-sm font-medium text-gray-900">
            {{ item.name }}
          </h3>
          <div class="mt-2 flex items-center justify-between">
            <p class="text-lg font-semibold text-rose-600">
              {{ formatPrice(item.seckillPrice) }}
            </p>
            <p
              class="rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-600"
            >
              {{ formatDiscount(item.discountRate) }}
            </p>
          </div>
          <p class="mt-1 text-xs text-gray-400 line-through">
            {{ formatPrice(item.price) }}
          </p>
          <p class="mt-1 text-xs text-gray-500">已售 {{ item.sales }}</p>
          <div class="mt-3 grid grid-cols-2 gap-2">
            <template v-if="isDesktop">
              <el-button plain @click="addToCart(item.id)"
                >加入购物车</el-button
              >
              <el-button type="danger" @click="buyNow(item.id)"
                >立即购买</el-button
              >
            </template>
            <template v-else>
              <VanButton plain type="primary" @click="addToCart(item.id)"
                >加入购物车</VanButton
              >
              <VanButton type="danger" @click="buyNow(item.id)"
                >立即购买</VanButton
              >
            </template>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
