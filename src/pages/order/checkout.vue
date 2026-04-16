<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import { useMutation, useQuery } from '@tanstack/vue-query';
import { showLoadingToast, showToast } from 'vant';
import { useRoute, useRouter } from 'vue-router';
import type { Address } from '@/entities/address';
import type { Coupon } from '@/entities/coupon';
import AddressSelector from '@/features/user/components/AddressSelector.vue';
import { useCoupon } from '@/features/coupon/composables/useCoupon';
import { getProductDetail } from '@/shared/api/modules/product';
import { useCartStore } from '@/stores/cart';
import { useAddressStore } from '@/stores/address';
import { useOrderStore } from '@/stores/order';
import { useUserStore } from '@/stores/user';
import type { CartItem } from '@/entities/cart';
import type { OrderAddress } from '@/entities/order';

defineOptions({
  name: 'OrderCheckoutPage',
});

interface BuyNowRouteState {
  items?: CartItem[];
}

const route = useRoute();
const router = useRouter();
const cartStore = useCartStore();
const orderStore = useOrderStore();
const addressStore = useAddressStore();
const userStore = useUserStore();
const isDesktop = useMediaQuery('(min-width: 1024px)');
const showAddressSelector = ref<boolean>(false);
const selectedAddressId = ref<string>('');
const showCouponSelector = ref<boolean>(false);
const selectedCouponId = ref<string>('');
const { getAvailableCouponsForOrder } = useCoupon();
const buyNowProductId = computed<string>(() =>
  typeof route.query.productId === 'string' ? route.query.productId : '',
);
const buyNowSkuId = computed<string>(() =>
  typeof route.query.skuId === 'string' ? route.query.skuId : '',
);
const buyNowQuantity = computed<number>(() =>
  Math.max(
    1,
    Number(
      typeof route.query.quantity === 'string' ? route.query.quantity : '1',
    ),
  ),
);

const stateItems = computed<CartItem[]>(() => {
  const historyState = (window.history.state ?? {}) as BuyNowRouteState;
  return Array.isArray(historyState.items) ? historyState.items : [];
});

const queryItems = computed<CartItem[]>(() => {
  const queryValue = Array.isArray(route.query.items)
    ? route.query.items[0]
    : route.query.items;
  if (!queryValue || typeof queryValue !== 'string') {
    return [];
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(queryValue)) as unknown;
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
});

const buyNowProductQuery = useQuery({
  queryKey: computed(() => ['checkout-product', buyNowProductId.value]),
  queryFn: () => getProductDetail(buyNowProductId.value),
  enabled: computed(() => Boolean(buyNowProductId.value && buyNowSkuId.value)),
});

const buyNowItem = computed<CartItem | null>(() => {
  const product = buyNowProductQuery.data.value;
  if (!product || !buyNowSkuId.value) {
    return null;
  }

  const sku = product.skus.find((item) => item.id === buyNowSkuId.value);
  if (!sku) {
    return null;
  }

  return {
    id: `${product.id}-${sku.id}`,
    productId: product.id,
    skuId: sku.id,
    name: `${product.name} ${sku.name}`,
    image: product.mainImage,
    price: sku.price,
    quantity: buyNowQuantity.value,
    stock: sku.stock,
  };
});

const checkoutItems = computed<CartItem[]>(() => {
  if (stateItems.value.length > 0) {
    return stateItems.value;
  }

  if (queryItems.value.length > 0) {
    return queryItems.value;
  }

  if (buyNowItem.value) {
    return [buyNowItem.value];
  }

  return cartStore.selectedItems;
});

const totalAmount = computed<number>(() =>
  checkoutItems.value.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  ),
);
const shippingFee = 0;
const hasSeckillItem = computed<boolean>(() =>
  checkoutItems.value.some((item) => Boolean(item.isSeckill)),
);
const availableCoupons = computed<Coupon[]>(() => {
  if (hasSeckillItem.value) {
    return [];
  }
  return getAvailableCouponsForOrder(checkoutItems.value, totalAmount.value);
});
const selectedCoupon = computed<Coupon | null>(
  () =>
    availableCoupons.value.find(
      (coupon) => coupon.id === selectedCouponId.value,
    ) ?? null,
);
const couponDiscount = computed<number>(
  () => selectedCoupon.value?.discount ?? 0,
);
const prePointPayableAmount = computed<number>(() =>
  Math.max(0, totalAmount.value - couponDiscount.value + shippingFee),
);
const usePointsDeduction = ref<boolean>(false);
const maxPointDeduction = computed<number>(() =>
  Math.max(0, Math.floor(prePointPayableAmount.value * 0.2)),
);
const availablePointDeduction = computed<number>(() =>
  Math.min(userStore.points, maxPointDeduction.value),
);
const pointDeductionAmount = computed<number>(() =>
  usePointsDeduction.value ? availablePointDeduction.value : 0,
);
const payableAmount = computed<number>(() =>
  Math.max(0, prePointPayableAmount.value - pointDeductionAmount.value),
);
const couponDisabledReason = computed<string>(() =>
  hasSeckillItem.value ? '秒杀商品不可叠加优惠券' : '',
);
const pointsDeductionDisabled = computed<boolean>(
  () => prePointPayableAmount.value <= 0 || availablePointDeduction.value <= 0,
);
const pointsTipText = computed<string>(
  () => `可用 ${userStore.points} 积分，可抵 ¥${availablePointDeduction.value}`,
);
const addresses = computed<Address[]>(() => addressStore.fetchAddresses());
const selectedAddress = computed<Address | null>(() => {
  if (!selectedAddressId.value) {
    return null;
  }
  return addressStore.getAddressById(selectedAddressId.value);
});
const activeAddress = computed<Address | null>(
  () => selectedAddress.value ?? addressStore.defaultAddress,
);
const fullAddress = computed<string>(() => {
  if (!activeAddress.value) {
    return '';
  }
  const { province, city, district, detail } = activeAddress.value;
  return `${province}${city}${district}${detail}`.replace(/\s+/g, '');
});

watch(
  [addresses, () => route.query.addressId],
  () => {
    const routeAddressId =
      typeof route.query.addressId === 'string' ? route.query.addressId : '';
    if (routeAddressId && addressStore.getAddressById(routeAddressId)) {
      selectedAddressId.value = routeAddressId;
      return;
    }
    if (
      selectedAddressId.value &&
      addressStore.getAddressById(selectedAddressId.value)
    ) {
      return;
    }
    selectedAddressId.value = addressStore.defaultAddress?.id ?? '';
  },
  { immediate: true },
);

watch(
  availableCoupons,
  (coupons) => {
    if (!selectedCouponId.value) {
      return;
    }
    const exists = coupons.some(
      (coupon) => coupon.id === selectedCouponId.value,
    );
    if (!exists) {
      selectedCouponId.value = '';
    }
  },
  { immediate: true },
);

watch(
  pointsDeductionDisabled,
  (disabled) => {
    if (disabled) {
      usePointsDeduction.value = false;
    }
  },
  { immediate: true },
);

const mapToOrderAddress = (address: Address): OrderAddress => ({
  receiverName: address.name,
  receiverPhone: address.phone,
  province: address.province,
  city: address.city,
  district: address.district,
  detail: address.detail,
});

const mutation = useMutation({
  mutationFn: async () => {
    let items = checkoutItems.value;

    if (items.length === 0 && buyNowProductId.value && buyNowSkuId.value) {
      const product = await getProductDetail(buyNowProductId.value);
      const sku = product.skus.find((item) => item.id === buyNowSkuId.value);
      if (!sku) {
        throw new Error('规格不存在');
      }
      items = [
        {
          id: `${product.id}-${sku.id}`,
          productId: product.id,
          skuId: sku.id,
          name: `${product.name} ${sku.name}`,
          image: product.mainImage,
          price: sku.price,
          quantity: buyNowQuantity.value,
          stock: sku.stock,
        },
      ];
    }

    if (items.length === 0) {
      throw new Error('暂无可结算商品');
    }
    if (!activeAddress.value) {
      throw new Error('请选择收货地址');
    }

    return orderStore.createOrder({
      items: items.map((item) => ({
        id: item.id,
        productId: item.productId,
        skuId: item.skuId,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
      })),
      address: mapToOrderAddress(activeAddress.value),
      couponId: selectedCoupon.value?.id,
      couponName: selectedCoupon.value?.name,
      couponDiscount: couponDiscount.value || undefined,
      pointsUsed: pointDeductionAmount.value || undefined,
      finalPaidAmount: payableAmount.value,
    });
  },
  onSuccess: () => {
    showToast('下单成功');
    void router.replace('/order/list');
  },
  onError: (error) => {
    showToast(error instanceof Error ? error.message : '下单失败，请稍后重试');
  },
});

const handleSubmit = async (): Promise<void> => {
  if (checkoutItems.value.length === 0) {
    showToast('暂无可结算商品');
    return;
  }
  if (!activeAddress.value) {
    showToast('请选择收货地址');
    return;
  }

  const toast = showLoadingToast({
    message: '提交订单中...',
    duration: 0,
    forbidClick: true,
  });

  try {
    await mutation.mutateAsync();
  } finally {
    toast.close();
  }
};

const goProducts = (): void => {
  void router.push('/products');
};

const openAddressSelector = (): void => {
  showAddressSelector.value = true;
};

const handleSelectAddress = (id: string): void => {
  selectedAddressId.value = id;
  showToast('已切换收货地址');
};

const goCreateAddress = (): void => {
  showAddressSelector.value = false;
  void router.push({
    path: '/user/address/edit',
    query: {
      redirect: '/order/checkout',
    },
  });
};

const openCouponSelector = (): void => {
  if (hasSeckillItem.value) {
    showToast('秒杀商品不可使用优惠券');
    return;
  }
  showCouponSelector.value = true;
};

const handleSelectCoupon = (id: string): void => {
  selectedCouponId.value = id;
  showCouponSelector.value = false;
  showToast('已选择优惠券');
};

const clearCoupon = (): void => {
  selectedCouponId.value = '';
};

const formatPrice = (price: number): string => `￥${price.toFixed(2)}`;
</script>

<template>
  <section class="min-h-screen bg-gray-50 pb-24">
    <template v-if="checkoutItems.length > 0">
      <template v-if="isDesktop">
        <div
          class="mx-auto grid w-full max-w-[1200px] grid-cols-12 gap-4 px-4 py-4"
        >
          <div class="col-span-8 space-y-4">
            <section class="rounded-lg border border-gray-200 bg-white p-4">
              <h2 class="text-base font-semibold text-gray-900">收货人信息</h2>
              <template v-if="activeAddress">
                <div class="mt-3 flex items-start justify-between gap-3">
                  <div>
                    <p class="text-sm font-medium text-gray-900">
                      {{ activeAddress.name }} {{ activeAddress.phone }}
                    </p>
                    <p class="mt-1 text-sm text-gray-500">{{ fullAddress }}</p>
                  </div>
                  <el-button link type="primary" @click="openAddressSelector"
                    >更换</el-button
                  >
                </div>
              </template>
              <template v-else>
                <div
                  class="mt-3 rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500"
                >
                  暂无收货地址，请先新增地址
                  <el-button link type="primary" @click="goCreateAddress"
                    >去新增</el-button
                  >
                </div>
              </template>
            </section>

            <section class="rounded-lg border border-gray-200 bg-white p-4">
              <div class="flex items-center justify-between">
                <h2 class="text-base font-semibold text-gray-900">优惠券</h2>
                <el-button
                  link
                  type="primary"
                  :disabled="hasSeckillItem"
                  @click="openCouponSelector"
                  >选择优惠券</el-button
                >
              </div>
              <p
                v-if="couponDisabledReason"
                class="mt-2 text-sm text-orange-500"
              >
                {{ couponDisabledReason }}
              </p>
              <p v-else-if="selectedCoupon" class="mt-2 text-sm text-gray-700">
                已选：{{ selectedCoupon.name }}
                <span class="ml-2 font-semibold text-rose-600"
                  >-{{ formatPrice(selectedCoupon.discount) }}</span
                >
                <el-button link type="danger" @click="clearCoupon"
                  >取消</el-button
                >
              </p>
              <p v-else class="mt-2 text-sm text-gray-500">
                可用 {{ availableCoupons.length }} 张
              </p>
            </section>

            <section class="rounded-lg border border-gray-200 bg-white p-4">
              <div class="flex items-center justify-between">
                <h2 class="text-base font-semibold text-gray-900">积分抵扣</h2>
                <el-checkbox
                  v-model="usePointsDeduction"
                  :disabled="pointsDeductionDisabled"
                  >使用积分抵扣</el-checkbox
                >
              </div>
              <p class="mt-2 text-sm text-gray-500">{{ pointsTipText }}</p>
            </section>

            <section class="rounded-lg border border-gray-200 bg-white p-4">
              <h2 class="text-base font-semibold text-gray-900">商品清单</h2>
              <el-table :data="checkoutItems" class="mt-3" size="default">
                <el-table-column label="商品信息" min-width="320">
                  <template #default="{ row }">
                    <div class="flex items-center gap-3">
                      <img
                        :src="row.image"
                        :alt="row.name"
                        class="h-14 w-14 rounded bg-gray-100 object-cover"
                      />
                      <div class="min-w-0">
                        <p class="line-clamp-2 text-sm text-gray-800">
                          {{ row.name }}
                        </p>
                        <p class="mt-1 text-xs text-gray-500">
                          {{ row.skuId }}
                        </p>
                      </div>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="单价" width="120" align="right">
                  <template #default="{ row }">
                    <span class="text-sm text-gray-700">{{
                      formatPrice(row.price)
                    }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="数量" width="100" align="center">
                  <template #default="{ row }">
                    <span class="text-sm text-gray-700">{{
                      row.quantity
                    }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="小计" width="140" align="right">
                  <template #default="{ row }">
                    <span class="text-sm font-semibold text-rose-600">{{
                      formatPrice(row.price * row.quantity)
                    }}</span>
                  </template>
                </el-table-column>
              </el-table>
              <div class="mt-4 flex justify-end border-t border-gray-100 pt-3">
                <p class="text-sm text-gray-700">
                  商品总额
                  <span class="ml-2 font-semibold text-gray-900">{{
                    formatPrice(totalAmount)
                  }}</span>
                </p>
              </div>
            </section>
          </div>

          <aside class="col-span-4">
            <section class="rounded-lg border border-gray-200 bg-white p-4">
              <div class="space-y-3 text-sm">
                <p class="flex items-center justify-between text-gray-600">
                  <span>商品总额</span>
                  <span class="text-gray-900">{{
                    formatPrice(totalAmount)
                  }}</span>
                </p>
                <p class="flex items-center justify-between text-gray-600">
                  <span>运费</span>
                  <span class="text-gray-900">{{
                    formatPrice(shippingFee)
                  }}</span>
                </p>
                <p class="flex items-center justify-between text-gray-600">
                  <span>优惠券抵扣</span>
                  <span class="text-gray-900"
                    >-{{ formatPrice(couponDiscount) }}</span
                  >
                </p>
                <p class="flex items-center justify-between text-gray-600">
                  <span>积分抵扣</span>
                  <span class="text-gray-900"
                    >-{{ formatPrice(pointDeductionAmount) }}</span
                  >
                </p>
                <p
                  class="flex items-center justify-between border-t border-gray-100 pt-3 font-semibold"
                >
                  <span class="text-gray-900">实付金额</span>
                  <span class="text-xl text-rose-600">{{
                    formatPrice(payableAmount)
                  }}</span>
                </p>
              </div>
              <el-button
                type="primary"
                class="mt-4 !h-12 w-full"
                :loading="mutation.isPending.value"
                @click="handleSubmit"
              >
                提交订单
              </el-button>
            </section>
          </aside>
        </div>
      </template>

      <template v-else>
        <div class="mx-3 mt-3 rounded-xl bg-white p-4 text-left shadow-sm">
          <template v-if="activeAddress">
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="text-sm font-medium text-gray-900">
                  {{ activeAddress.name }} {{ activeAddress.phone }}
                </p>
                <p class="mt-1 text-xs text-gray-500">{{ fullAddress }}</p>
              </div>
              <VanButton
                size="small"
                plain
                type="primary"
                @click="openAddressSelector"
                >更换</VanButton
              >
            </div>
          </template>
          <template v-else>
            <p class="text-sm text-gray-500">请添加收货地址后再提交订单</p>
            <VanButton
              class="mt-2"
              size="small"
              type="primary"
              @click="goCreateAddress"
              >新增地址</VanButton
            >
          </template>
        </div>

        <div class="mx-3 mt-3 rounded-xl bg-white p-4 shadow-sm">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-700">优惠券</span>
            <button
              type="button"
              class="text-blue-600 disabled:text-gray-400"
              :disabled="hasSeckillItem"
              @click="openCouponSelector"
            >
              {{
                selectedCoupon
                  ? '已选优惠券'
                  : `可用${availableCoupons.length}张`
              }}
            </button>
          </div>
          <p v-if="couponDisabledReason" class="mt-2 text-xs text-orange-500">
            {{ couponDisabledReason }}
          </p>
          <p v-else-if="selectedCoupon" class="mt-2 text-xs text-gray-500">
            {{ selectedCoupon.name }} -{{
              formatPrice(selectedCoupon.discount)
            }}
          </p>
        </div>

        <div class="mx-3 mt-3 rounded-xl bg-white p-4 shadow-sm">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-700">积分抵扣</span>
            <VanSwitch
              v-model="usePointsDeduction"
              size="20"
              :disabled="pointsDeductionDisabled"
            />
          </div>
          <p class="mt-2 text-xs text-gray-500">{{ pointsTipText }}</p>
        </div>

        <div class="mx-3 mt-3 rounded-xl bg-white p-4 shadow-sm">
          <h2 class="text-sm font-semibold text-gray-900">商品清单</h2>
          <div
            v-for="item in checkoutItems"
            :key="item.id"
            class="mt-3 flex items-center gap-3"
          >
            <img
              :src="item.image"
              :alt="item.name"
              class="h-16 w-16 rounded-md bg-gray-100 object-cover"
            />
            <div class="min-w-0 flex-1">
              <p class="line-clamp-2 text-sm text-gray-800">{{ item.name }}</p>
              <p class="mt-1 text-xs text-gray-500">x{{ item.quantity }}</p>
            </div>
            <p class="text-sm font-semibold text-rose-600">
              {{ formatPrice(item.price * item.quantity) }}
            </p>
          </div>
        </div>

        <div class="mx-3 mt-3 rounded-xl bg-white p-4 shadow-sm">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-500">商品总额</span>
            <span class="text-gray-900">{{ formatPrice(totalAmount) }}</span>
          </div>
          <div class="mt-2 flex items-center justify-between text-sm">
            <span class="text-gray-500">运费</span>
            <span class="text-gray-900">{{ formatPrice(shippingFee) }}</span>
          </div>
          <div class="mt-2 flex items-center justify-between text-sm">
            <span class="text-gray-500">优惠券抵扣</span>
            <span class="text-gray-900"
              >-{{ formatPrice(couponDiscount) }}</span
            >
          </div>
          <div class="mt-2 flex items-center justify-between text-sm">
            <span class="text-gray-500">积分抵扣</span>
            <span class="text-gray-900"
              >-{{ formatPrice(pointDeductionAmount) }}</span
            >
          </div>
          <div
            class="mt-3 flex items-center justify-between border-t border-gray-100 pt-3"
          >
            <span class="text-sm font-medium text-gray-900">实付金额</span>
            <span class="text-lg font-bold text-rose-600">{{
              formatPrice(payableAmount)
            }}</span>
          </div>
        </div>

        <div
          class="checkout-submit-bar fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-4 py-3"
        >
          <div class="mx-auto w-full max-w-[450px]">
            <VanButton
              type="danger"
              block
              :loading="mutation.isPending.value"
              @click="handleSubmit"
              >提交订单</VanButton
            >
          </div>
        </div>
      </template>
    </template>

    <div v-else class="flex min-h-screen items-center justify-center px-4">
      <VanEmpty description="暂无可结算商品">
        <VanButton round type="primary" @click="goProducts">去逛逛</VanButton>
      </VanEmpty>
    </div>

    <AddressSelector
      v-model="showAddressSelector"
      :addresses="addresses"
      :selected-id="activeAddress?.id"
      @select="handleSelectAddress"
      @add="goCreateAddress"
    />

    <el-dialog
      v-if="isDesktop"
      v-model="showCouponSelector"
      title="选择优惠券"
      width="620px"
    >
      <div v-if="availableCoupons.length > 0" class="space-y-3">
        <button
          v-for="coupon in availableCoupons"
          :key="coupon.id"
          type="button"
          class="w-full rounded-lg border border-gray-200 p-3 text-left hover:border-blue-300"
          @click="handleSelectCoupon(coupon.id)"
        >
          <p class="text-sm font-semibold text-gray-900">{{ coupon.name }}</p>
          <p class="mt-1 text-xs text-gray-500">
            满{{ coupon.threshold }}减{{ coupon.discount }}
          </p>
        </button>
      </div>
      <el-empty v-else description="暂无可用优惠券" />
    </el-dialog>

    <VanPopup
      v-else
      v-model:show="showCouponSelector"
      position="bottom"
      round
      :style="{ height: '60%' }"
    >
      <div class="p-4">
        <h3 class="text-center text-base font-semibold text-gray-900">
          选择优惠券
        </h3>
        <div v-if="availableCoupons.length > 0" class="mt-4 space-y-3">
          <button
            v-for="coupon in availableCoupons"
            :key="coupon.id"
            type="button"
            class="w-full rounded-lg border border-gray-200 p-3 text-left"
            @click="handleSelectCoupon(coupon.id)"
          >
            <p class="text-sm font-semibold text-gray-900">{{ coupon.name }}</p>
            <p class="mt-1 text-xs text-gray-500">
              满{{ coupon.threshold }}减{{ coupon.discount }}
            </p>
          </button>
        </div>
        <VanEmpty v-else description="暂无可用优惠券" />
      </div>
    </VanPopup>
  </section>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.checkout-submit-bar {
  bottom: calc(56px + env(safe-area-inset-bottom));
}
</style>
