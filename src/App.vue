<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import { useRoute } from 'vue-router';
import { useRedPacket } from '@/features/redpacket/composables/useRedPacket';
import { useCouponStore } from '@/stores/coupon';
import MobileLayout from '@/widgets/MobileLayout.vue';
import PcLayout from '@/widgets/PcLayout.vue';

const route = useRoute();
const isDesktop = useMediaQuery('(min-width: 1024px)');
const usePlainView = computed<boolean>(() => route.path === '/login');
const { checkAndResetRedPackets } = useRedPacket();
const couponStore = useCouponStore();

onMounted(() => {
  checkAndResetRedPackets();
  couponStore.checkAndResetDailyCoupons();
});

watch(
  () => route.path,
  () => {
    checkAndResetRedPackets();
    couponStore.checkAndResetDailyCoupons();
  },
);
</script>

<template>
  <RouterView v-slot="{ Component }">
    <component :is="usePlainView ? 'div' : isDesktop ? PcLayout : MobileLayout">
      <component :is="Component" />
    </component>
  </RouterView>
</template>
