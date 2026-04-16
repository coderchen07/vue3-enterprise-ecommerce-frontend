# 架构设计

## 1. 架构目标

项目定位为 Vue 3 企业级电商前端平台，核心目标是：

- 在一套业务代码下同时支持 PC 与移动端体验
- 保持交易主链路（浏览 -> 加购 -> 下单 -> 支付状态流转）清晰可维护
- 支撑营销玩法（秒杀/优惠券/签到/红包）与订单、积分体系联动
- 通过工程化规范保证团队协作效率与代码一致性

## 2. 总体架构概览

项目基于 **Feature-Sliced Design（FSD）** 组织，按业务职责分层，并结合组件化和状态中心化管理。

```text
src/
  app/        # 应用入口、路由、全局初始化
  pages/      # 页面级路由容器
  widgets/    # 布局与复合展示模块
  features/   # 可复用业务能力（composables + 业务组件）
  entities/   # 领域实体与类型定义
  stores/     # Pinia 全局状态仓库
  shared/     # 通用 API、组件、常量、工具与 mock 数据
```

## 3. 分层职责说明

### `app/`（应用壳层）

- 负责应用启动、插件注入、路由装配和全局守卫。
- `router/index.ts` 统一声明页面路由、`meta` 信息（`requiresAuth`、`hideTabbar`、`title`）和鉴权跳转策略。
- 不承载具体业务实现，聚焦“装配与编排”。

### `pages/`（页面层）

- 承接路由页面，是业务流程入口。
- 典型页面包括：`products`、`product/[id]`、`cart`、`order/checkout`、`order/list`、`order/detail`、`user`、`user/address`、`seckill`、`coupon` 等。
- 页面层负责组合 `features`、`widgets`、`stores`，不沉淀跨页面通用业务逻辑。

### `widgets/`（组合层）

- 提供页面级布局和复合 UI。
- 当前以 `PcLayout` 与 `MobileLayout` 为核心，配合 `App.vue` 中的媒体查询实现双端动态切换。

### `features/`（业务能力层）

- 组织“可复用且有明确业务语义”的能力单元。
- 典型模块：
  - `product`：商品列表与筛选、SKU 选择等
  - `coupon` / `seckill`：营销规则与展示逻辑
  - `signin` / `redpacket`：签到与红包积分规则
  - `user`：地址选择/地址卡片等业务组件

### `entities/`（领域模型层）

- 定义稳定的业务实体与类型（`product`、`cart`、`order`、`user`、`coupon`、`seckill`、`address`）。
- 为 `stores`、`features`、`pages` 提供统一数据结构约束。

### `stores/`（状态层）

- 基于 Pinia 管理跨页面状态，并通过 `pinia-plugin-persistedstate` 做本地持久化。
- 当前核心仓库：
  - `user`：登录态、积分、签到、红包消费统计与领取状态
  - `cart`：购物车条目、勾选状态、金额汇总
  - `order`：订单创建、状态流转、支付后积分发放
  - `coupon`：领券、状态更新（未使用/已使用/过期）
  - `address`：收货地址 CRUD 与默认地址
  - `app`：应用级状态

### `shared/`（共享基础层）

- 包含跨域复用能力：统一请求封装、API 模块、通用组件、常量与 mock 数据。
- `shared/api/request.ts` 提供 Axios 实例及拦截逻辑。
- `shared/api/modules/*` 以业务模块方式封装接口调用。

## 4. 双端 UI 架构

项目采用“**同一路由 + 双布局容器**”策略：

1. `App.vue` 通过 `@vueuse/core` 的 `useMediaQuery('(min-width: 1024px)')` 判定端类型。
2. 桌面端渲染 `PcLayout`（Element Plus 交互体系）。
3. 移动端渲染 `MobileLayout`（Vant 交互体系）。
4. 业务页面复用同一套数据逻辑，按端侧提供差异化展示。

该方案保证了业务逻辑统一，同时保留端侧体验最佳实践。

## 5. 路由与鉴权设计

### 路由组织

- 路由集中于 `app/router/index.ts`，按业务域扁平声明。
- 使用 `meta.requiresAuth` 控制访问权限。
- 使用 `meta.hideTabbar` 控制移动端底部导航显隐（如商品详情、订单详情、地址编辑等页面）。

### 登录重定向策略

- 未登录访问受保护页面时，记录目标路径到 `sessionStorage`。
- 跳转登录后，登录成功按记录路径回跳；无记录则回首页。
- 从登录页二次回退到受保护页面时，兜底回首页，避免路由死循环。

## 6. 数据流与状态流

典型交互链路遵循单向数据流：

1. 页面触发用户操作（筛选、加购、提交订单等）。
2. 调用 `features` composable 或 `store` action 处理业务规则。
3. 由 `shared/api/modules` 或本地 mock 返回数据。
4. `store` 更新全局状态并持久化。
5. 页面通过 `computed` / `storeToRefs` 自动响应更新。

订单与营销联动示例：

- 结算页选择优惠券和积分抵扣后创建订单。
- 支付动作在 `order` store 中推进订单状态，并触发积分发放。
- 红包与签到积分直接进入 `user` store，消费额度驱动红包档位解锁。

## 7. API 与 Mock 架构

- API 客户端基于 Axios 统一封装，处理基础 URL、超时、响应错误等通用逻辑。
- 本地开发支持 mock 数据与 mock 路由，保障前后端并行开发效率。
- 商品、订单、用户、购物车等接口按模块拆分到 `shared/api/modules`，降低页面耦合度。

## 8. 关键业务模块架构要点

### 商品域

- 商品列表支持类目、价格、品牌、标签筛选，PC 端采用“草稿筛选 + 应用筛选”模型。
- 商品详情页统一通过 `ProductSkuSelector` 完成规格与数量确认，再分流到“加购/立即购买”。

### 订单域

- 订单结构包含商品快照、地址、优惠券、积分抵扣信息。
- 状态流转清晰，支付行为与积分发放时机解耦，避免下单即赠分。

### 用户与地址域

- 地址管理与结算页强联动，支持默认地址与快速新增。
- 用户中心聚合订单入口、积分、优惠券数量等关键运营数据。

### 营销域

- 秒杀：每日种子稳定抽样 + 折扣计算 + 倒计时展示。
- 优惠券：按类目和门槛判断可用性，结算后核销。
- 签到/红包：按自然日与周月周期控制资格与重置。

## 9. 工程化与质量保障

- 代码规范：ESLint + Prettier
- 提交规范：Commitlint（Conventional Commits）
- 提交拦截：Husky + lint-staged
- AI 规则：`.cursor/rules/vue3-coding-standards.mdc`

通过以上机制，确保功能迭代速度与代码质量可同时维持在可控范围。
