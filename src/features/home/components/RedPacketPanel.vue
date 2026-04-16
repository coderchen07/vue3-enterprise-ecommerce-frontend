<script setup lang="ts">
import { computed, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { showToast } from 'vant';
import {
  useRedPacket,
  type RedPacketType,
} from '@/features/redpacket/composables/useRedPacket';

defineOptions({
  name: 'RedPacketPanel',
});

interface RedPacketPanelProps {
  isDesktop?: boolean;
}

const props = withDefaults(defineProps<RedPacketPanelProps>(), {
  isDesktop: false,
});

const { checkAndResetRedPackets, getPacketStatesByType, claimRedPacket } =
  useRedPacket();
const activeType = ref<RedPacketType>('daily');

const typeOptions: Array<{ label: string; value: RedPacketType }> = [
  { label: '每日红包', value: 'daily' },
  { label: '每周红包', value: 'weekly' },
  { label: '每月红包', value: 'monthly' },
];

const packetList = computed(() => getPacketStatesByType(activeType.value));
const currentConsumption = computed<number>(
  () => packetList.value[0]?.consumption ?? 0,
);

const claim = (level: number): void => {
  const result = claimRedPacket(activeType.value, level);
  if (result.success) {
    const message = `领取成功，获得 ${result.points} 积分`;
    if (props.isDesktop) {
      ElMessage.success(message);
    } else {
      showToast(message);
    }
    return;
  }
  const message = result.reason || '领取失败';
  if (props.isDesktop) {
    ElMessage.warning(message);
  } else {
    showToast(message);
  }
};

checkAndResetRedPackets();
</script>

<template>
  <section class="rounded-xl bg-white p-4 shadow-sm">
    <h2 class="text-base font-semibold text-gray-900">领红包中心</h2>
    <template v-if="isDesktop">
      <el-radio-group v-model="activeType" class="mt-3">
        <el-radio-button
          v-for="tab in typeOptions"
          :key="tab.value"
          :value="tab.value"
          >{{ tab.label }}</el-radio-button
        >
      </el-radio-group>
    </template>
    <template v-else>
      <VanTabs v-model:active="activeType" class="mt-3">
        <VanTab
          v-for="tab in typeOptions"
          :key="tab.value"
          :title="tab.label"
          :name="tab.value"
        />
      </VanTabs>
    </template>

    <p class="mt-3 text-sm text-gray-600">
      当前周期消费：￥{{ currentConsumption.toFixed(2) }}
    </p>

    <div class="mt-3 space-y-3">
      <article
        v-for="packet in packetList"
        :key="`${packet.type}-${packet.level}`"
        class="rounded-xl border border-gray-200 p-3"
      >
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-gray-900">
              档位 {{ packet.level }}
            </p>
            <p class="mt-1 text-xs text-gray-500">
              门槛：消费满 ￥{{ packet.threshold }}
            </p>
            <p class="mt-1 text-xs text-gray-500">
              奖励：{{ packet.minPoints }}～{{ packet.maxPoints }} 积分
            </p>
          </div>
          <template v-if="isDesktop">
            <el-button
              size="small"
              type="danger"
              :disabled="!packet.canClaim || packet.claimed"
              @click="claim(packet.level)"
            >
              {{
                packet.claimed
                  ? '已领取'
                  : packet.canClaim
                    ? '立即领取'
                    : '未达标'
              }}
            </el-button>
          </template>
          <template v-else>
            <VanButton
              size="small"
              type="danger"
              :disabled="!packet.canClaim || packet.claimed"
              @click="claim(packet.level)"
            >
              {{
                packet.claimed
                  ? '已领取'
                  : packet.canClaim
                    ? '立即领取'
                    : '未达标'
              }}
            </VanButton>
          </template>
        </div>
      </article>
    </div>
  </section>
</template>
