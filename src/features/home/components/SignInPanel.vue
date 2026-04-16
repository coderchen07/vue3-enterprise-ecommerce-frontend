<script setup lang="ts">
import { computed } from 'vue';
import { ElMessage } from 'element-plus';
import { showToast } from 'vant';
import { useSignIn } from '@/features/signin/composables/useSignIn';

defineOptions({
  name: 'SignInPanel',
});

interface SignInPanelProps {
  isDesktop?: boolean;
}

const props = withDefaults(defineProps<SignInPanelProps>(), {
  isDesktop: false,
});

const { signIn, canSignIn, getSignInRange, totalSignInCount } = useSignIn();

const signInRangeText = computed<string>(() => {
  const [min, max] = getSignInRange();
  return `${min}～${max}`;
});

const handleSignIn = (): void => {
  if (!canSignIn()) {
    const message = '今日已签到';
    if (props.isDesktop) {
      ElMessage.warning(message);
      return;
    }
    showToast(message);
    return;
  }
  const result = signIn();
  const message = `签到成功，获得 ${result.earnedPoints} 积分`;
  if (props.isDesktop) {
    ElMessage.success(message);
    return;
  }
  showToast(message);
};
</script>

<template>
  <section class="rounded-xl bg-white p-4 shadow-sm">
    <h2 class="text-base font-semibold text-gray-900">签到中心</h2>
    <p class="mt-3 text-sm text-gray-700">累计签到 {{ totalSignInCount }} 次</p>
    <p class="mt-1 text-sm text-gray-700">
      本次签到可得 {{ signInRangeText }} 积分
    </p>
    <div class="mt-4">
      <template v-if="isDesktop">
        <el-button
          type="primary"
          class="w-56 rounded-lg"
          :disabled="!canSignIn()"
          @click="handleSignIn"
        >
          {{ canSignIn() ? '立即签到' : '今日已签到' }}
        </el-button>
      </template>
      <template v-else>
        <VanButton
          type="primary"
          block
          :disabled="!canSignIn()"
          @click="handleSignIn"
        >
          {{ canSignIn() ? '立即签到' : '今日已签到' }}
        </VanButton>
      </template>
    </div>
    <div class="mt-4 rounded-lg bg-gray-50 p-3 text-xs leading-6 text-gray-500">
      <p>积分规则：</p>
      <p>1. 每次签到随机获得积分，基础区间为 1～3。</p>
      <p>
        2. 累计签到次数越多，积分上限和下限越高：下限 = 1 + 累计签到次数 ÷
        4（向下取整，最高 15）；上限 = 3 + 累计签到次数 ÷ 2（向下取整，最高
        30）。
      </p>
      <p>3. 每日仅可签到一次，0 点后刷新。</p>
    </div>
  </section>
</template>
