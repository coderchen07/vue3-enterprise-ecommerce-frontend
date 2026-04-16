<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useCartStore } from '@/stores/cart';

defineOptions({
  name: 'MobileLayout',
});

const route = useRoute();
const cartStore = useCartStore();

const pageTitle = computed<string>(() => {
  const title = route.meta.title;
  return typeof title === 'string' && title ? title : '电商前端平台';
});

const hideTabbar = computed<boolean>(() => Boolean(route.meta.hideTabbar));
</script>

<template>
  <section
    :class="
      hideTabbar ? 'min-h-screen bg-gray-50' : 'min-h-screen bg-gray-50 pb-14'
    "
  >
    <VanNavBar :title="pageTitle" fixed placeholder />
    <main>
      <slot />
    </main>
    <VanTabbar v-if="!hideTabbar" route>
      <VanTabbarItem to="/products" icon="home-o">首页</VanTabbarItem>
      <VanTabbarItem
        to="/cart"
        icon="cart-o"
        :badge="cartStore.totalCount || ''"
        >购物车</VanTabbarItem
      >
      <VanTabbarItem to="/user" icon="user-o">个人中心</VanTabbarItem>
    </VanTabbar>
  </section>
</template>
