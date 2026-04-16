<script setup lang="ts">
import { useRouter } from 'vue-router';

defineOptions({
  name: 'QuickEntryGrid',
});

const emit = defineEmits<{
  signin: [];
  redpacket: [];
}>();

interface QuickEntryItem {
  id: string;
  label: string;
  icon: string;
  to?: string;
}

const router = useRouter();

const entries: QuickEntryItem[] = [
  { id: 'seckill', label: '秒杀', icon: 'fire-o', to: '/seckill' },
  { id: 'coupon', label: '优惠券', icon: 'coupon-o', to: '/coupon' },
  { id: 'signin', label: '签到', icon: 'records-o' },
  { id: 'redpacket', label: '领红包', icon: 'gift-o' },
];

const handleEntryClick = (entry: QuickEntryItem): void => {
  if (entry.id === 'signin') {
    emit('signin');
    return;
  }
  if (entry.id === 'redpacket') {
    emit('redpacket');
    return;
  }
  if (!entry.to) {
    return;
  }
  void router.push(entry.to);
};
</script>

<template>
  <section class="rounded-xl bg-white px-3 py-3 shadow-sm">
    <div class="grid grid-cols-4 gap-2">
      <button
        v-for="entry in entries"
        :key="entry.id"
        type="button"
        class="flex flex-col items-center justify-center gap-1 py-1"
        @click="handleEntryClick(entry)"
      >
        <span
          class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-50 to-rose-100 text-rose-500"
        >
          <VanIcon :name="entry.icon" size="20" />
        </span>
        <span class="text-xs text-gray-700">{{ entry.label }}</span>
      </button>
    </div>
  </section>
</template>
