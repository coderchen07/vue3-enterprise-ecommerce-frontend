<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Product, ProductSku } from '@/entities/product';

const props = defineProps<{
  show: boolean;
  product: Product | null;
  selectedSkuId?: string;
  actionType?: 'cart' | 'buy';
}>();

const emit = defineEmits<{
  'update:show': [value: boolean];
  confirm: [payload: { sku: ProductSku; quantity: number }];
  'update:selected-sku-id': [value: string];
}>();

const quantity = ref<number>(1);

const skus = computed<ProductSku[]>(() => props.product?.skus ?? []);

const internalSelectedSkuId = computed<string>({
  get: () => props.selectedSkuId ?? skus.value[0]?.id ?? '',
  set: (value) => emit('update:selected-sku-id', value),
});

const selectedSku = computed<ProductSku | null>(
  () =>
    skus.value.find((sku) => sku.id === internalSelectedSkuId.value) ?? null,
);

watch(
  selectedSku,
  (sku) => {
    if (!sku) {
      quantity.value = 1;
      return;
    }
    quantity.value = Math.min(quantity.value, Math.max(1, sku.stock));
  },
  { immediate: true },
);

const closePopup = (): void => {
  emit('update:show', false);
};

const handleConfirm = (): void => {
  if (!selectedSku.value) {
    return;
  }

  emit('confirm', {
    sku: selectedSku.value,
    quantity: quantity.value,
  });
  closePopup();
};

const updateQuantity = (value: number): void => {
  const maxStock = Math.max(1, selectedSku.value?.stock ?? 1);
  quantity.value = Math.min(Math.max(1, value), maxStock);
};

const formatPrice = (price: number): string => `¥${price.toFixed(2)}`;
const confirmText = computed<string>(() =>
  props.actionType === 'buy' ? '确认购买' : '确认加入',
);
</script>

<template>
  <VanPopup
    :show="show"
    position="bottom"
    round
    @update:show="emit('update:show', $event)"
  >
    <div class="p-4">
      <h3 class="text-base font-semibold text-gray-900">选择规格</h3>

      <div
        v-if="props.product && selectedSku"
        class="mt-3 flex items-center gap-3 rounded-lg bg-gray-50 p-3"
      >
        <img
          :src="props.product.mainImage"
          :alt="props.product.name"
          class="h-14 w-14 rounded object-cover"
        />
        <div class="min-w-0 flex-1">
          <p class="line-clamp-1 text-sm text-gray-700">
            {{ props.product.name }}
          </p>
          <p class="mt-1 text-sm font-semibold text-rose-600">
            {{ formatPrice(selectedSku.price) }}
          </p>
          <p class="mt-1 text-xs text-gray-500">
            库存：{{ selectedSku.stock }}
          </p>
        </div>
      </div>

      <div class="mt-3 flex flex-wrap gap-2">
        <button
          v-for="sku in skus"
          :key="sku.id"
          type="button"
          class="rounded-full border px-3 py-1 text-sm"
          :class="
            internalSelectedSkuId === sku.id
              ? 'border-rose-500 bg-rose-50 text-rose-600'
              : 'border-gray-200 text-gray-700'
          "
          @click="internalSelectedSkuId = sku.id"
        >
          {{ sku.name }}
        </button>
      </div>

      <div v-if="selectedSku" class="mt-4 rounded-lg bg-gray-50 p-3">
        <p class="text-sm text-gray-600">
          价格：{{ formatPrice(selectedSku.price) }}
        </p>
        <p class="mt-1 text-sm text-gray-600">库存：{{ selectedSku.stock }}</p>
      </div>

      <div class="mt-4 flex items-center justify-between">
        <span class="text-sm text-gray-700">数量</span>
        <VanStepper
          :model-value="quantity"
          :min="1"
          :max="Math.max(1, selectedSku?.stock ?? 1)"
          @update:model-value="updateQuantity"
        />
      </div>

      <VanButton class="mt-4" type="primary" block @click="handleConfirm">{{
        confirmText
      }}</VanButton>
      <VanButton class="mt-2" block @click="closePopup">取消</VanButton>
    </div>
  </VanPopup>
</template>

<style scoped>
button {
  transition: all 0.2s ease;
}
</style>
