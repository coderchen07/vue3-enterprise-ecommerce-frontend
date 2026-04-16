<script setup lang="ts">
import type { Product } from '@/entities/product';

defineOptions({
  name: 'ProductCardPc',
});

defineProps<{
  product: Product;
}>();

defineEmits<{
  click: [];
  addToCart: [];
}>();

const formatPrice = (price: number): string => `￥${price.toFixed(2)}`;
const reviewCount = (sales: number): string =>
  `${Math.max(1, Math.floor(sales * 0.72))}人评`;
const soldCount = (sales: number): string => `已售${sales}`;
</script>

<template>
  <article
    class="group flex h-full flex-col rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
  >
    <button
      type="button"
      class="flex flex-1 flex-col text-left"
      @click="$emit('click')"
    >
      <div class="relative w-full overflow-hidden rounded-lg pt-[100%]">
        <img
          :src="product.mainImage"
          :alt="product.name"
          class="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      <div class="mt-3 flex flex-1 flex-col">
        <h3
          class="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-5 text-gray-900"
        >
          {{ product.name }}
        </h3>
        <p class="mt-1 line-clamp-1 text-xs text-gray-500">
          {{ product.desc }}
        </p>

        <div class="mt-3 flex items-end justify-between gap-2">
          <div class="min-w-0 flex items-center gap-2">
            <p class="whitespace-nowrap text-xl font-bold text-rose-600">
              {{ formatPrice(product.price) }}
            </p>
            <p
              v-if="product.originalPrice"
              class="whitespace-nowrap text-xs text-gray-400 line-through"
            >
              {{ formatPrice(product.originalPrice) }}
            </p>
          </div>
          <div class="text-right text-xs leading-5 text-gray-400">
            <p class="whitespace-nowrap">{{ reviewCount(product.sales) }}</p>
            <p class="whitespace-nowrap">{{ soldCount(product.sales) }}</p>
          </div>
        </div>
        <p class="mt-2 text-xs text-gray-500">店铺：官方旗舰店</p>
      </div>
    </button>

    <el-button
      type="danger"
      class="mt-auto w-full whitespace-nowrap opacity-0 transition group-hover:opacity-100"
      @click="$emit('addToCart')"
    >
      加入购物车
    </el-button>
  </article>
</template>
