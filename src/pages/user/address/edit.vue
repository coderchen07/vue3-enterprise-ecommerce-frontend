<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import { showToast } from 'vant';
import { useRoute, useRouter } from 'vue-router';
import { useAddressStore } from '@/stores/address';

defineOptions({
  name: 'AddressEditPage',
});

interface AddressFormModel {
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  isDefault: boolean;
}

const route = useRoute();
const router = useRouter();
const addressStore = useAddressStore();
const isDesktop = useMediaQuery('(min-width: 1024px)');

const addressId = computed<string>(() =>
  typeof route.params.id === 'string' ? route.params.id : '',
);
const editingAddress = computed(() =>
  addressId.value ? addressStore.getAddressById(addressId.value) : null,
);
const isEdit = computed<boolean>(() => Boolean(editingAddress.value));
const redirectPath = computed<string>(() =>
  typeof route.query.redirect === 'string' &&
  route.query.redirect.startsWith('/')
    ? route.query.redirect
    : '/user/address',
);

const form = reactive<AddressFormModel>({
  name: editingAddress.value?.name ?? '',
  phone: editingAddress.value?.phone ?? '',
  province: editingAddress.value?.province ?? '',
  city: editingAddress.value?.city ?? '',
  district: editingAddress.value?.district ?? '',
  detail: editingAddress.value?.detail ?? '',
  isDefault: editingAddress.value?.isDefault ?? false,
});

const pageTitle = computed<string>(() =>
  isEdit.value ? '编辑收货地址' : '新增收货地址',
);
const phonePattern = /^1\d{10}$/;

const validateForm = (): boolean => {
  if (!form.name.trim()) {
    showToast('请填写收货人姓名');
    return false;
  }
  if (!phonePattern.test(form.phone.trim())) {
    showToast('请输入11位手机号');
    return false;
  }
  if (!form.province.trim() || !form.city.trim() || !form.district.trim()) {
    showToast('请完整填写省市区');
    return false;
  }
  if (!form.detail.trim()) {
    showToast('请填写详细地址');
    return false;
  }
  return true;
};

const submitting = ref<boolean>(false);

const handleSubmit = async (): Promise<void> => {
  if (!validateForm()) {
    return;
  }
  submitting.value = true;
  try {
    const payload: AddressFormModel = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      province: form.province.trim(),
      city: form.city.trim(),
      district: form.district.trim(),
      detail: form.detail.trim(),
      isDefault: form.isDefault,
    };

    if (isEdit.value && addressId.value) {
      addressStore.updateAddress(addressId.value, payload);
      showToast('地址已更新');
    } else {
      const created = addressStore.addAddress(payload);
      if (redirectPath.value === '/order/checkout') {
        await router.replace({
          path: redirectPath.value,
          query: {
            addressId: created.id,
          },
        });
        return;
      }
      showToast('地址已新增');
    }
    await router.replace(redirectPath.value);
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <section class="min-h-screen bg-gray-50 p-3 md:p-6">
    <div
      class="mx-auto w-full max-w-[720px] rounded-xl bg-white p-4 shadow-sm md:p-6"
    >
      <h1 class="text-lg font-semibold text-gray-900">{{ pageTitle }}</h1>

      <template v-if="isDesktop">
        <el-form label-position="top" class="mt-4">
          <el-form-item label="收货人">
            <el-input v-model="form.name" placeholder="请输入收货人姓名" />
          </el-form-item>
          <el-form-item label="手机号">
            <el-input
              v-model="form.phone"
              maxlength="11"
              placeholder="请输入手机号"
            />
          </el-form-item>
          <div class="grid grid-cols-3 gap-3">
            <el-form-item label="省">
              <el-input v-model="form.province" placeholder="省" />
            </el-form-item>
            <el-form-item label="市">
              <el-input v-model="form.city" placeholder="市" />
            </el-form-item>
            <el-form-item label="区">
              <el-input v-model="form.district" placeholder="区" />
            </el-form-item>
          </div>
          <el-form-item label="详细地址">
            <el-input
              v-model="form.detail"
              type="textarea"
              :rows="3"
              placeholder="请输入街道门牌等信息"
            />
          </el-form-item>
          <el-form-item>
            <el-checkbox v-model="form.isDefault">设为默认地址</el-checkbox>
          </el-form-item>
          <el-button
            type="primary"
            class="!h-11 w-full"
            :loading="submitting"
            @click="handleSubmit"
            >保存地址</el-button
          >
        </el-form>
      </template>

      <template v-else>
        <div class="mt-4 space-y-3">
          <VanField
            v-model="form.name"
            label="收货人"
            placeholder="请输入收货人姓名"
          />
          <VanField
            v-model="form.phone"
            label="手机号"
            maxlength="11"
            placeholder="请输入手机号"
            type="tel"
          />
          <VanField
            v-model="form.province"
            label="省"
            placeholder="请输入省份"
          />
          <VanField v-model="form.city" label="市" placeholder="请输入城市" />
          <VanField
            v-model="form.district"
            label="区"
            placeholder="请输入区县"
          />
          <VanField
            v-model="form.detail"
            label="详细地址"
            type="textarea"
            rows="3"
            placeholder="请输入街道门牌等信息"
          />
          <VanCell title="设为默认地址">
            <template #right-icon>
              <VanSwitch v-model="form.isDefault" size="22" />
            </template>
          </VanCell>
          <VanButton
            block
            type="primary"
            :loading="submitting"
            @click="handleSubmit"
            >保存地址</VanButton
          >
        </div>
      </template>
    </div>
  </section>
</template>
