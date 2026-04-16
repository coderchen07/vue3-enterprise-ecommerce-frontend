<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core';
import type { Address } from '@/entities/address';

defineOptions({
  name: 'AddressCard',
});

interface AddressCardProps {
  address: Address;
  selectable?: boolean;
  selected?: boolean;
}

withDefaults(defineProps<AddressCardProps>(), {
  selectable: false,
  selected: false,
});

const emit = defineEmits<{
  select: [];
  edit: [];
  delete: [];
  setDefault: [];
}>();

const isDesktop = useMediaQuery('(min-width: 1024px)');
const formatPhone = (phone: string): string =>
  phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2');
</script>

<template>
  <article
    :class="[
      'rounded-xl border p-4 shadow-sm',
      selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white',
      selectable ? 'cursor-pointer' : '',
    ]"
    @click="selectable ? emit('select') : undefined"
  >
    <div class="flex items-center justify-between gap-3">
      <div class="min-w-0">
        <p class="text-sm font-semibold text-gray-900">
          {{ address.name }}
          <span class="ml-2 text-xs font-normal text-gray-500">{{
            formatPhone(address.phone)
          }}</span>
        </p>
        <p class="mt-2 text-sm text-gray-600">
          {{ address.province }}{{ address.city }}{{ address.district
          }}{{ address.detail }}
        </p>
      </div>
      <span
        v-if="address.isDefault"
        class="whitespace-nowrap rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700"
      >
        默认
      </span>
    </div>

    <div class="mt-3 flex items-center justify-end gap-2" @click.stop>
      <template v-if="isDesktop">
        <el-button link size="small" @click="emit('edit')">编辑</el-button>
        <el-popconfirm title="确认删除该地址吗？" @confirm="emit('delete')">
          <template #reference>
            <el-button link size="small" type="danger">删除</el-button>
          </template>
        </el-popconfirm>
        <el-button
          link
          size="small"
          :disabled="address.isDefault"
          @click="emit('setDefault')"
          >设为默认</el-button
        >
      </template>
      <template v-else>
        <VanButton size="small" plain type="primary" @click="emit('edit')"
          >编辑</VanButton
        >
        <VanButton size="small" plain type="danger" @click="emit('delete')"
          >删除</VanButton
        >
        <VanButton
          size="small"
          plain
          :disabled="address.isDefault"
          @click="emit('setDefault')"
          >设为默认</VanButton
        >
      </template>
    </div>
  </article>
</template>
