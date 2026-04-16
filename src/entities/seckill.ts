import type { Product } from '@/entities/product';

export interface SeckillItem extends Product {
  isSeckill: true;
  seckillPrice: number;
  discountRate: number;
  validFrom: string;
  validTo: string;
}
