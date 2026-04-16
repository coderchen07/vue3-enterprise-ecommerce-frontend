import { computed } from 'vue';
import { useUserStore } from '@/stores/user';

const getTodayKey = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const useSignIn = () => {
  const userStore = useUserStore();

  const getSignInRange = (): [number, number] => {
    const count = userStore.totalSignInCount;
    const min = Math.min(15, 1 + Math.floor(count / 4));
    const max = Math.min(30, 3 + Math.floor(count / 2));
    return [min, max];
  };

  const hasSignedToday = (): boolean =>
    userStore.lastSignInDate === getTodayKey();

  const canSignIn = (): boolean => !hasSignedToday();

  const signIn = (): { earnedPoints: number; totalSignInCount: number } => {
    if (!canSignIn()) {
      return {
        earnedPoints: 0,
        totalSignInCount: userStore.totalSignInCount,
      };
    }
    const [min, max] = getSignInRange();
    const earnedPoints = Math.floor(Math.random() * (max - min + 1)) + min;
    userStore.addPoints(earnedPoints, 'direct');
    userStore.increaseSignInCount(getTodayKey());
    return {
      earnedPoints,
      totalSignInCount: userStore.totalSignInCount,
    };
  };

  return {
    hasSignedToday,
    canSignIn,
    signIn,
    getSignInRange,
    totalSignInCount: computed(() => userStore.totalSignInCount),
  };
};
