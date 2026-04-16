<script setup lang="ts">
import { computed } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import { showConfirmDialog, showToast } from 'vant';
import { useRouter } from 'vue-router';
import type { Address } from '@/entities/address';
import AddressCard from '@/features/user/components/AddressCard.vue';
import { useAddressStore } from '@/stores/address';

defineOptions({
  name: 'AddressListPage',
});

const router = useRouter();
const addressStore = useAddressStore();
const isDesktop = useMediaQuery('(min-width: 1024px)');

const addresses = computed<Address[]>(() => addressStore.fetchAddresses());

const goCreate = (): void => {
  void router.push('/user/address/edit');
};

const goEdit = (id: string): void => {
  void router.push(`/user/address/edit/${id}`);
};

const removeAddress = async (id: string): Promise<void> => {
  if (isDesktop.value) {
    addressStore.deleteAddress(id);
    showToast('地址已删除');
    return;
  }
  try {
    await showConfirmDialog({
      title: '删除确认',
      message: '确认删除该收货地址吗？',
    });
    addressStore.deleteAddress(id);
    showToast('地址已删除');
  } catch {
    // cancelled
  }
};

const setDefault = (id: string): void => {
  addressStore.setDefaultAddress(id);
  showToast('已设为默认地址');
};
</script>

<template>
  <section class="min-h-screen bg-gray-50 p-3 md:p-6">
    <div class="mx-auto w-full max-w-[1200px]">
      <header
        class="mb-4 flex items-center justify-between rounded-xl bg-white p-4 shadow-sm"
      >
        <h1 class="text-lg font-semibold text-gray-900">收货地址</h1>
        <template v-if="isDesktop">
          <el-button type="primary" @click="goCreate">新增地址</el-button>
        </template>
        <template v-else>
          <VanButton size="small" type="primary" @click="goCreate"
            >新增地址</VanButton
          >
        </template>
      </header>

      <div v-if="addresses.length > 0" class="space-y-3">
        <AddressCard
          v-for="address in addresses"
          :key="address.id"
          :address="address"
          selectable
          @select="goEdit(address.id)"
          @edit="goEdit(address.id)"
          @delete="removeAddress(address.id)"
          @set-default="setDefault(address.id)"
        />
      </div>

      <div v-else class="rounded-xl bg-white py-12">
        <VanEmpty description="暂无收货地址">
          <VanButton round type="primary" @click="goCreate">新增地址</VanButton>
        </VanEmpty>
      </div>
    </div>
  </section>
</template>
