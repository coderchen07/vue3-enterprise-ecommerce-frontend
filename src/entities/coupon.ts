import type { ProductCategory } from '@/entities/product';

export type CouponCategory = 'all' | ProductCategory;

export const CouponStatus = {
  Claimed: 'claimed',
  Unused: 'unused',
  Used: 'used',
  Expired: 'expired',
} as const;
export type CouponStatus = (typeof CouponStatus)[keyof typeof CouponStatus];

export interface CouponTemplate {
  id: string;
  name: string;
  category: CouponCategory;
  threshold: number;
  discount: number;
  validFrom: string;
  validTo: string;
}

export interface Coupon extends CouponTemplate {
  status: CouponStatus;
  claimedAt: string;
  lastClaimDate?: string;
  usedAt?: string;
}
