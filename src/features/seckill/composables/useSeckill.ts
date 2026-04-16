import { computed } from 'vue';
import { mockProducts } from '@/shared/data/products.mock';
import type { SeckillItem } from '@/entities/seckill';

const DATE_MS = 24 * 60 * 60 * 1000;

const getTodaySeed = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const date = `${now.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${date}`;
};

const hashString = (value: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return Math.abs(hash >>> 0);
};

const createRandom = (seed: string): (() => number) => {
  let state = hashString(seed) || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

const pickUniqueIndexes = (count: number, random: () => number): number[] => {
  const indexes = mockProducts.map((_, index) => index);
  for (let i = indexes.length - 1; i > 0; i -= 1) {
    const swapIndex = Math.floor(random() * (i + 1));
    [indexes[i], indexes[swapIndex]] = [indexes[swapIndex], indexes[i]];
  }
  return indexes.slice(0, count);
};

const startOfToday = (seed: string): Date => new Date(`${seed}T00:00:00`);
const endOfToday = (seed: string): Date => new Date(`${seed}T23:59:59`);

const buildTodaySeckillItems = (): SeckillItem[] => {
  const seed = getTodaySeed();
  const random = createRandom(seed);
  const indexes = pickUniqueIndexes(12, random);
  const validFrom = startOfToday(seed).toISOString();
  const validTo = endOfToday(seed).toISOString();
  return indexes.map((index) => {
    const product = mockProducts[index];
    const discountRate = Number((0.5 + random() * 0.3).toFixed(2));
    const seckillPrice = Math.ceil(product.price * discountRate * 100) / 100;
    return {
      ...product,
      isSeckill: true,
      seckillPrice,
      discountRate,
      validFrom,
      validTo,
    };
  });
};

const isSeckillValid = (item: SeckillItem): boolean => {
  const now = Date.now();
  return (
    now >= new Date(item.validFrom).getTime() &&
    now <= new Date(item.validTo).getTime()
  );
};

const formatCountdown = (validTo: string): string => {
  const now = Date.now();
  const leftMs = Math.max(0, new Date(validTo).getTime() - now);
  const hour = `${Math.floor(leftMs / (60 * 60 * 1000))}`.padStart(2, '0');
  const minute =
    `${Math.floor((leftMs % (60 * 60 * 1000)) / (60 * 1000))}`.padStart(2, '0');
  const second = `${Math.floor((leftMs % (60 * 1000)) / 1000)}`.padStart(
    2,
    '0',
  );
  return `${hour}:${minute}:${second}`;
};

const isSameDay = (value: string): boolean => value === getTodaySeed();

export const useSeckill = () => {
  const todaySeed = getTodaySeed();
  const items = computed<SeckillItem[]>(() => buildTodaySeckillItems());
  const validTo = computed<string>(
    () =>
      items.value[0]?.validTo ?? new Date(Date.now() + DATE_MS).toISOString(),
  );
  return {
    todaySeed,
    items,
    validTo,
    isSameDay,
    isSeckillValid,
    formatCountdown,
  };
};
