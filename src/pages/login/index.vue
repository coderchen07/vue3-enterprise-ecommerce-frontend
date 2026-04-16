<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { closeToast, showLoadingToast, showToast } from 'vant';
import { useRouter } from 'vue-router';
import * as userApi from '@/shared/api/modules/user';
import { LOGIN_REDIRECT_STORAGE_KEY } from '@/shared/constants/auth';
import { useUserStore } from '@/stores/user';

defineOptions({
  name: 'LoginPage',
});

const PHONE_REGEX = /^1\d{10}$/;
const COUNTDOWN_SECONDS = 60;

const router = useRouter();
const userStore = useUserStore();

const phone = ref<string>('');
const code = ref<string>('');
const codeSending = ref<boolean>(false);
const loginSubmitting = ref<boolean>(false);
const countdown = ref<number>(0);
let timerId: number | null = null;

const canSendCode = computed<boolean>(
  () => countdown.value === 0 && !codeSending.value,
);
const codeButtonText = computed<string>(() =>
  countdown.value > 0 ? `${countdown.value}s` : '获取验证码',
);

const clearTimer = (): void => {
  if (timerId !== null) {
    window.clearInterval(timerId);
    timerId = null;
  }
};

const startCountdown = (): void => {
  clearTimer();
  countdown.value = COUNTDOWN_SECONDS;
  timerId = window.setInterval(() => {
    countdown.value -= 1;
    if (countdown.value <= 0) {
      clearTimer();
      countdown.value = 0;
    }
  }, 1000);
};

const validatePhone = (): boolean => {
  if (!PHONE_REGEX.test(phone.value)) {
    showToast('请输入正确的 11 位手机号');
    return false;
  }
  return true;
};

const sendCode = async (): Promise<void> => {
  if (!canSendCode.value) {
    return;
  }
  if (!validatePhone()) {
    return;
  }

  codeSending.value = true;
  showLoadingToast({
    message: '验证码发送中...',
    forbidClick: true,
    duration: 0,
  });

  try {
    await userApi.sendCode({ phone: phone.value });
    showToast('验证码已发送');
    startCountdown();
  } catch (unknownError) {
    showToast(
      unknownError instanceof Error ? unknownError.message : '验证码发送失败',
    );
  } finally {
    codeSending.value = false;
    closeToast();
  }
};

const login = async (): Promise<void> => {
  if (!validatePhone()) {
    return;
  }
  if (!code.value.trim()) {
    showToast('请输入验证码');
    return;
  }

  loginSubmitting.value = true;
  showLoadingToast({
    message: '登录中...',
    forbidClick: true,
    duration: 0,
  });

  try {
    await userStore.login(phone.value, code.value.trim());
    showToast('登录成功');
    const redirectPath = (() => {
      try {
        const value = sessionStorage.getItem(LOGIN_REDIRECT_STORAGE_KEY);
        return value && value.startsWith('/') ? value : '/products';
      } catch {
        return '/products';
      }
    })();
    try {
      sessionStorage.removeItem(LOGIN_REDIRECT_STORAGE_KEY);
    } catch {
      // ignore storage exceptions
    }
    await router.replace(redirectPath);
  } catch (unknownError) {
    showToast(
      unknownError instanceof Error
        ? unknownError.message
        : '登录失败，请检查验证码',
    );
  } finally {
    loginSubmitting.value = false;
    closeToast();
  }
};

onBeforeUnmount(() => {
  clearTimer();
});
</script>

<template>
  <section
    class="min-h-screen bg-gray-50 px-4 py-8 md:flex md:items-center md:justify-center"
  >
    <div
      class="mx-auto w-full max-w-md rounded-2xl bg-white p-5 shadow-sm md:max-w-sm md:p-6"
    >
      <h1 class="text-xl font-semibold text-gray-900">手机号验证码登录</h1>
      <p class="mt-1 text-sm text-gray-500">登录后可继续购物、下单等操作。</p>

      <div class="mt-6 space-y-4">
        <VanField
          v-model="phone"
          type="tel"
          maxlength="11"
          clearable
          label="手机号"
          placeholder="请输入 11 位手机号"
        />

        <VanField
          v-model="code"
          maxlength="6"
          clearable
          label="验证码"
          placeholder="请输入验证码"
        >
          <template #button>
            <VanButton
              size="small"
              type="primary"
              :disabled="!canSendCode"
              :loading="codeSending"
              @click="sendCode"
            >
              {{ codeButtonText }}
            </VanButton>
          </template>
        </VanField>
      </div>

      <VanButton
        class="mt-6"
        type="danger"
        block
        :loading="loginSubmitting"
        @click="login"
        >登录</VanButton
      >
    </div>
  </section>
</template>
