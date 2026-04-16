<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import { useQuery } from '@tanstack/vue-query';
import { showToast } from 'vant';
import { useRoute, useRouter } from 'vue-router';
import QuickEntryGrid from '@/features/home/components/QuickEntryGrid.vue';
import RedPacketPanel from '@/features/home/components/RedPacketPanel.vue';
import SignInPanel from '@/features/home/components/SignInPanel.vue';
import ProductFilter, {
  type ProductFilters,
} from '@/features/product/components/ProductFilter.vue';
import CouponPage from '@/pages/coupon/index.vue';
import SeckillPage from '@/pages/seckill/index.vue';
import { useProductList } from '@/features/product/composables/useProductList';
import { getProductListPage } from '@/shared/api/modules/product';
import ProductCard from '@/shared/components/ProductCard.vue';
import ProductCardPc from '@/shared/components/ProductCardPc.vue';
import { mockProducts } from '@/shared/data/products.mock';
import { useCartStore } from '@/stores/cart';
import type { ProductCategory } from '@/entities/product';

defineOptions({
  name: 'ProductsPage',
});

const router = useRouter();
const route = useRoute();
const cartStore = useCartStore();
const isDesktop = useMediaQuery('(min-width: 1024px)');
const keyword = ref<string>('');
const sortType = ref<'default' | 'sales' | 'price' | 'newest'>('default');
const pcPage = ref<number>(1);
const pageSize = 12;
const categoryTab = ref<'all' | ProductCategory>('all');
const showFeaturePopup = ref<boolean>(false);
const mobileFeature = ref<'signin' | 'redpacket'>('signin');

type ProductFeature = 'default' | 'seckill' | 'coupon' | 'signin' | 'redpacket';

const activeFeature = computed<ProductFeature>(() => {
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

const createDefaultFilters = (maxPrice = 6000): ProductFilters => ({
  category: undefined,
  minPrice: 0,
  maxPrice,
  brands: [],
  tags: [],
});

const draftFilters = reactive<ProductFilters>(createDefaultFilters());
const appliedFilters = reactive<ProductFilters>(createDefaultFilters());

const categoryTabs: Array<{ label: string; value: 'all' | ProductCategory }> = [
  { label: '全部', value: 'all' },
  { label: '数码家电', value: 'digital' },
  { label: '服饰鞋包', value: 'fashion' },
  { label: '食品生鲜', value: 'food' },
  { label: '家居百货', value: 'home' },
];

const params = computed(() => ({
  keyword: keyword.value.trim() || undefined,
  category: appliedFilters.category,
  minPrice: appliedFilters.minPrice,
  maxPrice: appliedFilters.maxPrice,
  brands: appliedFilters.brands,
  tags: appliedFilters.tags,
}));

const desktopFilterBase = computed(() => ({
  keyword: keyword.value.trim() || undefined,
  category: draftFilters.category,
}));

const {
  products,
  isRefreshing,
  isLoading,
  isError,
  errorMessage,
  loadingMore,
  finished,
  refresh,
  loadMore,
} = useProductList(params);

const pcQuery = useQuery({
  queryKey: computed(() => [
    'products-pc',
    keyword.value.trim(),
    appliedFilters.category,
    appliedFilters.minPrice,
    appliedFilters.maxPrice,
    appliedFilters.brands.join(','),
    appliedFilters.tags.join(','),
    pcPage.value,
    pageSize,
  ]),
  queryFn: () =>
    getProductListPage({
      keyword: keyword.value.trim() || undefined,
      category: appliedFilters.category,
      minPrice: appliedFilters.minPrice,
      maxPrice: appliedFilters.maxPrice,
      brands: appliedFilters.brands,
      tags: appliedFilters.tags,
      page: pcPage.value,
      size: pageSize,
    }),
  enabled: computed(() => isDesktop.value),
});

const pcMetaQuery = useQuery({
  queryKey: computed(() => ['products-pc-meta', desktopFilterBase.value]),
  queryFn: () =>
    getProductListPage({
      ...desktopFilterBase.value,
      page: 1,
      size: 200,
    }),
  enabled: computed(() => isDesktop.value),
});

const openProductDetail = (productId: string): void => {
  void router.push(`/product/${productId}`);
};

const openSearchPage = (): void => {
  const trimmed = keyword.value.trim();
  void router.push({
    path: '/search',
    query: trimmed ? { keyword: trimmed } : undefined,
  });
};

const handleRefresh = async (): Promise<void> => {
  await refresh();
};

const handleLoadMore = async (): Promise<void> => {
  await loadMore();
};

const addToCartFromList = (product: (typeof products.value)[number]): void => {
  const defaultSku = product.skus[0];
  if (!defaultSku) {
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
  showToast('已加入购物车');
};

const sortedProducts = computed(() => {
  const source = isDesktop.value
    ? (pcQuery.data.value?.list ?? [])
    : products.value;
  const list = [...source];
  if (sortType.value === 'price') {
    return list.sort((a, b) => a.price - b.price);
  }
  if (sortType.value === 'sales') {
    return list.sort((a, b) => b.sales - a.sales);
  }
  if (sortType.value === 'newest') {
    return list.reverse();
  }
  return list;
});

const pagedProducts = computed(() => sortedProducts.value);
const pcTotal = computed<number>(() => pcQuery.data.value?.total ?? 0);
const availableBrands = computed<string[]>(() => {
  const source = pcMetaQuery.data.value?.list ?? [];
  return Array.from(new Set(source.map((item) => item.brand)));
});
const maxPriceLimit = computed<number>(() => {
  const source = pcMetaQuery.data.value?.list ?? mockProducts;
  const maxPrice = source.reduce((max, item) => Math.max(max, item.price), 0);
  return Math.max(100, Math.ceil(maxPrice / 100) * 100);
});

const handlePcPageChange = (nextPage: number): void => {
  pcPage.value = nextPage;
};

const copyFilters = (target: ProductFilters, source: ProductFilters): void => {
  target.category = source.category;
  target.minPrice = source.minPrice;
  target.maxPrice = source.maxPrice;
  target.brands = [...source.brands];
  target.tags = [...source.tags];
};

const getAvailableBrandsByCategory = (category?: ProductCategory): string[] => {
  const source = category
    ? mockProducts.filter((item) => item.category === category)
    : mockProducts;
  return Array.from(new Set(source.map((item) => item.brand)));
};

const getPriceRangeByCategory = (
  category?: ProductCategory,
): [number, number] => {
  const source = category
    ? mockProducts.filter((item) => item.category === category)
    : mockProducts;
  if (source.length === 0) {
    return [0, 100];
  }
  const prices = source.map((item) => item.price);
  return [Math.min(...prices), Math.max(...prices)];
};

const normalizeDraftFilters = (next: ProductFilters): ProductFilters => {
  const brandsOfCategory = getAvailableBrandsByCategory(next.category);
  const [rangeMin, rangeMax] = getPriceRangeByCategory(next.category);
  const min = Math.max(0, next.minPrice, rangeMin);
  const max = Math.min(rangeMax, Math.max(min, next.maxPrice));
  return {
    category: next.category,
    minPrice: min,
    maxPrice: max,
    brands: next.brands.filter((brand) => brandsOfCategory.includes(brand)),
    tags: [...next.tags],
  };
};

const updateDraftFilters = (next: ProductFilters): void => {
  const normalized = normalizeDraftFilters(next);
  copyFilters(draftFilters, normalized);
  pcPage.value = 1;
};

const applyFilter = (): void => {
  const normalized = normalizeDraftFilters(draftFilters);
  copyFilters(draftFilters, normalized);
  copyFilters(appliedFilters, normalized);
  pcPage.value = 1;
};

const resetFilter = (): void => {
  const defaults = createDefaultFilters(maxPriceLimit.value);
  copyFilters(draftFilters, defaults);
  copyFilters(appliedFilters, defaults);
  categoryTab.value = 'all';
  pcPage.value = 1;
};

const changeMobileCategory = (nextCategory: 'all' | ProductCategory): void => {
  categoryTab.value = nextCategory;
  const nextDraft: ProductFilters = {
    ...draftFilters,
    category: nextCategory === 'all' ? undefined : nextCategory,
  };
  updateDraftFilters(nextDraft);
  copyFilters(appliedFilters, draftFilters);
};

const openSignInPopup = (): void => {
  mobileFeature.value = 'signin';
  showFeaturePopup.value = true;
};

const openRedPacketPopup = (): void => {
  mobileFeature.value = 'redpacket';
  showFeaturePopup.value = true;
};

const mobileFeatureTitle = computed<string>(() =>
  mobileFeature.value === 'signin' ? '签到' : '领红包',
);
</script>

<template>
  <section class="min-h-screen bg-gray-50">
    <template v-if="isDesktop">
      <template v-if="activeFeature === 'default'">
        <div class="grid grid-cols-12 gap-6">
          <div class="col-span-3">
            <ProductFilter
              :model-value="draftFilters"
              :available-brands="availableBrands"
              :max-price-limit="maxPriceLimit"
              @update:model-value="updateDraftFilters"
              @apply="applyFilter"
              @reset="resetFilter"
            />
          </div>
          <div class="col-span-9 space-y-4">
            <div class="rounded-xl bg-white p-4 shadow-sm">
              <div class="flex items-center justify-between">
                <el-radio-group v-model="sortType" size="large">
                  <el-radio-button value="default">综合</el-radio-button>
                  <el-radio-button value="sales">销量</el-radio-button>
                  <el-radio-button value="price">价格</el-radio-button>
                  <el-radio-button value="newest">新品</el-radio-button>
                </el-radio-group>
                <el-input
                  v-model="keyword"
                  class="!w-72"
                  placeholder="搜索商品关键词"
                  clearable
                  @keyup.enter="openSearchPage"
                >
                  <template #append>
                    <el-button @click="openSearchPage">搜索</el-button>
                  </template>
                </el-input>
              </div>
              <p class="mt-3 text-sm text-gray-500">共 {{ pcTotal }} 件商品</p>
            </div>

            <el-row :gutter="16">
              <el-col
                v-for="product in pagedProducts"
                :key="product.id"
                :lg="8"
                :md="12"
                :sm="12"
              >
                <ProductCardPc
                  :product="product"
                  @click="openProductDetail(product.id)"
                  @add-to-cart="addToCartFromList(product)"
                />
              </el-col>
            </el-row>

            <div class="flex justify-end rounded-xl bg-white p-4 shadow-sm">
              <el-pagination
                background
                layout="prev, pager, next"
                :page-size="pageSize"
                :total="pcTotal"
                :current-page="pcPage"
                @current-change="handlePcPageChange"
              />
            </div>
          </div>
        </div>
      </template>
      <template v-else-if="activeFeature === 'seckill'">
        <SeckillPage />
      </template>
      <template v-else-if="activeFeature === 'coupon'">
        <CouponPage />
      </template>
      <template v-else-if="activeFeature === 'signin'">
        <SignInPanel is-desktop />
      </template>
      <template v-else-if="activeFeature === 'redpacket'">
        <RedPacketPanel is-desktop />
      </template>
    </template>

    <template v-else>
      <header class="sticky top-0 z-10 bg-white px-4 py-3 shadow-sm">
        <VanSearch
          v-model="keyword"
          shape="round"
          placeholder="搜索商品"
          readonly
          @click="openSearchPage"
        />
        <div class="mt-3">
          <QuickEntryGrid
            @signin="openSignInPopup"
            @redpacket="openRedPacketPopup"
          />
        </div>
        <div class="mt-3">
          <VanTabs :active="categoryTab" shrink @change="changeMobileCategory">
            <VanTab
              v-for="tab in categoryTabs"
              :key="tab.value"
              :name="tab.value"
              :title="tab.label"
            />
          </VanTabs>
        </div>
      </header>

      <VanPullRefresh :model-value="isRefreshing" @refresh="handleRefresh">
        <VanList
          class="px-3 pb-4 pt-3"
          :loading="loadingMore"
          :finished="finished"
          finished-text="没有更多商品了"
          @load="handleLoadMore"
        >
          <div class="space-y-3">
            <ProductCard
              v-for="product in products"
              :key="product.id"
              :product="product"
              @click="openProductDetail(product.id)"
            />
          </div>
        </VanList>

        <div
          v-if="isLoading"
          class="px-4 py-6 text-center text-sm text-gray-500"
        >
          商品加载中...
        </div>
        <div
          v-else-if="isError"
          class="px-4 py-6 text-center text-sm text-red-500"
        >
          {{ errorMessage || '加载失败，请下拉重试。' }}
        </div>
        <div
          v-else-if="products.length === 0"
          class="px-4 py-6 text-center text-sm text-gray-500"
        >
          暂无商品
        </div>
      </VanPullRefresh>

      <VanPopup
        v-model:show="showFeaturePopup"
        position="bottom"
        round
        :style="{ height: '76%' }"
      >
        <div class="p-4">
          <div class="mb-3 flex items-center justify-between">
            <h3 class="text-base font-semibold text-gray-900">
              {{ mobileFeatureTitle }}
            </h3>
            <button
              type="button"
              class="text-xs text-gray-500"
              @click="showFeaturePopup = false"
            >
              关闭
            </button>
          </div>
          <SignInPanel v-if="mobileFeature === 'signin'" />
          <RedPacketPanel v-else />
        </div>
      </VanPopup>
    </template>
  </section>
</template>
