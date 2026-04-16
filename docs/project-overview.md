# Vue 3 电商前端平台

## 项目简介

基于 Vue 3 + TypeScript 的企业级电商前端平台，采用 FSD 分层设计，支持移动端与 PC 端双布局、完整交易闭环与营销玩法联动。

## 已实现功能清单

### 商品模块

- [x] 商品列表页（移动端无限滚动 + 下拉刷新）
- [x] 商品详情页（规格选择、加入购物车、立即购买）
- [x] 搜索页（关键词检索）
- [x] PC 端筛选（类目、价格、品牌、属性）
- [x] 类目切换与排序（综合、销量、价格、新品）
- [x] 本地 Mock 商品数据（32 条，含多类目与图片）

### 购物车模块

- [x] 加入购物车、删除、数量调整、勾选状态
- [x] 全选/反选、选中金额实时计算
- [x] PC 表格化购物车 + 移动端卡片购物车
- [x] 秒杀商品标识与价格保留

### 订单模块

- [x] 订单确认页（地址、商品、优惠券、积分抵扣）
- [x] 提交订单（本地持久化）
- [x] 订单列表（按状态筛选）
- [x] 订单详情（状态、地址、金额、时间线）
- [x] 订单状态流转（待付款 -> 待发货 -> 待收货 -> 已完成）
- [x] 模拟支付后积分发放与消费累计

### 用户模块

- [x] 登录与鉴权拦截（路由守卫）
- [x] 个人中心（订单状态、积分、优惠券信息）
- [x] 收货地址管理（新增、编辑、删除、默认地址）
- [x] 地址在结算页选择与联动

### 营销模块

- [x] 秒杀（固定日种子抽取、折扣价、倒计时）
- [x] 优惠券（领券、可用性校验、结算核销）
- [x] 签到（每日一次、动态积分区间）
- [x] 领红包（每日/每周/每月 5 档位，按消费门槛解锁）
- [x] 积分系统（支付获得、结算抵扣、签到与红包奖励）

### 其他能力

- [x] 响应式适配（PC + 移动端双布局）
- [x] 组件化业务面板（签到/红包面板 PC 与移动端复用）
- [x] 本地状态持久化（Pinia persisted state）

## 技术栈（含版本）

### 核心依赖

| 技术 | 版本 |
| --- | --- |
| Vue | `^3.5.32` |
| TypeScript | `~6.0.2` |
| Vite | `^8.0.4` |
| Vue Router | `^5.0.4` |
| Pinia | `^3.0.4` |
| pinia-plugin-persistedstate | `^4.7.1` |
| Vant | `^4.9.24` |
| Element Plus | `^2.13.7` |
| Tailwind CSS | `^4.2.2` |
| @tanstack/vue-query | `^5.99.0` |
| Axios | `^1.15.0` |
| @vueuse/core | `^14.2.1` |

### 工程化与质量工具

| 工具 | 版本 |
| --- | --- |
| ESLint | `^9.39.4` |
| eslint-plugin-vue | `^10.8.0` |
| Prettier | `^3.8.2` |
| Husky | `^9.1.7` |
| lint-staged | `^16.4.0` |
| Commitlint | `^20.5.0` |

## 项目架构

项目基于 **Feature-Sliced Design (FSD)** 思路组织代码，按“业务职责”而非“技术类型”划分目录：

```text
src/
  app/        # 应用入口、路由、全局初始化
  pages/      # 页面级容器（路由页面）
  widgets/    # 页面级布局与复合 UI（PcLayout/MobileLayout）
  features/   # 业务功能模块（商品筛选、签到、红包、优惠券等）
  entities/   # 领域实体与类型定义（product/order/cart/coupon/address 等）
  stores/     # Pinia 状态仓库（user/order/cart/coupon/address/app）
  shared/     # 公共能力（API、数据源、通用组件、常量、工具）
```

## 环境要求与快速启动

### 环境要求

- Node.js：建议 `>=18`（推荐 LTS）
- 包管理器：`npm`

### 安装依赖

```bash
npm install
```

### 启动开发环境

```bash
npm run dev
```

### 构建生产包

```bash
npm run build
```

### 本地预览生产包

```bash
npm run preview
```

### 环境变量

`.env.local` 示例：

```env
VITE_API_BASE_URL=/api
```

> 本项目默认支持本地 mock API 场景，`VITE_API_BASE_URL` 可按后端联调环境调整。

## 开发规范

### 代码规范

- ESLint：`eslint.config.js`
- Prettier：`.prettierrc`
- 命令：

```bash
npm run lint
npm run lint:fix
npm run format
```

### 提交规范

- Conventional Commits（`@commitlint/config-conventional`）
- 配置文件：`commitlint.config.js`

### Git Hooks

- Husky + lint-staged 已启用
- 关键 Hook：
  - `.husky/pre-commit`：提交前代码检查与格式化
  - `.husky/commit-msg`：提交信息规范校验

### AI 协作规范

- 项目内规则文件：`.cursor/rules/vue3-coding-standards.mdc`

## 项目亮点

- 一套代码同时支持 PC/移动端差异化体验
- 营销玩法（秒杀/优惠券/签到/红包）与订单、积分系统深度联动
- Mock 数据与业务逻辑解耦，便于后续平滑切换真实后端接口

## 相关文档

- 展示版 README：[../README.md](../README.md)
- 架构说明：[./architecture.md](./architecture.md)
- 脚手架约定：[./scaffolding-convention.md](./scaffolding-convention.md)
