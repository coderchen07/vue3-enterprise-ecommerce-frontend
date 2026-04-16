<script setup lang="ts">
import { reactive, watch } from 'vue';
import type { ProductCategory } from '@/entities/product';

defineOptions({
  name: 'ProductFilter',
});

export interface ProductFilters {
  category?: ProductCategory;
  minPrice: number;
  maxPrice: number;
  brands: string[];
  tags: string[];
}

interface ProductFilterProps {
  modelValue: ProductFilters;
  availableBrands: string[];
  maxPriceLimit: number;
}

const props = defineProps<ProductFilterProps>();

const emit = defineEmits<{
  'update:modelValue': [value: ProductFilters];
  apply: [];
  reset: [];
}>();

const model = reactive<{
  category: 'all' | ProductCategory;
  priceRange: [number, number];
  brands: string[];
  tags: string[];
}>({
  category: 'all',
  priceRange: [0, props.maxPriceLimit],
  brands: [],
  tags: [],
});

const categoryOptions: Array<{
  label: string;
  value: 'all' | ProductCategory;
}> = [
  { label: '全部', value: 'all' },
  { label: '数码家电', value: 'digital' },
  { label: '服饰鞋包', value: 'fashion' },
  { label: '食品生鲜', value: 'food' },
  { label: '家居百货', value: 'home' },
];
const attrOptions = ['包邮', '7天无理由', '官方自营'];

const syncFromModelValue = (value: ProductFilters): void => {
  const nextMax = Math.max(0, props.maxPriceLimit);
  const min = Math.max(0, value.minPrice);
  const max = Math.min(nextMax, Math.max(min, value.maxPrice));
  model.category = value.category ?? 'all';
  model.priceRange = [min, max];
  model.brands = [...value.brands];
  model.tags = [...value.tags];
};

const emitModelUpdate = (): void => {
  emit('update:modelValue', {
    category: model.category === 'all' ? undefined : model.category,
    minPrice: model.priceRange[0],
    maxPrice: model.priceRange[1],
    brands: [...model.brands],
    tags: [...model.tags],
  });
};

watch(
  () => props.modelValue,
  (value) => {
    syncFromModelValue(value);
  },
  { immediate: true },
);

watch(
  () => [
    model.category,
    model.priceRange[0],
    model.priceRange[1],
    model.brands.join(','),
    model.tags.join(','),
  ],
  () => {
    emitModelUpdate();
  },
);

const submit = (): void => {
  emitModelUpdate();
  emit('apply');
};

const reset = (): void => {
  model.category = 'all';
  model.brands = [];
  model.priceRange = [0, props.maxPriceLimit];
  model.tags = [];
  emitModelUpdate();
  emit('reset');
};
</script>

<template>
  <aside class="sticky top-6 rounded-xl bg-white p-4 shadow-sm">
    <el-collapse model-value="categories,price,brands,attrs">
      <el-collapse-item title="类目筛选" name="categories">
        <el-radio-group
          v-model="model.category"
          class="category-radio-group flex flex-col gap-2"
        >
          <div v-for="item in categoryOptions" :key="item.value" class="w-full">
            <el-radio :label="item.label" :value="item.value" class="w-full">
              {{ item.label }}
            </el-radio>
          </div>
        </el-radio-group>
      </el-collapse-item>
      <el-collapse-item title="价格区间" name="price">
        <el-slider
          v-model="model.priceRange"
          range
          :min="0"
          :max="props.maxPriceLimit"
        />
        <div
          class="mt-2 flex items-center justify-between text-xs text-gray-500"
        >
          <span>￥{{ model.priceRange[0] }}</span>
          <span>￥{{ model.priceRange[1] }}</span>
        </div>
      </el-collapse-item>
      <el-collapse-item title="品牌筛选" name="brands">
        <el-checkbox-group v-model="model.brands" class="flex flex-col gap-2">
          <el-checkbox
            v-for="item in props.availableBrands"
            :key="item"
            :label="item"
            :value="item"
          />
        </el-checkbox-group>
      </el-collapse-item>
      <el-collapse-item title="属性筛选" name="attrs">
        <el-checkbox-group v-model="model.tags" class="flex flex-col gap-2">
          <el-checkbox
            v-for="item in attrOptions"
            :key="item"
            :label="item"
            :value="item"
          />
        </el-checkbox-group>
      </el-collapse-item>
    </el-collapse>
    <div class="mt-4 grid grid-cols-2 gap-3">
      <el-button @click="reset">重置</el-button>
      <el-button type="primary" @click="submit">确认</el-button>
    </div>
  </aside>
</template>

<style scoped>
:deep(.category-radio-group .el-radio) {
  margin-right: 0;
}
</style>
