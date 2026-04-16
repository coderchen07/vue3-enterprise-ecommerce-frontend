<script setup lang="ts">
import type { Product } from '@/entities/product';

defineOptions({
  name: 'ProductCard',
});

interface ProductCardProps {
  product: Product;
}

defineProps<ProductCardProps>();
defineEmits<{
  click: [];
}>();

const formatPrice = (price: number): string => `￥${price.toFixed(2)}`;
</script>

<template>
  <button
    type="button"
    class="block w-full rounded-xl bg-white p-3 text-left shadow-sm md:p-4"
    @click="$emit('click')"
  >
    <div class="flex gap-3">
      <img
        :src="product.mainImage"
        :alt="product.name"
        class="h-24 w-24 flex-none rounded-lg bg-gray-100 object-cover md:h-28 md:w-28"
      />
      <div class="min-w-0 flex-1">
        <h3
          class="line-clamp-2 text-sm font-semibold text-gray-900 md:text-base"
        >
          {{ product.name }}
        </h3>
        <p class="mt-1 line-clamp-2 text-xs text-gray-500 md:text-sm">
          {{ product.desc }}
        </p>
        <div class="mt-2 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-base font-bold text-rose-600 md:text-lg">{{
              formatPrice(product.price)
            }}</span>
            <span
              v-if="product.originalPrice"
              class="text-xs text-gray-400 line-through"
            >
              {{ formatPrice(product.originalPrice) }}
            </span>
          </div>
          <span class="text-xs text-gray-400 md:text-sm"
            >已售 {{ product.sales }}</span
          >
        </div>
      </div>
    </div>
  </button>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
