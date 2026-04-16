import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { showToast } from 'vant';
import type { Router } from 'vue-router';

type Nullable<T> = T | null;

interface UserStoreLike {
  token?: string;
  clearToken?: () => void;
  logout?: () => Promise<void> | void;
  setToken?: (token: string) => void;
}

interface ApiEnvelope<T> {
  code?: number;
  message?: string;
  msg?: string;
  data?: T;
}

const TOKEN_STORAGE_KEY = 'token';
const UNAUTHORIZED_STATUS_CODE = 401;

const request: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
});

const getCurrentFullPath = (): string => {
  if (typeof window === 'undefined') {
    return '/';
  }

  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
};

const getLocalToken = (): string => {
  if (typeof window === 'undefined') {
    return '';
  }

  return localStorage.getItem(TOKEN_STORAGE_KEY) ?? '';
};

const clearLocalToken = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

const resolveUserStore = async (): Promise<Nullable<UserStoreLike>> => {
  try {
    const module = await import('@/stores/user');
    if (typeof module.useUserStore === 'function') {
      return module.useUserStore() as UserStoreLike;
    }
  } catch {
    // ignore dynamic import failure; request module should stay usable
  }

  return null;
};

const resolveRouter = async (): Promise<Nullable<Router>> => {
  try {
    const module = await import('@/app/router');
    return (module.default ?? module.router ?? null) as Nullable<Router>;
  } catch {
    return null;
  }
};

const resolveToken = async (): Promise<string> => {
  const userStore = await resolveUserStore();
  return userStore?.token ?? getLocalToken();
};

const handleUnauthorized = async (): Promise<void> => {
  const userStore = await resolveUserStore();

  try {
    if (typeof userStore?.logout === 'function') {
      await userStore.logout();
    } else if (typeof userStore?.clearToken === 'function') {
      userStore.clearToken();
    } else if (typeof userStore?.setToken === 'function') {
      userStore.setToken('');
    }
  } finally {
    clearLocalToken();
  }

  const redirect = encodeURIComponent(getCurrentFullPath());
  const targetPath = `/login?redirect=${redirect}`;
  const router = await resolveRouter();

  if (router) {
    await router.push(targetPath);
    return;
  }

  if (typeof window !== 'undefined') {
    window.location.href = targetPath;
  }
};

request.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await resolveToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

request.interceptors.response.use(
  (response: AxiosResponse<ApiEnvelope<unknown>>) => {
    const payload = response.data;

    if (
      payload &&
      typeof payload === 'object' &&
      'code' in payload &&
      payload.code !== undefined
    ) {
      if (payload.code !== 0) {
        const message = payload.message || payload.msg || '请求失败';
        showToast(message);
        return Promise.reject(new Error(message));
      }
      return {
        ...response,
        data: payload.data,
      };
    }

    return response;
  },
  async (error: AxiosError<ApiEnvelope<unknown>>) => {
    const statusCode = error.response?.status;
    const serverMessage =
      error.response?.data?.message ?? error.response?.data?.msg;
    const message = serverMessage || error.message || '网络异常，请稍后重试';

    showToast(message);

    if (statusCode === UNAUTHORIZED_STATUS_CODE) {
      await handleUnauthorized();
    }

    return Promise.reject(error);
  },
);

const get = <T>(
  url: string,
  params?: AxiosRequestConfig['params'],
): Promise<T> =>
  request
    .get<T, AxiosResponse<T>>(url, { params })
    .then((response) => response.data);

const post = <T>(url: string, data?: unknown): Promise<T> =>
  request
    .post<T, AxiosResponse<T>>(url, data)
    .then((response) => response.data);

const put = <T>(url: string, data?: unknown): Promise<T> =>
  request.put<T, AxiosResponse<T>>(url, data).then((response) => response.data);

const del = <T>(
  url: string,
  params?: AxiosRequestConfig['params'],
): Promise<T> =>
  request
    .delete<T, AxiosResponse<T>>(url, { params })
    .then((response) => response.data);

export { request, get, post, put, del as delete };
