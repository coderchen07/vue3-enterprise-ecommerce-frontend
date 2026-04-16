import { computed } from 'vue';
import {
  CouponStatus,
  type Coupon,
  type CouponCategory,
  type CouponTemplate,
} from '@/entities/coupon';
import type { CartItem } from '@/entities/cart';
import { mockProducts } from '@/shared/data/products.mock';
import { useCouponStore } from '@/stores/coupon';

interface CategoryRule {
  category: CouponCategory;
  categoryName: string;
  rules: Array<{ threshold: number; discount: number }>;
}

const categoryRules: CategoryRule[] = [
  {
    category: 'all',
    categoryName: '全品类',
    rules: [
      { threshold: 300, discount: 30 },
      { threshold: 800, discount: 100 },
      { threshold: 1500, discount: 200 },
    ],
  },
  {
    category: 'digital',
    categoryName: '数码家电',
    rules: [
      { threshold: 1000, discount: 100 },
      { threshold: 2000, discount: 200 },
      { threshold: 5000, discount: 500 },
    ],
  },
  {
    category: 'fashion',
    categoryName: '服饰鞋包',
    rules: [
      { threshold: 200, discount: 20 },
      { threshold: 500, discount: 60 },
      { threshold: 1000, discount: 120 },
    ],
  },
  {
    category: 'food',
    categoryName: '食品生鲜',
    rules: [
      { threshold: 50, discount: 10 },
      { threshold: 100, discount: 25 },
      { threshold: 200, discount: 50 },
    ],
  },
  {
    category: 'home',
    categoryName: '家居百货',
    rules: [
      { threshold: 100, discount: 15 },
      { threshold: 300, discount: 50 },
      { threshold: 600, discount: 100 },
    ],
  },
];

const dayToISOString = (days: number): string =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
const isTemplateExpired = (
  template: Pick<CouponTemplate, 'validTo'>,
): boolean => new Date(template.validTo).getTime() < Date.now();

const couponTemplates: CouponTemplate[] = categoryRules.flatMap((config) =>
  config.rules.map((rule, index) => ({
    id: `coupon-${config.category}-${index + 1}`,
    name: `${config.categoryName}满${rule.threshold}减${rule.discount}`,
    category: config.category,
    threshold: rule.threshold,
    discount: rule.discount,
    validFrom: new Date().toISOString(),
    validTo: dayToISOString(7 + index * 3),
  })),
);

const productCategoryMap = new Map(
  mockProducts.map((product) => [product.id, product.category]),
);

const getCategorySubtotal = (
  items: CartItem[],
  couponCategory: CouponCategory,
): number => {
  if (couponCategory === 'all') {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
  return items.reduce((sum, item) => {
    const itemCategory = productCategoryMap.get(item.productId);
    if (itemCategory !== couponCategory) {
      return sum;
    }
    return sum + item.price * item.quantity;
  }, 0);
};

const isCouponAvailableForOrder = (
  coupon: Coupon,
  items: CartItem[],
  totalAmount: number,
): boolean => {
  if (coupon.status !== CouponStatus.Claimed) {
    return false;
  }
  if (new Date(coupon.validTo).getTime() < Date.now()) {
    return false;
  }
  const matchedSubtotal =
    coupon.category === 'all'
      ? totalAmount
      : getCategorySubtotal(items, coupon.category);
  if (matchedSubtotal < coupon.threshold) {
    return false;
  }
  return true;
};

export const useCoupon = () => {
  const couponStore = useCouponStore();

  const templates = computed<CouponTemplate[]>(() => couponTemplates);

  const couponsByStatus = computed<Record<CouponStatus, Coupon[]>>(() => ({
    [CouponStatus.Claimed]: couponStore.normalizedCoupons.filter(
      (coupon) => coupon.status === CouponStatus.Claimed,
    ),
    [CouponStatus.Unused]: couponStore.normalizedCoupons.filter(
      (coupon) => coupon.status === CouponStatus.Unused,
    ),
    [CouponStatus.Used]: couponStore.normalizedCoupons.filter(
      (coupon) => coupon.status === CouponStatus.Used,
    ),
    [CouponStatus.Expired]: couponStore.normalizedCoupons.filter(
      (coupon) => coupon.status === CouponStatus.Expired,
    ),
  }));

  const getAvailableCouponsForOrder = (
    items: CartItem[],
    totalAmount: number,
  ): Coupon[] =>
    couponStore.normalizedCoupons.filter((coupon) =>
      isCouponAvailableForOrder(coupon, items, totalAmount),
    );

  const getTemplateStatus = (template: CouponTemplate): CouponStatus => {
    const coupon = couponStore.normalizedCoupons.find(
      (item) => item.id === template.id,
    );
    if (coupon) {
      return coupon.status;
    }
    return isTemplateExpired(template)
      ? CouponStatus.Expired
      : CouponStatus.Unused;
  };

  const canClaimTemplate = (template: CouponTemplate): boolean =>
    couponStore.canClaimCoupon(template);

  return {
    templates,
    couponsByStatus,
    isCouponAvailableForOrder,
    getAvailableCouponsForOrder,
    getTemplateStatus,
    canClaimTemplate,
  };
};
