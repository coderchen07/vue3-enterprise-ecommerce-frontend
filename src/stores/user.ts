import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { User } from '@/entities/user';
import * as userApi from '@/shared/api/modules/user';

interface LoginResponseShape {
  token?: string;
  user?: User;
}

const USER_TOKEN_KEY = 'token';
const USER_INFO_KEY = 'userInfo';

const syncTokenToStorage = (token: string): void => {
  localStorage.setItem(USER_TOKEN_KEY, token);
};

const syncUserInfoToStorage = (userInfo: User | null): void => {
  if (userInfo) {
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
    return;
  }
  localStorage.removeItem(USER_INFO_KEY);
};

const clearUserStorage = (): void => {
  localStorage.removeItem(USER_TOKEN_KEY);
  localStorage.removeItem(USER_INFO_KEY);
};

type RedPacketType = 'daily' | 'weekly' | 'monthly';

interface RedPacketClaimedLevelsState {
  daily: number[];
  weekly: number[];
  monthly: number[];
}

interface RedPacketResetState {
  daily: string;
  weekly: string;
  monthly: string;
}

export const useUserStore = defineStore(
  'user',
  () => {
    const token = ref<string>('');
    const userInfo = ref<User | null>(null);
    const points = ref<number>(0);
    const totalSignInCount = ref<number>(0);
    const dailyConsumption = ref<number>(0);
    const weeklyConsumption = ref<number>(0);
    const monthlyConsumption = ref<number>(0);
    const lastSignInDate = ref<string>('');
    const redPacketClaimedLevels = ref<RedPacketClaimedLevelsState>({
      daily: [],
      weekly: [],
      monthly: [],
    });
    const lastRedPacketReset = ref<RedPacketResetState>({
      daily: '',
      weekly: '',
      monthly: '',
    });
    const isLoading = ref<boolean>(false);
    const error = ref<string | null>(null);

    const isLoggedIn = computed<boolean>(() => Boolean(token.value));

    const login = async (phone: string, code: string): Promise<void> => {
      isLoading.value = true;
      error.value = null;

      try {
        // Current API module accepts password field; here we map sms code into it.
        const response = (await userApi.login({
          phone,
          password: code,
        })) as LoginResponseShape;
        const nextToken = response.token ?? '';
        const nextUserInfo = response.user ?? null;

        token.value = nextToken;
        userInfo.value = nextUserInfo;

        syncTokenToStorage(nextToken);
        syncUserInfoToStorage(nextUserInfo);
      } catch (unknownError) {
        error.value =
          unknownError instanceof Error
            ? unknownError.message
            : '登录失败，请稍后重试';
        throw unknownError;
      } finally {
        isLoading.value = false;
      }
    };

    const fetchUserInfo = async (): Promise<User | null> => {
      isLoading.value = true;
      error.value = null;

      try {
        const profile = await userApi.getProfile();
        userInfo.value = profile;
        syncUserInfoToStorage(profile);
        return profile;
      } catch (unknownError) {
        error.value =
          unknownError instanceof Error
            ? unknownError.message
            : '获取用户信息失败';
        throw unknownError;
      } finally {
        isLoading.value = false;
      }
    };

    const logout = async (): Promise<void> => {
      isLoading.value = true;
      error.value = null;

      try {
        token.value = '';
        userInfo.value = null;
        points.value = 0;
        totalSignInCount.value = 0;
        dailyConsumption.value = 0;
        weeklyConsumption.value = 0;
        monthlyConsumption.value = 0;
        lastSignInDate.value = '';
        redPacketClaimedLevels.value = {
          daily: [],
          weekly: [],
          monthly: [],
        };
        lastRedPacketReset.value = {
          daily: '',
          weekly: '',
          monthly: '',
        };
        clearUserStorage();
      } catch (unknownError) {
        error.value =
          unknownError instanceof Error ? unknownError.message : '退出登录失败';
        throw unknownError;
      } finally {
        isLoading.value = false;
      }
    };

    const addPoints = (
      amount: number,
      mode: 'payment' | 'direct' = 'payment',
    ): number => {
      const safeAmount = Math.max(0, amount);
      const earned =
        mode === 'payment'
          ? Math.floor(safeAmount * 0.01)
          : Math.floor(safeAmount);
      points.value += earned;
      return earned;
    };

    const deductPoints = (usedPoints: number): void => {
      const safeUsed = Math.max(0, Math.floor(usedPoints));
      points.value = Math.max(0, points.value - safeUsed);
    };

    const increaseSignInCount = (date: string): void => {
      totalSignInCount.value += 1;
      lastSignInDate.value = date;
    };

    const addConsumption = (actualPaidAmount: number): void => {
      const safeAmount = Math.max(0, actualPaidAmount);
      dailyConsumption.value += safeAmount;
      weeklyConsumption.value += safeAmount;
      monthlyConsumption.value += safeAmount;
    };

    const resetConsumptionByType = (type: RedPacketType): void => {
      if (type === 'daily') {
        dailyConsumption.value = 0;
      } else if (type === 'weekly') {
        weeklyConsumption.value = 0;
      } else {
        monthlyConsumption.value = 0;
      }
    };

    const setRedPacketClaimedLevels = (
      type: RedPacketType,
      levels: number[],
    ): void => {
      redPacketClaimedLevels.value = {
        ...redPacketClaimedLevels.value,
        [type]: [...levels],
      };
    };

    const markRedPacketLevelClaimed = (
      type: RedPacketType,
      level: number,
    ): void => {
      const currentLevels = redPacketClaimedLevels.value[type];
      if (currentLevels.includes(level)) {
        return;
      }
      setRedPacketClaimedLevels(
        type,
        [...currentLevels, level].sort((a, b) => a - b),
      );
    };

    const setRedPacketResetKey = (type: RedPacketType, key: string): void => {
      lastRedPacketReset.value = {
        ...lastRedPacketReset.value,
        [type]: key,
      };
    };

    return {
      token,
      userInfo,
      points,
      totalSignInCount,
      dailyConsumption,
      weeklyConsumption,
      monthlyConsumption,
      lastSignInDate,
      redPacketClaimedLevels,
      lastRedPacketReset,
      isLoading,
      error,
      isLoggedIn,
      login,
      logout,
      fetchUserInfo,
      addPoints,
      deductPoints,
      increaseSignInCount,
      addConsumption,
      resetConsumptionByType,
      setRedPacketClaimedLevels,
      markRedPacketLevelClaimed,
      setRedPacketResetKey,
    };
  },
  {
    persist: {
      key: 'user-store',
      storage: localStorage,
      pick: [
        'token',
        'userInfo',
        'points',
        'totalSignInCount',
        'dailyConsumption',
        'weeklyConsumption',
        'monthlyConsumption',
        'lastSignInDate',
        'redPacketClaimedLevels',
        'lastRedPacketReset',
      ],
    },
  },
);
