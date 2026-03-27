# 智慧店铺管理系统 - 开发指南

## 项目概述

这是一个基于Monorepo架构的智慧店铺管理系统，包含：
- 后端API服务（Express.js + TypeScript）
- 微信小程序前端（Taro + Vue3 + NutUI）
- 数据库（MySQL + Prisma ORM）
- 共享类型和工具包

## 环境要求

### 必需软件
1. **Node.js** 18+ (推荐LTS版本)
2. **pnpm** 8+ (包管理器)
3. **MySQL** 8.0+ 或 Docker
4. **微信开发者工具** (小程序开发)

### 可选软件
1. **Docker** 和 **Docker Compose** (用于开发环境)
2. **Redis** (缓存，可选)
3. **Adminer** (数据库管理)

## 快速开始

### 1. 环境准备
```bash
# 1.1 安装Node.js和pnpm
# 访问 https://nodejs.org/ 安装Node.js
npm install -g pnpm

# 1.2 克隆项目
git clone <repository-url>
cd smart-store

# 1.3 安装依赖
pnpm install
```

### 2. 数据库设置

#### 选项A：使用Docker（推荐）
```bash
# 启动开发环境
pnpm docker:up

# 这将启动：
# - MySQL数据库 (localhost:3306, root/rootpassword)
# - Redis缓存 (localhost:6379)
# - Adminer数据库管理 (http://localhost:8081)
```

#### 选项B：使用本地MySQL
1. 创建数据库：
```sql
CREATE DATABASE smart_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 配置环境变量：
```bash
# 复制示例配置文件
cp .env.example .env

# 编辑.env文件，设置数据库连接
DATABASE_URL="mysql://username:password@localhost:3306/smart_store"
```

### 3. 数据库初始化
```bash
# 生成Prisma客户端
pnpm --filter @smart-store/database prisma:generate

# 运行数据库迁移
pnpm --filter @smart-store/database prisma:migrate

# 填充种子数据
pnpm --filter @smart-store/database prisma:seed
```

### 4. 启动开发服务器

#### 启动后端API服务
```bash
# 在根目录运行
pnpm dev:server

# 或者进入server目录
cd apps/server
pnpm dev
```

后端服务将启动在 `http://localhost:3000`

#### 启动微信小程序开发
```bash
# 在根目录运行
pnpm dev:mp

# 或者进入miniprogram目录
cd apps/miniprogram
pnpm dev:weapp
```

使用微信开发者工具导入 `apps/miniprogram/dist` 目录

### 5. 访问应用

1. **API文档**：`http://localhost:3000/health` (健康检查)
2. **数据库管理**：`http://localhost:8081` (如果用Docker)
3. **微信小程序**：使用微信开发者工具预览

## 项目结构

```
smart-store/
├── apps/                          # 应用目录
│   ├── miniprogram/               # 微信小程序
│   │   ├── src/                   # 源代码
│   │   │   ├── pages/             # 小程序页面
│   │   │   ├── components/        # 公共组件
│   │   │   └── app.ts             # 应用入口
│   │   ├── config/                # Taro配置
│   │   └── project.config.json    # 小程序项目配置
│   │
│   └── server/                    # 后端API服务
│       ├── src/                   # 源代码
│       │   ├── config/            # 应用配置
│       │   ├── middleware/        # Express中间件
│       │   ├── routes/            # API路由
│       │   ├── services/          # 业务逻辑
│       │   └── utils/             # 工具函数
│       └── prisma/                # 数据库schema
│
├── packages/                      # 共享包
│   ├── database/                  # 数据库配置
│   │   ├── prisma/                # Prisma schema
│   │   └── src/                   # 数据库客户端
│   │
│   └── shared/                    # 共享代码
│       ├── types/                 # TypeScript类型
│       ├── constants/             # 常量定义
│       └── utils/                 # 工具函数
│
├── docker/                        # Docker配置
├── docker-compose.yml             # Docker Compose配置
└── package.json                   # 根项目配置
```

## 可用脚本

### 根目录脚本
```bash
# 开发相关
pnpm dev                          # 启动所有服务
pnpm dev:server                   # 仅启动后端服务
pnpm dev:mp                       # 仅启动小程序开发

# 数据库相关
pnpm db:push                      # 推送数据库变更
pnpm db:seed                      # 填充种子数据

# 代码质量
pnpm lint                         # 运行代码检查
pnpm format                       # 格式化代码

# 构建相关
pnpm build                        # 构建所有项目
pnpm clean                        # 清理构建文件

# Docker相关
pnpm docker:up                    # 启动Docker开发环境
pnpm docker:down                  # 停止Docker开发环境
```

### 后端服务脚本
```bash
cd apps/server

pnpm dev                          # 开发模式启动
pnpm build                        # 构建生产版本
pnpm start                        # 启动生产服务器
pnpm test                         # 运行测试
pnpm prisma:generate              # 生成Prisma客户端
pnpm prisma:migrate               # 运行数据库迁移
```

### 小程序脚本
```bash
cd apps/miniprogram

pnpm dev:weapp                    # 微信小程序开发
pnpm dev:h5                       # H5开发
pnpm build:weapp                  # 构建微信小程序
pnpm build:h5                     # 构建H5版本
```

## API接口

### 认证相关
- `POST /api/auth/login` - 微信登录
- `GET /api/auth/me` - 获取用户信息
- `POST /api/auth/refresh` - 刷新令牌

### 店铺管理
- `GET /api/stores` - 获取店铺列表
- `POST /api/stores` - 创建店铺
- `GET /api/stores/:id` - 获取店铺详情
- `PUT /api/stores/:id` - 更新店铺
- `DELETE /api/stores/:id` - 删除店铺

### 商品管理
- `GET /api/products` - 获取商品列表
- `POST /api/products` - 创建商品
- `GET /api/products/:id` - 获取商品详情
- `PUT /api/products/:id` - 更新商品
- `POST /api/products/scan` - 扫码处理
- `POST /api/products/:id/stock-in` - 商品入库
- `POST /api/products/:id/stock-out` - 商品出库

### 数据统计
- `GET /api/analytics/sales` - 销售统计
- `GET /api/analytics/inventory` - 库存分析
- `GET /api/analytics/alerts` - 预警信息
- `GET /api/analytics/overview` - 经营概况

## 数据库模型

### 主要表结构
1. **User** - 用户表
2. **Store** - 店铺表
3. **Shelf** - 货架表
4. **Product** - 商品表
5. **Log** - 库存操作日志
6. **ProductSale** - 销售记录
7. **InventoryAlert** - 库存预警
8. **Camera** - 监控摄像头

### 查看数据库
```bash
# 使用Prisma Studio
cd packages/database
pnpm prisma:studio

# 或者使用Adminer (如果用Docker)
# 访问 http://localhost:8081
```

## 开发流程

### 1. 创建新功能分支
```bash
git checkout -b feature/your-feature-name
```

### 2. 开发后端API
1. 在 `packages/shared/src/types/` 添加类型定义
2. 在 `apps/server/src/services/` 创建业务逻辑
3. 在 `apps/server/src/routes/` 创建路由
4. 在 `packages/database/prisma/schema.prisma` 更新数据库模型
5. 运行数据库迁移：`pnpm db:push`

### 3. 开发小程序页面
1. 在 `apps/miniprogram/src/pages/` 创建页面
2. 在 `apps/miniprogram/src/components/` 创建组件
3. 使用NutUI组件库

### 4. 测试
```bash
# 运行后端测试
cd apps/server
pnpm test

# 检查代码质量
pnpm lint
pnpm format
```

### 5. 提交代码
```bash
git add .
git commit -m "feat: 添加新功能描述"
git push origin feature/your-feature-name
```

## 部署指南

### 生产环境要求
1. **服务器**: 2GB+ RAM, 2+ CPU核心
2. **数据库**: MySQL 8.0+，建议使用云数据库
3. **存储**: 10GB+ 磁盘空间

### 部署步骤

#### 1. 环境配置
```bash
# 在服务器上克隆项目
git clone <repository-url>
cd smart-store

# 安装依赖
pnpm install

# 配置生产环境变量
cp .env.example .env.production
# 编辑.env.production文件
```

#### 2. 构建项目
```bash
# 构建所有项目
pnpm build

# 或单独构建
pnpm --filter @smart-store/server build
pnpm --filter @smart-store/miniprogram build:weapp
```

#### 3. 数据库部署
```bash
# 设置生产数据库
export DATABASE_URL="mysql://生产数据库连接"

# 运行生产迁移
cd packages/database
pnpm prisma:migrate:deploy
```

#### 4. 启动服务
```bash
# 使用PM2管理进程
npm install -g pm2

# 启动后端服务
cd apps/server
pm2 start dist/app.js --name smart-store-api

# 查看日志
pm2 logs smart-store-api
```

#### 5. 配置Nginx反向代理
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 6. 小程序部署
1. 使用微信开发者工具上传代码
2. 提交审核
3. 发布到线上版本

## 故障排除

### 常见问题

#### 1. 数据库连接失败
```bash
# 检查MySQL服务
sudo systemctl status mysql

# 检查连接信息
echo $DATABASE_URL

# 测试连接
mysql -u username -p -h localhost smart_store
```

#### 2. 依赖安装失败
```bash
# 清理pnpm缓存
pnpm store prune

# 重新安装
rm -rf node_modules
pnpm install
```

#### 3. 小程序编译错误
```bash
# 清理构建文件
cd apps/miniprogram
pnpm clean

# 重新安装Taro相关依赖
rm -rf node_modules
pnpm install

# 重新构建
pnpm build:weapp
```

#### 4. API服务启动失败
```bash
# 检查端口占用
lsof -i :3000

# 检查环境变量
cat .env

# 查看详细错误
cd apps/server
npm run dev
```

## 扩展功能

### 待实现功能
1. **微信支付集成** - 扫码收款功能
2. **多语言支持** - 国际化
3. **推送通知** - 库存预警推送
4. **数据导出** - Excel/PDF报表
5. **API文档** - Swagger/OpenAPI
6. **单元测试** - 更完整的测试覆盖

### 性能优化
1. **缓存策略** - Redis缓存常用数据
2. **图片上传** - 云存储集成
3. **分页优化** - 游标分页
4. **CDN加速** - 静态资源CDN

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

MIT License - 详见 LICENSE 文件

---

**最后更新**: 2024-01-01  
**版本**: 1.0.0