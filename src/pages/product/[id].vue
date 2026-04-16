<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import { useQuery } from '@tanstack/vue-query';
import { showToast } from 'vant';
import { useRoute, useRouter } from 'vue-router';
import ProductSkuSelector from '@/features/product/components/ProductSkuSelector.vue';
import { getProductDetail } from '@/shared/api/modules/product';
import { useCartStore } from '@/stores/cart';
import type { ProductSku } from '@/entities/product';

defineOptions({
  name: 'ProductDetailPage',
});

const route = useRoute();
const router = useRouter();
const cartStore = useCartStore();
const isDesktop = useMediaQuery('(min-width: 1024px)');

const productId = computed<string>(() => String(route.params.id ?? ''));
const selectorVisible = ref<boolean>(false);
const selectedSkuId = ref<string>('');
const selectorAction = ref<'cart' | 'buy'>('cart');

const {
  data: product,
  isPending,
  isError,
  error,
} = useQuery({
  queryKey: computed(() => ['product', productId.value]),
  queryFn: () => getProductDetail(productId.value),
  enabled: computed(() => Boolean(productId.value)),
});

watch(
  () => product.value?.skus,
  (skus) => {
    if (!skus || skus.length === 0) {
      selectedSkuId.value = '';
      return;
    }

    if (!selectedSkuId.value) {
      const firstAvailableSku = skus.find((sku) => sku.stock > 0) ?? skus[0];
      selectedSkuId.value = firstAvailableSku.id;
    }
  },
  { immediate: true },
);

const selectedSku = computed<ProductSku | null>(() => {
  const currentProduct = product.value;
  if (!currentProduct) {
    return null;
  }

  return (
    currentProduct.skus.find((sku) => sku.id === selectedSkuId.value) ??
    currentProduct.skus[0] ??
    null
  );
});

const currentPrice = computed<number>(
  () => selectedSku.value?.price ?? product.value?.price ?? 0,
);
const currentStock = computed<number>(
  () => selectedSku.value?.stock ?? product.value?.stock ?? 0,
);
const currentImages = computed<string[]>(() => {
  const currentProduct = product.value;
  if (!currentProduct) {
    return [];
  }
  if (
    Array.isArray(currentProduct.images) &&
    currentProduct.images.length > 0
  ) {
    return [...currentProduct.images];
  }
  return currentProduct.mainImage ? [currentProduct.mainImage] : [];
});
const hasMultipleImages = computed<boolean>(
  () => currentImages.value.length > 1,
);
const detailTab = ref<string>('detail');
const activePreviewImage = ref<string>('');
const showStickyBar = ref<boolean>(false);

const formatPrice = (price: number): string => `¥${price.toFixed(2)}`;

const openSelector = (action: 'cart' | 'buy'): void => {
  selectorAction.value = action;
  if (product.value?.skus && !selectedSkuId.value) {
    const firstAvailableSku =
      product.value.skus.find((sku) => sku.stock > 0) ?? product.value.skus[0];
    if (firstAvailableSku) {
      selectedSkuId.value = firstAvailableSku.id;
    }
  }
  selectorVisible.value = true;
};

watch(
  currentImages,
  (images) => {
    activePreviewImage.value = images[0] ?? '';
  },
  { immediate: true },
);

if (typeof window !== 'undefined') {
  window.addEventListener('scroll', () => {
    showStickyBar.value = window.scrollY > 240;
  });
}

const handleSkuConfirm = (payload: {
  sku: ProductSku;
  quantity: number;
}): void => {
  if (!product.value) {
    return;
  }

  selectedSkuId.value = payload.sku.id;

  cartStore.addItem({
    id: `${product.value.id}-${payload.sku.id}`,
    productId: product.value.id,
    skuId: payload.sku.id,
    name: `${product.value.name} ${payload.sku.name}`,
    image: product.value.mainImage,
    price: payload.sku.price,
    quantity: payload.quantity,
    stock: payload.sku.stock,
  });
};

const addToCart = (): void => {
  openSelector('cart');
};

const buyNow = (): void => {
  openSelector('buy');
};

const goCart = (): void => {
  void router.push('/cart');
};
</script>

<template>
  <section class="min-h-screen bg-gray-50 pb-20">
    <div v-if="isPending" class="p-6 text-center text-sm text-gray-500">
      商品详情加载中...
    </div>
    <div v-else-if="isError" class="p-6 text-center text-sm text-red-500">
      {{ error?.message || '加载失败，请稍后重试' }}
    </div>
    <template v-else-if="product && isDesktop">
      <div
        v-show="showStickyBar"
        class="sticky top-0 z-30 mb-4 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow"
      >
        <div>
          <p class="text-sm text-gray-500">{{ product.name }}</p>
          <p class="text-base font-bold text-rose-600">
            {{ formatPrice(currentPrice) }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <el-button type="warning" @click="addToCart">加入购物车</el-button>
          <el-button type="danger" @click="buyNow">立即购买</el-button>
        </div>
      </div>

      <div class="grid grid-cols-5 gap-6 rounded-xl bg-white p-6 shadow-sm">
        <div class="col-span-2">
          <el-image
            :src="activePreviewImage || product.mainImage"
            fit="cover"
            class="h-[420px] w-full rounded-lg"
            :preview-src-list="currentImages"
          />
          <div v-if="hasMultipleImages" class="mt-3 grid grid-cols-4 gap-2">
            <button
              v-for="image in currentImages"
              :key="image"
              type="button"
              class="overflow-hidden rounded border"
              @click="activePreviewImage = image"
            >
              <img :src="image" alt="thumb" class="h-16 w-full object-cover" />
            </button>
          </div>
        </div>

        <div class="col-span-3 space-y-5">
          <h1 class="text-2xl font-semibold text-gray-900">
            {{ product.name }}
          </h1>
          <p class="text-3xl font-bold text-rose-600">
            {{ formatPrice(currentPrice) }}
          </p>
          <p class="text-sm text-gray-500">库存：{{ currentStock }}</p>

          <div class="space-y-3">
            <p class="text-sm text-gray-600">规格选择</p>
            <div class="flex flex-wrap gap-2">
              <el-button
                v-for="sku in product.skus"
                :key="sku.id"
                :type="sku.id === selectedSkuId ? 'danger' : 'default'"
                @click="selectedSkuId = sku.id"
              >
                {{ sku.name }}
              </el-button>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <el-button type="warning" size="large" @click="addToCart"
              >加入购物车</el-button
            >
            <el-button type="danger" size="large" @click="buyNow"
              >立即购买</el-button
            >
          </div>
        </div>
      </div>

      <div class="mt-4 rounded-xl bg-white p-6 shadow-sm">
        <el-tabs v-model="detailTab">
          <el-tab-pane label="商品详情" name="detail">
            <p class="text-sm leading-7 text-gray-700">{{ product.desc }}</p>
          </el-tab-pane>
          <el-tab-pane label="规格参数" name="spec">
            <p class="text-sm text-gray-600">
              重量：1kg / 产地：上海 / 保质期：24 个月（示例）
            </p>
          </el-tab-pane>
          <el-tab-pane label="用户评价" name="review">
            <p class="text-sm text-gray-600">
              综合评分 4.9 分，累计 {{ product.stock * 13 }} 条评价。
            </p>
          </el-tab-pane>
        </el-tabs>
      </div>
    </template>

    <template v-else-if="product">
      <div class="md:flex md:gap-4 md:px-4 md:pt-4">
        <div class="md:w-2/5">
          <VanSwipe
            class="h-72 bg-white md:h-80 md:rounded-xl"
            indicator-color="white"
            :show-indicators="hasMultipleImages"
            :loop="hasMultipleImages"
          >
            <VanSwipeItem v-for="image in currentImages" :key="image">
              <img
                :src="image"
                alt="product image"
                class="h-72 w-full object-cover md:h-80 md:rounded-xl"
              />
            </VanSwipeItem>
          </VanSwipe>
        </div>

        <div class="md:w-3/5">
          <div class="mt-3 bg-white p-4 md:mt-0 md:rounded-xl">
            <h1 class="text-base font-semibold text-gray-900 md:text-lg">
              {{ product.name }}
            </h1>
            <p class="mt-2 text-lg font-bold text-rose-600 md:text-xl">
              {{ formatPrice(currentPrice) }}
            </p>
            <p class="mt-1 text-xs text-gray-500 md:text-sm">
              库存：{{ currentStock }}
            </p>
          </div>

          <div class="mt-3 bg-white p-4 md:rounded-xl">
            <p class="text-sm text-gray-800 md:text-base">
              已选：{{ selectedSku?.name || '暂无可用规格' }}
            </p>
            <p class="mt-1 text-xs text-gray-500 md:text-sm">
              请通过底部按钮发起购买或加购
            </p>
          </div>
        </div>
      </div>

      <div class="mt-3 bg-white p-4 md:mx-4 md:rounded-xl">
        <h2 class="text-sm font-semibold text-gray-900 md:text-base">
          商品介绍
        </h2>
        <p class="mt-2 text-sm leading-6 text-gray-600 md:text-base">
          {{ product.desc }}
        </p>
      </div>
    </template>

    <VanActionBar v-if="!isDesktop" class="detail-action-bar">
      <VanActionBarIcon
        icon="cart-o"
        text="购物车"
        :badge="cartStore.totalCount"
        @click="goCart"
      />
      <VanActionBarButton type="warning" text="加入购物车" @click="addToCart" />
      <VanActionBarButton type="danger" text="立即购买" @click="buyNow" />
    </VanActionBar>

    <ProductSkuSelector
      v-model:show="selectorVisible"
      :product="product ?? null"
      :selected-sku-id="selectedSkuId"
      :action-type="selectorAction"
      @update:selected-sku-id="selectedSkuId = $event"
      @confirm="
        ({ sku, quantity }) => {
          if (selectorAction === 'cart') {
            handleSkuConfirm({ sku, quantity });
            showToast('已加入购物车');
            return;
          }
          if (!product) {
            showToast('商品信息异常，请稍后重试');
            return;
          }
          void router.push({
            path: '/order/checkout',
            query: {
              productId: product.id,
              skuId: sku.id,
              quantity: String(quantity),
            },
          });
        }
      "
    />
  </section>
</template>

<style scoped>
@media (min-width: 768px) {
  :deep(.detail-action-bar.van-action-bar) {
    left: 50%;
    width: 100%;
    max-width: 450px;
    transform: translateX(-50%);
  }
}
</style>
