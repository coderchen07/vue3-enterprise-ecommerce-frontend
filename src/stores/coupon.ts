import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import {
  CouponStatus,
  type Coupon,
  type CouponTemplate,
} from '@/entities/coupon';

const isExpired = (coupon: Pick<Coupon, 'validTo'>): boolean =>
  new Date(coupon.validTo).getTime() < Date.now();
const getTodayKey = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const useCouponStore = defineStore(
  'coupon',
  () => {
    const coupons = ref<Coupon[]>([]);

    const normalizedCoupons = computed<Coupon[]>(() =>
      coupons.value.map((coupon) => {
        if (coupon.status === CouponStatus.Used) {
          return coupon;
        }
        if (isExpired(coupon)) {
          return {
            ...coupon,
            status: CouponStatus.Expired,
          };
        }
        return coupon;
      }),
    );

    const checkAndResetDailyCoupons = (): void => {
      const todayKey = getTodayKey();
      coupons.value = coupons.value.map((coupon) => {
        if (coupon.status !== CouponStatus.Claimed) {
          return coupon;
        }
        if (!coupon.lastClaimDate || coupon.lastClaimDate === todayKey) {
          return coupon;
        }
        if (isExpired(coupon)) {
          return coupon;
        }
        return {
          ...coupon,
          status: CouponStatus.Unused,
          lastClaimDate: '',
        };
      });
    };

    const canClaimCoupon = (template: CouponTemplate): boolean => {
      const coupon = coupons.value.find((item) => item.id === template.id);
      if (!coupon) {
        return !isExpired(template);
      }
      if (coupon.status === CouponStatus.Used) {
        return false;
      }
      if (isExpired(coupon)) {
        return false;
      }
      if (
        coupon.status === CouponStatus.Claimed &&
        coupon.lastClaimDate === getTodayKey()
      ) {
        return false;
      }
      return true;
    };

    const claimCoupon = (template: CouponTemplate): boolean => {
      const todayKey = getTodayKey();
      const index = coupons.value.findIndex(
        (coupon) => coupon.id === template.id,
      );
      if (index < 0) {
        if (isExpired(template)) {
          return false;
        }
        coupons.value.unshift({
          ...template,
          status: CouponStatus.Claimed,
          claimedAt: new Date().toISOString(),
          lastClaimDate: todayKey,
        });
        return true;
      }

      const currentCoupon = coupons.value[index];
      if (!canClaimCoupon(template)) {
        return false;
      }

      coupons.value[index] = {
        ...currentCoupon,
        ...template,
        status: CouponStatus.Claimed,
        claimedAt: new Date().toISOString(),
        lastClaimDate: todayKey,
      };
      return true;
    };

    const markCouponUsed = (id: string): void => {
      const index = coupons.value.findIndex((coupon) => coupon.id === id);
      if (index < 0) {
        return;
      }
      coupons.value[index] = {
        ...coupons.value[index],
        status: CouponStatus.Used,
        usedAt: new Date().toISOString(),
      };
    };

    const useCoupon = (id: string): void => {
      markCouponUsed(id);
    };

    const hasClaimed = (id: string): boolean =>
      normalizedCoupons.value.some(
        (coupon) => coupon.id === id && coupon.status === CouponStatus.Claimed,
      );
    const hasClaimedToday = (id: string): boolean =>
      coupons.value.some(
        (coupon) =>
          coupon.id === id &&
          coupon.status === CouponStatus.Claimed &&
          coupon.lastClaimDate === getTodayKey(),
      );
    const unusedCouponCount = computed<number>(
      () =>
        normalizedCoupons.value.filter(
          (coupon) => coupon.status === CouponStatus.Claimed,
        ).length,
    );

    return {
      coupons,
      normalizedCoupons,
      unusedCouponCount,
      checkAndResetDailyCoupons,
      canClaimCoupon,
      claimCoupon,
      markCouponUsed,
      useCoupon,
      hasClaimed,
      hasClaimedToday,
    };
  },
  {
    persist: {
      key: 'coupon-store',
      storage: localStorage,
      pick: ['coupons'],
    },
  },
);
