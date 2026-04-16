<script setup lang="ts">
import { computed } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import type { Address } from '@/entities/address';
import AddressCard from '@/features/user/components/AddressCard.vue';

defineOptions({
  name: 'AddressSelector',
});

interface AddressSelectorProps {
  modelValue: boolean;
  addresses: Address[];
  selectedId?: string;
}

const props = withDefaults(defineProps<AddressSelectorProps>(), {
  selectedId: undefined,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  select: [id: string];
  add: [];
}>();

const isDesktop = useMediaQuery('(min-width: 1024px)');
const visible = computed<boolean>({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const close = (): void => {
  visible.value = false;
};
</script>

<template>
  <template v-if="isDesktop">
    <el-dialog
      v-model="visible"
      width="680px"
      title="选择收货地址"
      @close="close"
    >
      <div
        v-if="props.addresses.length > 0"
        class="max-h-[460px] space-y-3 overflow-y-auto pr-1"
      >
        <AddressCard
          v-for="address in props.addresses"
          :key="address.id"
          :address="address"
          selectable
          :selected="address.id === props.selectedId"
          @select="emit('select', address.id)"
        />
      </div>
      <el-empty v-else description="暂无收货地址" />
      <template #footer>
        <div class="flex justify-between">
          <el-button @click="emit('add')">新增地址</el-button>
          <el-button type="primary" @click="close">完成</el-button>
        </div>
      </template>
    </el-dialog>
  </template>

  <template v-else>
    <VanPopup
      v-model:show="visible"
      position="bottom"
      round
      :style="{ height: '72%' }"
    >
      <div class="flex h-full flex-col p-4">
        <div class="mb-3 text-center text-base font-semibold text-gray-900">
          选择收货地址
        </div>
        <div
          v-if="props.addresses.length > 0"
          class="flex-1 space-y-3 overflow-y-auto"
        >
          <AddressCard
            v-for="address in props.addresses"
            :key="address.id"
            :address="address"
            selectable
            :selected="address.id === props.selectedId"
            @select="emit('select', address.id)"
          />
        </div>
        <div v-else class="flex flex-1 items-center justify-center">
          <VanEmpty description="暂无收货地址" />
        </div>
        <div class="mt-4 grid grid-cols-2 gap-3">
          <VanButton block plain type="primary" @click="emit('add')"
            >新增地址</VanButton
          >
          <VanButton block type="primary" @click="close">完成</VanButton>
        </div>
      </div>
    </VanPopup>
  </template>
</template>
