import type { Product, ProductCategory } from '@/entities/product';

interface ProductSeed {
  name: string;
  desc: string;
  price: number;
  originalPrice?: number;
  sales: number;
  stock: number;
}

const categoryMeta: Record<
  ProductCategory,
  { categoryName: string; prefix: string }
> = {
  digital: { categoryName: '数码家电', prefix: 'shuma' },
  fashion: { categoryName: '服饰鞋包', prefix: 'fushi' },
  food: { categoryName: '食品生鲜', prefix: 'shipin' },
  home: { categoryName: '家居百货', prefix: 'jiaju' },
};

const brandMap: Record<ProductCategory, string[]> = {
  digital: ['华为', '小米', '苹果'],
  fashion: ['优衣库', 'Nike', 'Adidas'],
  food: ['三只松鼠', '良品铺子', '蒙牛'],
  home: ['宜家', '无印良品', '南极人'],
};

const createTags = (seedIndex: number): string[] => {
  const tags: string[] = [];
  // 包邮概率高
  if (seedIndex % 5 !== 0) {
    tags.push('包邮');
  }
  // 7 天无理由中概率
  if (seedIndex % 3 !== 0) {
    tags.push('7天无理由');
  }
  // 官方自营低概率
  if (seedIndex % 4 === 0) {
    tags.push('官方自营');
  }
  return tags;
};

const imageUrl = (filename: string): string =>
  new URL(`../../assets/images/products/${filename}`, import.meta.url).href;

const buildCategoryProducts = (
  category: ProductCategory,
  seeds: ProductSeed[],
  startIndex: number,
): Product[] => {
  const { categoryName, prefix } = categoryMeta[category];
  const brands = brandMap[category];
  return seeds.map((seed, offset) => {
    const index = offset + 1;
    const id = String(startIndex + offset);
    const main = `${prefix}-${index}.jpg`;
    return {
      id,
      name: seed.name,
      category,
      categoryName,
      brand: brands[offset % brands.length],
      tags: createTags(offset + startIndex),
      desc: seed.desc,
      price: seed.price,
      originalPrice: seed.originalPrice,
      mainImage: imageUrl(main),
      images: [imageUrl(main)],
      stock: seed.stock,
      sales: seed.sales,
      skus: [
        {
          id: `${id}-s1`,
          name: '标准款',
          price: seed.price,
          stock: seed.stock,
        },
        {
          id: `${id}-s2`,
          name: '升级款',
          price: seed.price + 60,
          stock: Math.max(10, Math.floor(seed.stock * 0.6)),
        },
      ],
    };
  });
};

const digitalSeeds: ProductSeed[] = [
  {
    name: '旗舰智能手机 X12',
    desc: '高刷直屏与长续航兼顾，日常与游戏都流畅。',
    price: 3999,
    originalPrice: 4599,
    sales: 5280,
    stock: 188,
  },
  {
    name: '轻薄办公笔记本 Air 14',
    desc: '14 英寸便携机身，适合移动办公与学习。',
    price: 4899,
    originalPrice: 5299,
    sales: 2176,
    stock: 133,
  },
  {
    name: '降噪无线耳机 Pro',
    desc: '主动降噪与通透模式一键切换，通勤更安静。',
    price: 599,
    originalPrice: 799,
    sales: 8932,
    stock: 356,
  },
  {
    name: '运动智能手表 S3',
    desc: '全天心率与睡眠监测，支持多种运动模式。',
    price: 899,
    originalPrice: 1099,
    sales: 4760,
    stock: 402,
  },
  {
    name: '高性能平板 11 英寸',
    desc: '2.5K 屏幕，追剧学习与轻办公体验更佳。',
    price: 2599,
    originalPrice: 2999,
    sales: 2310,
    stock: 147,
  },
  {
    name: '便携蓝牙音箱 Mini',
    desc: '立体声外放，户外露营也能保持高音质。',
    price: 299,
    originalPrice: 399,
    sales: 6542,
    stock: 468,
  },
  {
    name: '22.5W 快充充电宝',
    desc: '大容量便携设计，支持多协议快充。',
    price: 129,
    originalPrice: 169,
    sales: 7821,
    stock: 520,
  },
  {
    name: '微单相机 C50',
    desc: '高像素与高速连拍，记录旅行生活更清晰。',
    price: 5599,
    originalPrice: 5999,
    sales: 1128,
    stock: 95,
  },
];

const fashionSeeds: ProductSeed[] = [
  {
    name: '纯棉基础短袖 T 恤',
    desc: '亲肤面料，通勤休闲百搭款。',
    price: 79,
    originalPrice: 129,
    sales: 9312,
    stock: 620,
  },
  {
    name: '修身弹力牛仔裤',
    desc: '立体剪裁，日常穿着舒适耐看。',
    price: 169,
    originalPrice: 239,
    sales: 5186,
    stock: 332,
  },
  {
    name: '透气缓震跑步鞋',
    desc: '轻质鞋底回弹出色，运动更省力。',
    price: 359,
    originalPrice: 499,
    sales: 4670,
    stock: 287,
  },
  {
    name: '法式收腰连衣裙',
    desc: '简约优雅版型，通勤约会都合适。',
    price: 269,
    originalPrice: 369,
    sales: 2408,
    stock: 210,
  },
  {
    name: '轻量双肩通勤包',
    desc: '多隔层收纳，电脑与日常用品轻松分区。',
    price: 199,
    originalPrice: 289,
    sales: 3580,
    stock: 264,
  },
  {
    name: '保暖连帽羽绒服',
    desc: '防风面料搭配蓬松填充，冬季更保暖。',
    price: 599,
    originalPrice: 699,
    sales: 1876,
    stock: 156,
  },
  {
    name: '宽松加绒连帽卫衣',
    desc: '柔软加绒内里，秋冬穿搭舒适有型。',
    price: 149,
    originalPrice: 219,
    sales: 5421,
    stock: 408,
  },
  {
    name: '商务真皮系带皮鞋',
    desc: '经典鞋型，适配多种正式场景。',
    price: 429,
    originalPrice: 569,
    sales: 1982,
    stock: 143,
  },
];

const foodSeeds: ProductSeed[] = [
  {
    name: '每日坚果礼盒 30 包',
    desc: '多种坚果科学配比，营养补给更方便。',
    price: 99,
    originalPrice: 139,
    sales: 7301,
    stock: 680,
  },
  {
    name: '黑巧克力臻选装',
    desc: '可可香浓，甜度适中，口感层次丰富。',
    price: 69,
    originalPrice: 99,
    sales: 4962,
    stock: 540,
  },
  {
    name: '有机纯牛奶 24 盒',
    desc: '高品质奶源，早餐搭配更健康。',
    price: 89,
    originalPrice: 119,
    sales: 6820,
    stock: 710,
  },
  {
    name: '当季新鲜水果礼篮',
    desc: '多种水果组合，现采现发更安心。',
    price: 129,
    originalPrice: 169,
    sales: 3620,
    stock: 256,
  },
  {
    name: '原切牛排家庭装',
    desc: '精选谷饲牛肉，煎烤口感鲜嫩多汁。',
    price: 239,
    originalPrice: 299,
    sales: 2188,
    stock: 180,
  },
  {
    name: '深海海鲜礼包',
    desc: '多品类海鲜组合，冷链配送到家。',
    price: 329,
    originalPrice: 399,
    sales: 1420,
    stock: 126,
  },
  {
    name: '百花蜂蜜 1kg',
    desc: '自然花香口感，冲饮烘焙都适合。',
    price: 59,
    originalPrice: 89,
    sales: 5142,
    stock: 460,
  },
  {
    name: '进口干红葡萄酒',
    desc: '果香浓郁，适合聚餐与节日送礼。',
    price: 189,
    originalPrice: 259,
    sales: 1866,
    stock: 212,
  },
];

const homeSeeds: ProductSeed[] = [
  {
    name: '全棉床上四件套',
    desc: '柔软亲肤面料，四季通用舒适透气。',
    price: 239,
    originalPrice: 329,
    sales: 3502,
    stock: 266,
  },
  {
    name: '护眼书桌台灯',
    desc: '无可视频闪光源，亮度多档可调。',
    price: 129,
    originalPrice: 189,
    sales: 4808,
    stock: 388,
  },
  {
    name: '多功能收纳盒组合',
    desc: '模块化收纳，衣物杂物分类更整洁。',
    price: 59,
    originalPrice: 89,
    sales: 7240,
    stock: 602,
  },
  {
    name: '柔软吸水浴巾套装',
    desc: '高密度纤维，吸水快且不易掉毛。',
    price: 99,
    originalPrice: 139,
    sales: 5631,
    stock: 450,
  },
  {
    name: '香薰蜡烛礼盒',
    desc: '淡雅香调，营造轻松治愈家居氛围。',
    price: 79,
    originalPrice: 119,
    sales: 2980,
    stock: 312,
  },
  {
    name: '316 不锈钢保温杯',
    desc: '长效保温，便携防漏，通勤随行。',
    price: 89,
    originalPrice: 129,
    sales: 6486,
    stock: 530,
  },
  {
    name: '家用免手洗拖把',
    desc: '旋转脱水设计，清洁更省力。',
    price: 149,
    originalPrice: 209,
    sales: 3217,
    stock: 275,
  },
  {
    name: '防滑衣架 20 只装',
    desc: '加宽肩部设计，防滑防鼓包。',
    price: 39,
    originalPrice: 69,
    sales: 8110,
    stock: 740,
  },
];

export const mockProducts: Product[] = [
  ...buildCategoryProducts('digital', digitalSeeds, 1),
  ...buildCategoryProducts('fashion', fashionSeeds, 101),
  ...buildCategoryProducts('food', foodSeeds, 201),
  ...buildCategoryProducts('home', homeSeeds, 301),
];
