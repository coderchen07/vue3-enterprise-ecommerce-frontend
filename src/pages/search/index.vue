<script setup lang="ts">
import { computed } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import { useRoute, useRouter } from 'vue-router';
import { useProductSearch } from '@/features/product/composables/useProductSearch';
import ProductCard from '@/shared/components/ProductCard.vue';
import ProductCardPc from '@/shared/components/ProductCardPc.vue';
import { useCartStore } from '@/stores/cart';

defineOptions({
  name: 'SearchPage',
});

const route = useRoute();
const router = useRouter();
const cartStore = useCartStore();
const isDesktop = useMediaQuery('(min-width: 1024px)');

const initialKeyword = computed<string>(() => {
  const queryKeyword = route.query.keyword;
  if (Array.isArray(queryKeyword)) {
    return queryKeyword[0] ?? '';
  }
  return typeof queryKeyword === 'string' ? queryKeyword : '';
});

const {
  data,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  keyword,
  search,
} = useProductSearch(initialKeyword.value);

const finished = computed<boolean>(() => !hasNextPage.value);
const showEmpty = computed<boolean>(
  () =>
    keyword.value.trim().length > 0 &&
    !isLoading.value &&
    data.value.length === 0,
);

const handleSearch = (): void => {
  search(keyword.value);
};

const handleLoadMore = async (): Promise<void> => {
  await fetchNextPage();
};

const openProductDetail = (productId: string): void => {
  void router.push(`/product/${productId}`);
};

const addToCartFromSearch = (productId: string): void => {
  const product = data.value.find((item) => item.id === productId);
  const defaultSku = product?.skus[0];
  if (!product || !defaultSku) {
    return;
  }
  cartStore.addItem({
    id: `${product.id}-${defaultSku.id}`,
    productId: product.id,
    skuId: defaultSku.id,
    name: `${product.name} ${defaultSku.name}`,
    image: product.mainImage,
    price: defaultSku.price,
    quantity: 1,
    stock: defaultSku.stock,
  });
};
</script>

<template>
  <section class="min-h-screen bg-gray-50">
    <header class="sticky top-0 z-10 bg-white px-4 py-3 shadow-sm md:px-5">
      <VanSearch
        v-model="keyword"
        shape="round"
        show-action
        autofocus
        placeholder="请输入商品关键词"
        @search="handleSearch"
      >
        <template #action>
          <button
            type="button"
            class="text-sm text-blue-500"
            @click="handleSearch"
          >
            搜索
          </button>
        </template>
      </VanSearch>
    </header>

    <VanList
      class="px-3 pb-4 pt-3 md:px-5 md:pt-4"
      :loading="isFetchingNextPage"
      :finished="finished"
      finished-text="没有更多搜索结果了"
      @load="handleLoadMore"
    >
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <template v-if="isDesktop">
          <ProductCardPc
            v-for="product in data"
            :key="product.id"
            :product="product"
            @click="openProductDetail(product.id)"
            @add-to-cart="addToCartFromSearch(product.id)"
          />
        </template>
        <template v-else>
          <ProductCard
            v-for="product in data"
            :key="product.id"
            :product="product"
            @click="openProductDetail(product.id)"
          />
        </template>
      </div>
    </VanList>

    <div v-if="isLoading" class="px-4 py-6 text-center text-sm text-gray-500">
      搜索中...
    </div>
    <div v-else-if="showEmpty" class="px-4 py-10">
      <VanEmpty description="未找到相关商品" />
    </div>
  </section>
</template>
