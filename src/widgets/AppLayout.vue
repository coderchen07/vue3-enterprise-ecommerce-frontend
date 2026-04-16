<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useCartStore } from '@/stores/cart';

const route = useRoute();
const cartStore = useCartStore();

const pageTitle = computed<string>(() => {
  const title = route.meta.title;
  return typeof title === 'string' && title ? title : '电商平台';
});

const hideTabbar = computed<boolean>(() => Boolean(route.meta.hideTabbar));
</script>

<template>
  <section class="min-h-screen bg-gray-100">
    <div
      :class="
        hideTabbar
          ? 'mx-auto min-h-screen w-full bg-gray-50 md:max-w-[450px]'
          : 'mx-auto min-h-screen w-full bg-gray-50 pb-14 md:max-w-[450px]'
      "
    >
      <VanNavBar :title="pageTitle" fixed placeholder class="layout-navbar" />

      <main>
        <RouterView />
      </main>

      <VanTabbar v-if="!hideTabbar" route class="layout-tabbar">
        <!-- 勿用 replace，否则会覆盖历史记录导致从登录页无法返回上一页 -->
        <VanTabbarItem to="/products" icon="home-o">首页</VanTabbarItem>
        <VanTabbarItem
          to="/cart"
          icon="cart-o"
          :badge="cartStore.totalCount || ''"
          >购物车</VanTabbarItem
        >
        <VanTabbarItem to="/user" icon="user-o">个人中心</VanTabbarItem>
      </VanTabbar>
    </div>
  </section>
</template>

<style scoped>
@media (min-width: 768px) {
  :deep(.layout-navbar.van-nav-bar) {
    left: 50%;
    width: 100%;
    max-width: 450px;
    transform: translateX(-50%);
  }

  :deep(.layout-tabbar.van-tabbar) {
    left: 50%;
    width: 100%;
    max-width: 450px;
    transform: translateX(-50%);
  }
}
</style>
