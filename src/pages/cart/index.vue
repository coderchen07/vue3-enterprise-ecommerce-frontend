<script setup lang="ts">
import { computed } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import type { CheckboxValueType } from 'element-plus';
import { useRouter } from 'vue-router';
import { useCartStore } from '@/stores/cart';

defineOptions({
  name: 'CartPage',
});

const router = useRouter();
const cartStore = useCartStore();
const isDesktop = useMediaQuery('(min-width: 1024px)');

const allSelected = computed<boolean>({
  get: () =>
    cartStore.items.length > 0 &&
    cartStore.items.every((item) => item.selected),
  set: (value) => {
    cartStore.items.forEach((item) => {
      if (item.selected !== value) {
        cartStore.toggleSelection(item.id);
      }
    });
  },
});

const formatPrice = (price: number): string => `￥${price.toFixed(2)}`;

const toBooleanChecked = (value: CheckboxValueType): boolean => value === true;

const updateItemChecked = (
  itemId: string,
  checked: CheckboxValueType,
): void => {
  const normalizedChecked = toBooleanChecked(checked);
  const target = cartStore.items.find((item) => item.id === itemId);
  if (!target || target.selected === normalizedChecked) {
    return;
  }
  cartStore.toggleSelection(itemId);
};

const updateItemQuantity = (itemId: string, value: string | number): void => {
  const quantity = typeof value === 'number' ? value : Number(value);
  cartStore.updateQuantity(itemId, quantity);
};

const removeItem = (itemId: string): void => {
  cartStore.removeItem(itemId);
};

const desktopRows = computed(() => cartStore.items);

const toggleAllDesktop = (value: CheckboxValueType): void => {
  const normalizedChecked = toBooleanChecked(value);
  cartStore.items.forEach((item) => {
    if (item.selected !== normalizedChecked) {
      cartStore.toggleSelection(item.id);
    }
  });
};

const removeSelectedDesktop = (): void => {
  const selected = cartStore.items
    .filter((item) => item.selected)
    .map((item) => item.id);
  selected.forEach((id) => cartStore.removeItem(id));
};

const goProducts = (): void => {
  void router.push('/products');
};

const goCheckout = (): void => {
  if (cartStore.selectedItems.length === 0) {
    return;
  }

  const selectedItemsPayload = encodeURIComponent(
    JSON.stringify(cartStore.selectedItems),
  );
  void router.push({
    path: '/order/checkout',
    query: {
      items: selectedItemsPayload,
    },
  });
};
</script>

<template>
  <section class="min-h-screen bg-gray-50 pb-40 md:pb-44">
    <template v-if="isDesktop && cartStore.items.length > 0">
      <div class="grid grid-cols-12 gap-6">
        <div class="col-span-8 space-y-4">
          <div class="rounded-xl bg-white p-4 shadow-sm">
            <div class="flex items-center justify-between">
              <el-checkbox
                :model-value="allSelected"
                @update:model-value="toggleAllDesktop"
                >全选</el-checkbox
              >
              <el-button type="danger" plain @click="removeSelectedDesktop"
                >删除选中</el-button
              >
            </div>
          </div>
          <el-table :data="desktopRows" row-key="id" class="rounded-xl">
            <el-table-column label="选择" width="80">
              <template #default="{ row }">
                <el-checkbox
                  :model-value="row.selected"
                  @update:model-value="updateItemChecked(row.id, $event)"
                />
              </template>
            </el-table-column>
            <el-table-column label="商品">
              <template #default="{ row }">
                <div class="flex items-center gap-3">
                  <img
                    :src="row.image"
                    :alt="row.name"
                    class="h-14 w-14 rounded object-cover"
                  />
                  <div>
                    <p class="text-sm text-gray-800">{{ row.name }}</p>
                    <p v-if="row.isSeckill" class="mt-1 text-xs text-rose-500">
                      秒杀价商品
                    </p>
                    <p class="text-xs text-gray-500">库存 {{ row.stock }}</p>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="单价" width="120">
              <template #default="{ row }">
                <span class="text-rose-600">{{ formatPrice(row.price) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="数量" width="150">
              <template #default="{ row }">
                <el-input-number
                  :model-value="row.quantity"
                  :min="1"
                  :max="row.stock"
                  size="small"
                  @update:model-value="updateItemQuantity(row.id, $event || 1)"
                />
              </template>
            </el-table-column>
            <el-table-column label="小计" width="140">
              <template #default="{ row }">
                <span class="font-semibold text-rose-600">{{
                  formatPrice(row.price * row.quantity)
                }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="110">
              <template #default="{ row }">
                <el-button link type="danger" @click="removeItem(row.id)"
                  >删除</el-button
                >
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="col-span-4">
          <div class="sticky top-6 rounded-xl bg-white p-5 shadow-sm">
            <h3 class="text-base font-semibold text-gray-900">订单摘要</h3>
            <div class="mt-4 space-y-2 text-sm text-gray-600">
              <p class="flex justify-between">
                <span>商品总额</span
                ><span>{{ formatPrice(cartStore.selectedTotalPrice) }}</span>
              </p>
              <p class="flex justify-between">
                <span>运费</span><span>￥0.00</span>
              </p>
              <p class="flex justify-between">
                <span>优惠</span><span>-￥0.00</span>
              </p>
            </div>
            <div class="mt-4 border-t border-gray-100 pt-4">
              <p
                class="flex items-center justify-between text-base font-semibold"
              >
                <span>应付总额</span>
                <span class="text-rose-600">{{
                  formatPrice(cartStore.selectedTotalPrice)
                }}</span>
              </p>
            </div>
            <el-button
              class="mt-4 w-full"
              type="danger"
              :disabled="cartStore.selectedItems.length === 0"
              @click="goCheckout"
            >
              去结算
            </el-button>
          </div>
        </div>
      </div>
    </template>

    <template v-if="cartStore.items.length > 0">
      <template v-if="!isDesktop">
        <div class="space-y-3 px-3 pt-3 md:px-4 md:pt-4">
          <VanSwipeCell
            v-for="item in cartStore.items"
            :key="item.id"
            class="rounded-xl"
          >
            <div class="flex items-start gap-3 rounded-xl bg-white p-3 md:p-4">
              <VanCheckbox
                :model-value="item.selected"
                class="pt-7"
                @update:model-value="updateItemChecked(item.id, $event)"
              />

              <img
                :src="item.image"
                :alt="item.name"
                class="h-20 w-20 flex-none rounded-lg bg-gray-100 object-cover"
              />

              <div class="min-w-0 flex-1">
                <p
                  class="line-clamp-2 text-sm font-medium text-gray-900 md:text-base"
                >
                  {{ item.name }}
                </p>
                <p v-if="item.isSeckill" class="mt-1 text-xs text-rose-500">
                  秒杀价商品
                </p>
                <p
                  class="mt-2 text-sm font-semibold text-rose-600 md:text-base"
                >
                  {{ formatPrice(item.price) }}
                </p>
                <p class="mt-1 text-xs text-gray-500 md:text-sm">
                  库存 {{ item.stock }}
                </p>

                <div class="mt-2 flex justify-end">
                  <VanStepper
                    :model-value="item.quantity"
                    :min="1"
                    :max="item.stock"
                    integer
                    @update:model-value="updateItemQuantity(item.id, $event)"
                  />
                </div>
              </div>
            </div>

            <template #right>
              <VanButton
                square
                type="danger"
                text="删除"
                class="h-full"
                @click="removeItem(item.id)"
              />
            </template>
          </VanSwipeCell>
        </div>

        <div
          class="cart-submit-bar fixed left-0 right-0 border-t border-gray-200 bg-white px-4 py-3"
        >
          <div
            class="mx-auto flex w-full max-w-[450px] items-center justify-between"
          >
            <label class="flex items-center gap-2">
              <VanCheckbox v-model="allSelected" />
              <span class="text-sm text-gray-700">全选</span>
            </label>

            <div class="ml-4 flex-1 text-right">
              <p class="text-xs text-gray-500">合计</p>
              <p class="text-base font-semibold text-rose-600">
                {{ formatPrice(cartStore.selectedTotalPrice) }}
              </p>
            </div>

            <VanButton
              type="danger"
              class="ml-3 min-w-24"
              :disabled="cartStore.selectedItems.length === 0"
              @click="goCheckout"
            >
              去结算
            </VanButton>
          </div>
        </div>
      </template>
    </template>

    <div v-else class="flex min-h-screen items-center justify-center px-4">
      <VanEmpty description="购物车还是空的">
        <VanButton round type="primary" @click="goProducts">去逛逛</VanButton>
      </VanEmpty>
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

.cart-submit-bar {
  /* 预留全局 Tabbar 高度，避免结算栏被“首页/购物车/个人中心”遮挡 */
  bottom: calc(56px + env(safe-area-inset-bottom));
}
</style>
