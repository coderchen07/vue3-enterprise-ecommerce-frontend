import {
  createRouter,
  createWebHistory,
  type RouteLocationNormalized,
} from 'vue-router';
import { useUserStore } from '@/stores/user';
import { LOGIN_REDIRECT_STORAGE_KEY } from '@/shared/constants/auth';

const LOGIN_PATH = '/login';
const HOME_PATH = '/products';

const requiresAuth = (to: RouteLocationNormalized): boolean =>
  Boolean(to.matched.some((record) => record.meta.requiresAuth));

const saveRedirectPath = (path: string): void => {
  try {
    sessionStorage.setItem(LOGIN_REDIRECT_STORAGE_KEY, path);
  } catch {
    // ignore storage exceptions
  }
};

const readRedirectPath = (): string | null => {
  try {
    const path = sessionStorage.getItem(LOGIN_REDIRECT_STORAGE_KEY);
    return path && path.startsWith('/') ? path : null;
  } catch {
    return null;
  }
};

const clearRedirectPath = (): void => {
  try {
    sessionStorage.removeItem(LOGIN_REDIRECT_STORAGE_KEY);
  } catch {
    // ignore storage exceptions
  }
};

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: HOME_PATH,
    },
    {
      path: '/products',
      component: () => import('@/pages/products/index.vue'),
      meta: {
        title: '首页',
      },
    },
    {
      path: '/seckill',
      component: () => import('@/pages/seckill/index.vue'),
      meta: {
        title: '秒杀',
      },
    },
    {
      path: '/coupon',
      component: () => import('@/pages/coupon/index.vue'),
      meta: {
        title: '优惠券',
        requiresAuth: true,
      },
    },
    {
      path: '/cart',
      component: () => import('@/pages/cart/index.vue'),
      meta: {
        title: '购物车',
        requiresAuth: true,
      },
    },
    {
      path: '/user',
      component: () => import('@/pages/user/index.vue'),
      meta: {
        title: '个人中心',
        requiresAuth: true,
      },
    },
    {
      path: '/user/address',
      component: () => import('@/pages/user/address/index.vue'),
      meta: {
        title: '收货地址',
        requiresAuth: true,
        hideTabbar: true,
      },
    },
    {
      path: '/user/address/edit',
      component: () => import('@/pages/user/address/edit.vue'),
      meta: {
        title: '新增收货地址',
        requiresAuth: true,
        hideTabbar: true,
      },
    },
    {
      path: '/user/address/edit/:id',
      component: () => import('@/pages/user/address/edit.vue'),
      meta: {
        title: '编辑收货地址',
        requiresAuth: true,
        hideTabbar: true,
      },
    },
    {
      path: '/search',
      component: () => import('@/pages/search/index.vue'),
      meta: {
        title: '搜索商品',
        hideTabbar: true,
      },
    },
    {
      path: '/product/:id',
      component: () => import('@/pages/product/[id].vue'),
      meta: {
        title: '商品详情',
        hideTabbar: true,
      },
    },
    {
      path: '/order/checkout',
      component: () => import('@/pages/order/checkout.vue'),
      meta: {
        title: '确认订单',
        requiresAuth: true,
      },
    },
    {
      path: '/order/list',
      component: () => import('@/pages/order/list.vue'),
      meta: {
        title: '我的订单',
        requiresAuth: true,
        hideTabbar: true,
      },
    },
    {
      path: '/order/detail/:id',
      component: () => import('@/pages/order/detail.vue'),
      meta: {
        title: '订单详情',
        requiresAuth: true,
        hideTabbar: true,
      },
    },
    {
      path: '/login',
      component: () => import('@/pages/login/index.vue'),
      meta: {
        title: '登录',
      },
    },
  ],
});

router.beforeEach((to, from) => {
  const userStore = useUserStore();
  const token = userStore.token;
  const isLoggedIn = Boolean(token);

  if (requiresAuth(to) && !isLoggedIn) {
    if (from.path === LOGIN_PATH) {
      return {
        path: HOME_PATH,
        replace: true,
      };
    }

    saveRedirectPath(to.fullPath);
    return {
      path: LOGIN_PATH,
    };
  }

  if (to.path === LOGIN_PATH && isLoggedIn) {
    const redirectPath = readRedirectPath() ?? HOME_PATH;
    clearRedirectPath();
    return redirectPath;
  }

  return true;
});

export { router };
export default router;
