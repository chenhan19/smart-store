# 实现计划：智慧店铺微信小程序

## 概述

基于 Taro + Express + MySQL 的 Monorepo 项目，按模块逐步实现：先搭建基础设施，再实现后端各业务模块，最后实现前端页面，并通过 fast-check 属性测试覆盖设计文档中的 20 个正确性属性。

## 任务列表

- [x] 1. Monorepo 基础搭建
  - [x] 1.1 初始化根目录配置
    - 创建根 `package.json`，配置 pnpm workspace 脚本（`dev:miniapp`、`dev:server`、`install`）
    - 创建 `pnpm-workspace.yaml`，声明 `packages/*` 为工作区成员
    - 创建 `tsconfig.base.json`，配置共享 TypeScript 编译选项（target ES2020、strict、paths）
    - 创建 `.eslintrc.js` 和 `.prettierrc`，统一代码规范
    - _需求：9.1, 9.2, 9.3, 9.5_

  - [x] 1.2 创建 `packages/shared` 共享包
    - 创建 `packages/shared/package.json`（name: `@smart-shop/shared`）
    - 在 `packages/shared/src/types/` 下定义共享 TypeScript 类型：`User`、`Shop`、`ShopMember`、`Product`、`Inventory`、`StockRecord`、`ApiResponse`、`PaginatedResponse`
    - 在 `packages/shared/src/utils/` 下实现共享工具函数：日期格式化、正整数校验
    - _需求：9.4_


- [x] 2. 数据库与后端基础
  - [x] 2.1 初始化 `packages/server` 项目结构
    - 创建 `packages/server/package.json`（name: `@smart-shop/server`，依赖 express、sequelize、mysql2、jsonwebtoken、axios、@smart-shop/shared）
    - 创建 `packages/server/tsconfig.json`，继承 `tsconfig.base.json`
    - 创建目录结构：`src/config/`、`src/models/`、`src/routes/`、`src/controllers/`、`src/services/`、`src/middlewares/`、`src/utils/`
    - _需求：9.1_

  - [x] 2.2 编写 MySQL 建表 SQL 与 Sequelize 模型
    - 在 `src/config/database.ts` 中初始化 Sequelize 实例（读取环境变量 DB_HOST、DB_PORT、DB_NAME、DB_USER、DB_PASS）
    - 在 `src/models/` 下创建 6 个 Sequelize 模型：`User`、`Shop`、`ShopMember`、`Product`、`Inventory`、`StockRecord`，字段与 ER 图一致
    - 在 `Product` 模型上添加 `(shop_id, code)` 联合唯一索引；在 `ShopMember` 上添加 `(shop_id, user_id)` 联合唯一索引；在 `Inventory` 上添加 `(shop_id, product_id)` 联合唯一索引
    - 在 `src/models/index.ts` 中定义模型关联关系并导出
    - _需求：1.3, 8.2_

  - [x] 2.3 创建 Express 应用入口与中间件
    - 在 `src/app.ts` 中创建 Express 应用，注册 `express.json()`、CORS、统一错误处理中间件
    - 在 `src/middlewares/authenticateJWT.ts` 中实现 JWT 验证中间件，解析 userId 和 role 注入 `req.user`，无效/过期时返回 HTTP 401
    - 在 `src/middlewares/verifyShopAccess.ts` 中实现店铺归属校验中间件，校验 `req.params.shopId` 归属于当前用户，失败时返回 HTTP 403
    - 在 `src/middlewares/roleGuard.ts` 中实现角色守卫中间件，支持传入允许的角色数组
    - 在 `src/middlewares/errorHandler.ts` 中实现统一错误响应格式 `{ code, message, details }`
    - _需求：7.5, 8.8, 8.9_


- [x] 3. 认证模块
  - [x] 3.1 实现微信登录与 JWT 签发
    - 在 `src/services/authService.ts` 中实现 `loginWithWechat(code)`：调用微信 `code2Session` 接口获取 openid，查询或创建 User 记录，签发包含 `{ userId, role }` 的 JWT（有效期 7 天）
    - 在 `src/controllers/authController.ts` 中实现 `POST /api/auth/login` 控制器
    - 在 `src/routes/auth.ts` 中注册路由，挂载至 `src/app.ts`
    - _需求：7.1, 7.2_

  - [ ]* 3.2 编写属性测试：JWT 包含角色信息（属性 17）
    - **属性 17：JWT 包含角色信息**
    - **验证需求：7.2**
    - 在 `src/__tests__/auth.spec.ts` 中使用 fast-check 生成合法 openid，验证返回 JWT 解码后包含 `userId` 和 `role`，且 `role` 为 `owner` 或 `operator`

  - [ ]* 3.3 编写属性测试：无效 JWT 返回 401（属性 18）
    - **属性 18：无效 JWT 返回 401**
    - **验证需求：7.5**
    - 在 `src/__tests__/auth.spec.ts` 中使用 fast-check 生成随机字符串作为无效 token，验证 `authenticateJWT` 中间件返回 HTTP 401

- [x] 4. 店铺模块
  - [x] 4.1 实现店铺 CRUD 与成员管理
    - 在 `src/services/shopService.ts` 中实现：`createShop`（创建店铺并自动插入 owner 成员记录）、`getShopsByOwner`、`getShopById`、`updateShop`、`addMember`、`removeMember`、`getMembers`
    - 在 `src/controllers/shopController.ts` 中实现对应控制器，店铺名称为空时返回 400 及"店铺名称不能为空"
    - 在 `src/routes/shops.ts` 中注册路由（含成员子路由），挂载至 `src/app.ts`
    - _需求：8.2, 8.3, 8.4, 8.7, 7.6_

  - [ ]* 4.2 编写属性测试：店铺创建 Round-Trip（属性 19）
    - **属性 19：店铺创建 Round-Trip**
    - **验证需求：8.2, 8.4**
    - 在 `src/__tests__/shop.spec.ts` 中使用 fast-check 生成非空店铺名称，验证创建后通过 ID 查询得到相同名称，且出现在店主的店铺列表中

  - [ ]* 4.3 编写属性测试：数据隔离（属性 20）
    - **属性 20：数据隔离**
    - **验证需求：8.8, 8.9**
    - 在 `src/__tests__/shop.spec.ts` 中使用 fast-check 生成不同用户，验证访问无权限店铺的商品/库存/记录/统计接口时返回 HTTP 403


- [x] 5. 商品模块
  - [x] 5.1 实现商品 CRUD 与编码查询
    - 在 `src/services/productService.ts` 中实现：`createProduct`（校验名称/编码非空，检查编码唯一性）、`listProducts`（支持 keyword、category 过滤）、`getProductById`、`updateProduct`、`getProductByCode`
    - 在 `src/controllers/productController.ts` 中实现对应控制器，编码重复时返回 409 及"商品编码已存在"，名称/编码为空时返回 400
    - 在 `src/routes/products.ts` 中注册路由（含 `/by-code/:code` 子路由），挂载至 shops 路由
    - 商品创建时自动在 `inventory` 表中插入 `quantity=0` 的初始记录
    - _需求：1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ]* 5.2 编写属性测试：商品创建 Round-Trip（属性 1）
    - **属性 1：商品创建 Round-Trip**
    - **验证需求：1.2**
    - 在 `src/__tests__/product.spec.ts` 中使用 fast-check 生成合法商品信息，验证创建后通过 ID 查询得到相同的名称、编码、规格、单位和分类

  - [ ]* 5.3 编写属性测试：商品编码唯一性（属性 2）
    - **属性 2：商品编码唯一性**
    - **验证需求：1.3**
    - 在 `src/__tests__/product.spec.ts` 中使用 fast-check 生成已存在编码，验证重复创建时返回错误且数据库中该编码记录数量为 1

  - [ ]* 5.4 编写属性测试：商品字段验证（属性 3）
    - **属性 3：商品字段验证**
    - **验证需求：1.5, 1.6**
    - 在 `src/__tests__/product.spec.ts` 中使用 fast-check 生成空白名称或空白编码的请求，验证服务端拒绝并返回对应错误提示

- [x] 6. 库存模块
  - [x] 6.1 实现库存查询与预警阈值设置
    - 在 `src/services/inventoryService.ts` 中实现：`listInventory`（支持 keyword、category、alert 过滤，返回 `isAlert` 字段）、`setAlertThreshold`
    - 在 `src/controllers/inventoryController.ts` 中实现对应控制器
    - 在 `src/routes/inventory.ts` 中注册路由，挂载至 shops 路由
    - _需求：4.1, 4.2, 4.3, 4.4_

  - [ ]* 6.2 编写属性测试：库存筛选准确性（属性 9）
    - **属性 9：库存筛选准确性**
    - **验证需求：4.2, 4.3**
    - 在 `src/__tests__/inventory.spec.ts` 中使用 fast-check 生成关键词和分类，验证返回列表中每条记录均满足筛选条件

  - [ ]* 6.3 编写属性测试：库存预警标记（属性 10）
    - **属性 10：库存预警标记**
    - **验证需求：4.4**
    - 在 `src/__tests__/inventory.spec.ts` 中使用 fast-check 生成库存数量和阈值组合，验证 `isAlert` 字段与 `quantity < threshold` 的逻辑一致


- [x] 7. 入库模块
  - [x] 7.1 实现入库事务操作
    - 在 `src/services/inboundService.ts` 中实现 `createInbound`：在事务中执行 `SELECT ... FOR UPDATE` 加锁查询库存、插入 `stock_records`（type=in，记录 quantity_before/after）、更新 `inventory.quantity`，任何步骤失败则回滚
    - 在 `src/controllers/inboundController.ts` 中实现 `POST /api/shops/:shopId/inbound` 控制器
    - 在 `src/routes/inbound.ts` 中注册路由，挂载至 shops 路由
    - _需求：2.3, 2.7_

  - [ ]* 7.2 编写属性测试：入库后库存增加（属性 4）
    - **属性 4：入库后库存增加**
    - **验证需求：2.3**
    - 在 `src/__tests__/inbound.spec.ts` 中使用 fast-check 生成正整数入库数量，验证入库后库存等于入库前加 N，且存在对应入库记录

  - [ ]* 7.3 编写属性测试：操作数量验证（属性 6，入库侧）
    - **属性 6：操作数量验证（入库侧）**
    - **验证需求：2.6**
    - 在 `src/__tests__/stock.spec.ts` 中使用 fast-check 生成非正整数（0、负数、小数、字符串），验证入库请求被拒绝且库存不变

  - [ ]* 7.4 编写属性测试：库存操作原子性（属性 8，入库侧）
    - **属性 8：库存操作原子性（入库侧）**
    - **验证需求：2.7**
    - 在 `src/__tests__/stock.spec.ts` 中模拟数据库写入错误，验证库存记录和出入库记录均回滚至操作前状态

- [x] 8. 出库模块
  - [x] 8.1 实现出库事务操作
    - 在 `src/services/outboundService.ts` 中实现 `createOutbound`：在事务中加锁查询库存，若出库数量 > 当前库存则返回 400 及"出库数量不能超过当前库存数量（当前库存：X）"，否则插入 `stock_records`（type=out）并更新库存，失败则回滚
    - 在 `src/controllers/outboundController.ts` 中实现 `POST /api/shops/:shopId/outbound` 控制器
    - 在 `src/routes/outbound.ts` 中注册路由，挂载至 shops 路由
    - _需求：3.3, 3.5, 3.8_

  - [ ]* 8.2 编写属性测试：出库后库存减少（属性 5）
    - **属性 5：出库后库存减少**
    - **验证需求：3.3**
    - 在 `src/__tests__/outbound.spec.ts` 中使用 fast-check 生成不超过当前库存的正整数出库数量，验证出库后库存等于出库前减 N，且存在对应出库记录

  - [ ]* 8.3 编写属性测试：出库库存不足拒绝（属性 7）
    - **属性 7：出库库存不足拒绝**
    - **验证需求：3.5**
    - 在 `src/__tests__/outbound.spec.ts` 中使用 fast-check 生成大于当前库存的出库数量，验证服务端返回错误且库存不变

  - [ ]* 8.4 编写属性测试：操作数量验证（属性 6，出库侧）
    - **属性 6：操作数量验证（出库侧）**
    - **验证需求：3.6**
    - 在 `src/__tests__/stock.spec.ts` 中使用 fast-check 生成非正整数，验证出库请求被拒绝且库存不变

  - [ ]* 8.5 编写属性测试：库存操作原子性（属性 8，出库侧）
    - **属性 8：库存操作原子性（出库侧）**
    - **验证需求：3.8**
    - 在 `src/__tests__/stock.spec.ts` 中模拟数据库写入错误，验证出库操作回滚


- [x] 9. 出入库记录模块
  - [x] 9.1 实现记录分页查询与筛选
    - 在 `src/services/recordService.ts` 中实现 `listRecords`：支持 `type`（in/out）、`startDate`、`endDate`、`keyword`（商品名称或编码）、`page`、`pageSize`（默认 20）筛选，返回 `{ total, page, pageSize, list }`
    - 在 `src/controllers/recordController.ts` 中实现 `GET /api/shops/:shopId/records` 控制器
    - 在 `src/routes/records.ts` 中注册路由，挂载至 shops 路由
    - _需求：5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 9.2 编写属性测试：记录筛选准确性（属性 11）
    - **属性 11：记录筛选准确性**
    - **验证需求：5.2, 5.3, 5.4**
    - 在 `src/__tests__/records.spec.ts` 中使用 fast-check 生成筛选条件组合，验证返回列表中每条记录均满足所有筛选条件

  - [ ]* 9.3 编写属性测试：分页大小约束（属性 12）
    - **属性 12：分页大小约束**
    - **验证需求：5.5**
    - 在 `src/__tests__/records.spec.ts` 中使用 fast-check 生成不同 page/pageSize 参数，验证返回记录数不超过 pageSize，且 total 等于满足条件的记录总数

- [x] 10. 统计模块
  - [x] 10.1 实现统计汇总、趋势、分类占比与 Top-10 接口
    - 在 `src/services/statisticsService.ts` 中实现：
      - `getSummary`：查询今日入库/出库总量、商品种类数、预警商品数
      - `getTrend(startDate, endDate)`：按日聚合出入库数量，时间范围超 365 天时返回 400
      - `getCategoryDistribution`：按分类聚合库存数量，计算各分类 percentage（总和为 100%）
      - `getTopInventory`：按库存数量降序取前 10 条
    - 在 `src/controllers/statisticsController.ts` 中实现 4 个控制器，统计接口加 `roleGuard(['owner'])` 中间件
    - 在 `src/routes/statistics.ts` 中注册路由，挂载至 shops 路由
    - _需求：6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ]* 10.2 编写属性测试：统计数据一致性（属性 13）
    - **属性 13：统计数据一致性**
    - **验证需求：6.1**
    - 在 `src/__tests__/statistics.spec.ts` 中使用 fast-check 生成若干入库/出库记录，验证 summary 接口返回的今日入库/出库总量与数据库记录之和一致

  - [ ]* 10.3 编写属性测试：分类占比之和为 100%（属性 14）
    - **属性 14：分类占比之和为 100%**
    - **验证需求：6.3**
    - 在 `src/__tests__/statistics.spec.ts` 中使用 fast-check 生成多分类商品数据，验证 `category-distribution` 接口返回的所有 percentage 之和在 100 ± 0.01 范围内

  - [ ]* 10.4 编写属性测试：统计时间范围限制（属性 15）
    - **属性 15：统计时间范围限制**
    - **验证需求：6.4**
    - 在 `src/__tests__/statistics.spec.ts` 中使用 fast-check 生成超过 365 天的时间范围，验证 trend 接口返回 400 错误

  - [ ]* 10.5 编写属性测试：Top-10 库存排序（属性 16）
    - **属性 16：Top-10 库存排序**
    - **验证需求：6.5**
    - 在 `src/__tests__/statistics.spec.ts` 中使用 fast-check 生成多商品库存数据，验证 `top-inventory` 接口返回列表长度不超过 10 且按库存数量降序排列

- [x] 11. 后端检查点
  - 确保所有后端路由已正确挂载，所有中间件链（authenticateJWT → verifyShopAccess → roleGuard → Controller）工作正常
  - 确保所有测试通过，向用户确认是否有疑问


- [x] 12. 前端基础
  - [x] 12.1 初始化 `packages/miniapp` Taro 项目
    - 创建 `packages/miniapp/package.json`（name: `@smart-shop/miniapp`，依赖 @tarojs/taro、@tarojs/react、react、zustand、@smart-shop/shared）
    - 创建 `packages/miniapp/project.config.json`，配置微信小程序 appid 和编译选项
    - 创建 `src/app.tsx` 和 `src/app.config.ts`，配置全局路由（12 个页面）和 tabBar（首页、库存、记录、统计）
    - _需求：9.1, 9.3_

  - [x] 12.2 实现全局状态管理
    - 在 `src/store/authStore.ts` 中使用 Zustand 实现认证状态：`token`、`user`（含 role）、`login`、`logout`
    - 在 `src/store/shopStore.ts` 中实现店铺状态：`currentShop`、`shops`、`setCurrentShop`、`fetchShops`
    - _需求：7.3, 7.4, 8.5, 8.6_

  - [x] 12.3 封装 API 请求层
    - 在 `src/services/request.ts` 中封装 Taro.request，统一处理 baseURL、Authorization header、401 自动跳转登录、业务错误提示
    - 在 `src/services/` 下按模块创建 API 函数：`authApi.ts`、`shopApi.ts`、`productApi.ts`、`inventoryApi.ts`、`stockApi.ts`（入库/出库）、`recordApi.ts`、`statisticsApi.ts`
    - _需求：7.5_


- [x] 13. 前端页面实现
  - [x] 13.1 实现登录页（`pages/auth/login/index.tsx`）
    - 调用 `wx.login` 获取 code，请求 `POST /api/auth/login`，将 token 和 user 存入 authStore
    - 登录成功后判断是否有店铺，无则跳转创建店铺页，有则跳转店铺列表页
    - _需求：7.1, 8.1_

  - [x] 13.2 实现店铺列表与创建页（`pages/shop/list/index.tsx`、`pages/shop/create/index.tsx`）
    - 列表页展示当前店主名下所有店铺名称和创建时间，点击选中后更新 shopStore.currentShop 并跳转首页
    - 创建/编辑页提交店铺名称，调用创建或更新接口，名称为空时前端阻止提交
    - 在页面顶部 NavigationBar 持续展示当前店铺名称
    - _需求：8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [x] 13.3 实现首页（`pages/home/index.tsx`）
    - 根据 authStore.user.role 按角色展示功能入口：操作员仅展示入库、出库、库存查询；店主展示全部入口（含统计、用户管理、店铺管理）
    - _需求：7.3, 7.4_

  - [x] 13.4 实现商品列表与详情页（`pages/product/list/index.tsx`、`pages/product/detail/index.tsx`、`pages/product/edit/index.tsx`）
    - 列表页展示当前店铺商品的名称、编码、分类和当前库存数量，支持关键词搜索
    - 详情页展示商品完整信息及最近 30 条出入库记录
    - 编辑页实现新建/修改商品表单，名称和编码为必填项，提交时校验非空
    - _需求：1.1, 1.2, 1.4, 1.5, 1.6, 4.5_

  - [x] 13.5 实现库存列表页（`pages/inventory/list/index.tsx`）
    - 展示当前店铺所有商品的名称、编码、分类、规格、单位和库存数量
    - 支持关键词搜索和分类筛选
    - 库存低于预警阈值的商品以红色或警告图标标注（根据 `isAlert` 字段）
    - _需求：4.1, 4.2, 4.3, 4.4_

  - [x] 13.6 实现扫码入库页（`pages/inbound/index.tsx`）
    - 点击"扫码"调用 `wx.scanCode` 获取商品编码，请求 `/products/by-code/:code` 展示商品信息和当前库存
    - 商品不存在时提示"未找到商品，请先添加商品信息"并提供跳转入口
    - 输入入库数量，前端校验为正整数（非正整数时提示"入库数量必须为正整数"并阻止提交）
    - 提交成功后展示"入库成功"及更新后库存数量
    - _需求：2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 13.7 实现扫码出库页（`pages/outbound/index.tsx`）
    - 点击"扫码"调用 `wx.scanCode` 获取商品编码，展示商品信息和当前库存
    - 商品不存在时提示"未找到商品，请先添加商品信息"
    - 输入出库数量，前端校验为正整数（非正整数时提示"出库数量必须为正整数"并阻止提交）
    - 服务端返回库存不足错误时展示"出库数量不能超过当前库存数量（当前库存：X）"
    - 提交成功后展示"出库成功"及更新后库存数量
    - _需求：3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 13.8 实现出入库记录列表页（`pages/records/list/index.tsx`）
    - 展示商品名称、操作类型（入库/出库）、数量、操作时间和操作员
    - 支持日期范围筛选、操作类型筛选、关键词搜索
    - 分页展示，每页 20 条，支持上拉加载更多（追加数据到列表）
    - _需求：5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 13.9 实现统计页（`pages/statistics/index.tsx`，仅店主可见）
    - 展示今日入库总量、今日出库总量、商品种类数、预警商品数四项核心指标
    - 展示最近 7 天每日出入库数量的折线图或柱状图（使用 echarts-for-taro 或 wx-charts）
    - 展示各商品分类库存占比饼图
    - 展示库存数量 Top-10 商品列表
    - 支持自定义时间范围筛选，无数据时展示"暂无数据"
    - _需求：6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 14. 最终检查点
  - 确保所有测试通过，前后端联调正常，向用户确认是否有疑问


## 说明

- 标注 `*` 的子任务为可选属性测试任务，可在 MVP 阶段跳过
- 每个属性测试任务均对应设计文档中的具体属性编号，使用 fast-check 实现，至少运行 100 次迭代
- 每个任务均引用具体需求条款，确保需求可追溯
- 检查点任务确保增量验证，避免积累问题
- 属性测试与单元测试互补：属性测试验证普遍性，单元测试验证具体边界条件
