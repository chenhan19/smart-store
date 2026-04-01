# 智慧店铺微信小程序

基于 **Taro + Express + MySQL** 的 Monorepo 项目，支持扫码入库/出库、多店铺管理和数据统计。

## 项目结构

```
smart-shop/
├── packages/
│   ├── shared/      # 共享类型定义与工具函数
│   ├── server/      # Express 后端 API 服务
│   └── miniapp/     # Taro 微信小程序
├── docker-compose.yml      # 生产部署
├── docker-compose.dev.yml  # 本地调试
├── .env.example            # 环境变量模板
└── package.json
```

## 技术栈

- 前端：Taro 3.x（微信小程序）+ Zustand
- 后端：Express + TypeScript + Sequelize ORM
- 数据库：MySQL 8.0
- 包管理：pnpm workspace（Monorepo）
- 容器化：Docker + Docker Compose

---

## 快速开始

### 前置要求

- Node.js >= 18
- pnpm >= 8
- Docker & Docker Compose

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

```bash
cp .env.example .env.dev
```

编辑 `.env.dev`，填入以下必填项：

```env
WX_APP_ID=your_wx_app_id
WX_APP_SECRET=your_wx_app_secret
JWT_SECRET=your_long_random_secret
```

---

## 本地调试（Docker）

MySQL 运行在 Docker 容器中，server 挂载本地源码支持热重载。

```bash
# 首次启动或依赖变更时（重新构建镜像）
pnpm docker:dev:build

# 后续直接启动
pnpm docker:dev

# 查看实时日志
pnpm docker:logs

# 停止并移除容器
pnpm docker:dev:down
```

启动后：
- 后端 API：`http://localhost:3000`
- MySQL：`127.0.0.1:3307`（可用 TablePlus / DBeaver 直连）

> 修改 `packages/server/src/` 或 `packages/shared/src/` 下的代码后，nodemon 会自动重启服务，无需重建镜像。

---

## 生产部署

```bash
cp .env.example .env
# 编辑 .env，填入生产环境配置

# 构建并后台启动
pnpm docker:up:build

# 停止
pnpm docker:down
```

---

## 小程序开发

```bash
# 启动小程序开发构建（需先启动后端）
pnpm dev:miniapp
```

用微信开发者工具打开 `packages/miniapp/dist` 目录进行调试。

在 `packages/miniapp/project.config.json` 中填入真实的微信小程序 AppID。

---

## 主要功能

| 功能 | 说明 |
|------|------|
| 多店铺管理 | 一个账号可创建并切换多个店铺 |
| 扫码入库 | 扫描条形码/二维码快速入库，事务保证原子性 |
| 扫码出库 | 扫码出库，库存不足时自动拦截 |
| 库存查询 | 支持搜索、分类筛选、低库存预警标注 |
| 出入库记录 | 历史记录查询，支持日期/类型筛选和分页 |
| 数据统计 | 今日汇总、7 天趋势图、分类占比、Top 10 库存 |
| 权限控制 | 店主/操作员角色区分，JWT 鉴权 |

---

## API 路由概览

```
POST   /api/auth/login
GET    /api/shops
POST   /api/shops
GET    /api/shops/:shopId/products
POST   /api/shops/:shopId/inbound
POST   /api/shops/:shopId/outbound
GET    /api/shops/:shopId/inventory
GET    /api/shops/:shopId/records
GET    /api/shops/:shopId/statistics/summary
GET    /api/shops/:shopId/statistics/trend
GET    /api/shops/:shopId/statistics/category-distribution
GET    /api/shops/:shopId/statistics/top-inventory
```

---

## 环境变量说明

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `MYSQL_ROOT_PASSWORD` | MySQL root 密码 | — |
| `MYSQL_DATABASE` | 数据库名 | `smart_shop` |
| `MYSQL_USER` | 数据库用户 | — |
| `MYSQL_PASSWORD` | 数据库密码 | — |
| `JWT_SECRET` | JWT 签名密钥 | — |
| `WX_APP_ID` | 微信小程序 AppID | — |
| `WX_APP_SECRET` | 微信小程序 AppSecret | — |
| `PORT` | 服务端口 | `3000` |
| `TARO_APP_API_URL` | 小程序请求的后端地址 | `http://localhost:3000` |
