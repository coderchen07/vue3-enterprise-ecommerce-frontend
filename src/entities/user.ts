/**
 * 用户领域实体（与后端用户资源字段对齐的 MVP 定义）
 */
export interface User {
  id: string;
  phone: string;
  nickname: string;
  avatar: string;
  token?: string;
}
