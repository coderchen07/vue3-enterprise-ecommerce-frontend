import { computed } from 'vue';
import { useUserStore } from '@/stores/user';

export type RedPacketType = 'daily' | 'weekly' | 'monthly';

interface RedPacketRule {
  level: number;
  type: RedPacketType;
  label: string;
  threshold: number;
  minPoints: number;
  maxPoints: number;
}

const dailyRedPacketRules: RedPacketRule[] = [
  {
    level: 1,
    type: 'daily',
    label: '每日红包',
    threshold: 100,
    minPoints: 1,
    maxPoints: 10,
  },
  {
    level: 2,
    type: 'daily',
    label: '每日红包',
    threshold: 300,
    minPoints: 5,
    maxPoints: 30,
  },
  {
    level: 3,
    type: 'daily',
    label: '每日红包',
    threshold: 600,
    minPoints: 10,
    maxPoints: 60,
  },
  {
    level: 4,
    type: 'daily',
    label: '每日红包',
    threshold: 1000,
    minPoints: 20,
    maxPoints: 100,
  },
  {
    level: 5,
    type: 'daily',
    label: '每日红包',
    threshold: 1500,
    minPoints: 30,
    maxPoints: 150,
  },
];

const withScale = (
  base: RedPacketRule,
  type: RedPacketType,
  thresholdScale: number,
  rewardScale: number,
): RedPacketRule => ({
  ...base,
  type,
  threshold: Math.floor(base.threshold * thresholdScale),
  minPoints: Math.floor(base.minPoints * rewardScale),
  maxPoints: Math.floor(base.maxPoints * rewardScale),
});

const weeklyRedPacketRules: RedPacketRule[] = dailyRedPacketRules.map((rule) =>
  withScale(rule, 'weekly', 7, 3),
);
const monthlyRedPacketRules: RedPacketRule[] = dailyRedPacketRules.map((rule) =>
  withScale(rule, 'monthly', 30, 10),
);
const redPacketRulesByType: Record<RedPacketType, RedPacketRule[]> = {
  daily: dailyRedPacketRules,
  weekly: weeklyRedPacketRules,
  monthly: monthlyRedPacketRules,
};

const getDateKey = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMonthKey = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  return `${year}-${month}`;
};

const getWeekKey = (): string => {
  const now = new Date();
  const date = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
  );
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

export const useRedPacket = () => {
  const userStore = useUserStore();

  const getConsumptionByType = (type: RedPacketType): number => {
    if (type === 'daily') {
      return userStore.dailyConsumption;
    }
    if (type === 'weekly') {
      return userStore.weeklyConsumption;
    }
    return userStore.monthlyConsumption;
  };

  const getPeriodKeyByType = (type: RedPacketType): string => {
    if (type === 'daily') {
      return getDateKey();
    }
    if (type === 'weekly') {
      return getWeekKey();
    }
    return getMonthKey();
  };

  const checkAndResetRedPackets = (): void => {
    (['daily', 'weekly', 'monthly'] as RedPacketType[]).forEach((type) => {
      const currentKey = getPeriodKeyByType(type);
      const storedKey = userStore.lastRedPacketReset[type];
      if (storedKey === currentKey) {
        return;
      }
      userStore.resetConsumptionByType(type);
      userStore.setRedPacketClaimedLevels(type, []);
      userStore.setRedPacketResetKey(type, currentKey);
    });
  };

  const checkRedPacketStatus = (
    type: RedPacketType,
    level: number,
  ): { canClaim: boolean; reason?: string } => {
    const rule = redPacketRulesByType[type].find(
      (item) => item.level === level,
    );
    if (!rule) {
      return { canClaim: false, reason: '红包配置不存在' };
    }
    if (userStore.redPacketClaimedLevels[type].includes(level)) {
      return { canClaim: false, reason: '本档位已领取' };
    }
    if (getConsumptionByType(type) < rule.threshold) {
      return { canClaim: false, reason: '消费金额未达门槛' };
    }
    return { canClaim: true };
  };

  const claimRedPacket = (
    type: RedPacketType,
    level: number,
  ): { success: boolean; points: number; reason?: string } => {
    checkAndResetRedPackets();
    const status = checkRedPacketStatus(type, level);
    if (!status.canClaim) {
      return {
        success: false,
        points: 0,
        reason: status.reason,
      };
    }
    const rule = redPacketRulesByType[type].find(
      (item) => item.level === level,
    );
    if (!rule) {
      return { success: false, points: 0, reason: '红包配置不存在' };
    }
    const points =
      Math.floor(Math.random() * (rule.maxPoints - rule.minPoints + 1)) +
      rule.minPoints;
    userStore.addPoints(points, 'direct');
    userStore.markRedPacketLevelClaimed(type, level);
    return {
      success: true,
      points,
    };
  };

  const getPacketStatesByType = (
    type: RedPacketType,
  ): Array<
    RedPacketRule & {
      consumption: number;
      claimed: boolean;
      canClaim: boolean;
      reason?: string;
    }
  > =>
    redPacketRulesByType[type].map((rule) => {
      const status = checkRedPacketStatus(type, rule.level);
      return {
        ...rule,
        consumption: getConsumptionByType(type),
        claimed: userStore.redPacketClaimedLevels[type].includes(rule.level),
        canClaim: status.canClaim,
        reason: status.reason,
      };
    });

  const packetStates = computed(() => getPacketStatesByType('daily'));

  return {
    redPacketRulesByType,
    packetStates,
    getPacketStatesByType,
    checkAndResetRedPackets,
    checkRedPacketStatus,
    claimRedPacket,
  };
};
