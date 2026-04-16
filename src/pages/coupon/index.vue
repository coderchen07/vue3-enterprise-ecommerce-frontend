<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import { showToast } from 'vant';
import { CouponStatus } from '@/entities/coupon';
import { useCoupon } from '@/features/coupon/composables/useCoupon';
import { useCouponStore } from '@/stores/coupon';

defineOptions({
  name: 'CouponPage',
});

const isDesktop = useMediaQuery('(min-width: 1024px)');
const couponStore = useCouponStore();
const { templates, couponsByStatus, getTemplateStatus, canClaimTemplate } =
  useCoupon();
const activeTab = ref<CouponStatus>(CouponStatus.Claimed);

const tabOptions = [
  { label: '已领取', value: CouponStatus.Claimed },
  { label: '已使用', value: CouponStatus.Used },
  { label: '已过期', value: CouponStatus.Expired },
];

const myCoupons = computed(() => couponsByStatus.value[activeTab.value]);
const formatDate = (date: string): string =>
  new Date(date).toLocaleDateString('zh-CN');
const couponStatusTextMap: Record<CouponStatus, string> = {
  [CouponStatus.Claimed]: '已领取',
  [CouponStatus.Unused]: '未领取',
  [CouponStatus.Used]: '已使用',
  [CouponStatus.Expired]: '已过期',
};

onMounted(() => {
  couponStore.checkAndResetDailyCoupons();
});

const getClaimButtonText = (id: string): string => {
  const template = templates.value.find((item) => item.id === id);
  if (!template) {
    return '立即领取';
  }
  const status = getTemplateStatus(template);
  if (status === CouponStatus.Expired) {
    return '已过期';
  }
  if (status === CouponStatus.Used) {
    return '已使用';
  }
  if (couponStore.hasClaimedToday(id)) {
    return '今日已领';
  }
  return '立即领取';
};

const claimCoupon = (id: string): void => {
  const target = templates.value.find((item) => item.id === id);
  if (!target) {
    return;
  }
  const success = couponStore.claimCoupon(target);
  showToast(success ? '领取成功' : `${getClaimButtonText(id)}，暂不可领取`);
};
</script>

<template>
  <section class="min-h-screen bg-gray-50 p-3 md:p-4">
    <div class="mx-auto w-full max-w-[1200px] space-y-4">
      <header class="rounded-xl bg-white p-4 shadow-sm">
        <h1 class="text-lg font-semibold text-gray-900">优惠券中心</h1>
        <p class="mt-1 text-sm text-gray-500">
          领取后 7-13 天内有效，结算页可直接使用
        </p>
      </header>

      <section class="rounded-xl bg-white p-4 shadow-sm">
        <h2 class="text-base font-semibold text-gray-900">可领取优惠券</h2>
        <div
          class="mt-3 grid gap-3"
          :class="isDesktop ? 'grid-cols-3' : 'grid-cols-1'"
        >
          <article
            v-for="item in templates"
            :key="item.id"
            class="rounded-xl border border-orange-100 bg-gradient-to-r from-orange-50 to-rose-50 p-3"
          >
            <p class="text-sm font-semibold text-gray-900">{{ item.name }}</p>
            <p class="mt-2 text-xs text-gray-600">
              有效期：{{ formatDate(item.validFrom) }} -
              {{ formatDate(item.validTo) }}
            </p>
            <div class="mt-3 flex items-center justify-between">
              <span class="text-xs text-gray-500"
                >满{{ item.threshold }}减{{ item.discount }}</span
              >
              <template v-if="isDesktop">
                <el-button
                  size="small"
                  type="primary"
                  :disabled="!canClaimTemplate(item)"
                  @click="claimCoupon(item.id)"
                >
                  {{ getClaimButtonText(item.id) }}
                </el-button>
              </template>
              <template v-else>
                <VanButton
                  size="small"
                  type="primary"
                  :disabled="!canClaimTemplate(item)"
                  @click="claimCoupon(item.id)"
                >
                  {{ getClaimButtonText(item.id) }}
                </VanButton>
              </template>
            </div>
          </article>
        </div>
      </section>

      <section class="rounded-xl bg-white p-4 shadow-sm">
        <h2 class="text-base font-semibold text-gray-900">我的优惠券</h2>
        <template v-if="isDesktop">
          <el-tabs v-model="activeTab" class="mt-3">
            <el-tab-pane
              v-for="tab in tabOptions"
              :key="tab.value"
              :label="tab.label"
              :name="tab.value"
            />
          </el-tabs>
        </template>
        <template v-else>
          <VanTabs v-model:active="activeTab">
            <VanTab
              v-for="tab in tabOptions"
              :key="tab.value"
              :title="tab.label"
              :name="tab.value"
            />
          </VanTabs>
        </template>

        <div v-if="myCoupons.length > 0" class="mt-3 space-y-3">
          <article
            v-for="item in myCoupons"
            :key="item.id"
            class="rounded-xl border border-gray-200 bg-gray-50 p-3"
          >
            <div class="flex items-center justify-between gap-3">
              <p class="text-sm font-semibold text-gray-900">{{ item.name }}</p>
              <span class="text-xs text-gray-500">{{
                couponStatusTextMap[item.status]
              }}</span>
            </div>
            <p class="mt-2 text-xs text-gray-600">
              有效期至：{{ formatDate(item.validTo) }}
            </p>
          </article>
        </div>
        <VanEmpty v-else description="暂无优惠券" />
      </section>
    </div>
  </section>
</template>
