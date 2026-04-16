import type { User } from '@/entities/user';
import { get, post, put } from '@/shared/api/request';

export interface LoginPayload {
  phone: string;
  password: string;
}

export interface SendCodePayload {
  phone: string;
}

export interface LoginResult {
  token: string;
  user: User;
}

export interface UpdateUserProfilePayload {
  nickname?: string;
  avatar?: string;
}

/**
 * 手机号 + 密码登录
 */
export function login(payload: LoginPayload): Promise<LoginResult> {
  return post<LoginResult>('/auth/login', payload);
}

/**
 * 发送短信验证码
 */
export function sendCode(payload: SendCodePayload): Promise<void> {
  return post<void>('/auth/send-code', payload);
}

/**
 * 当前登录用户信息
 */
export function getProfile(): Promise<User> {
  return get<User>('/user/profile');
}

/**
 * 更新当前用户资料
 */
export function updateProfile(
  payload: UpdateUserProfilePayload,
): Promise<User> {
  return put<User>('/user/profile', payload);
}
