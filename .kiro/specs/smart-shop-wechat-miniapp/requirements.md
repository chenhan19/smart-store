# 需求文档

## 简介

智慧店铺微信小程序是一套面向中小型零售店铺的库存管理解决方案，基于 Taro + Express + MySQL 技术栈构建，采用 Monorepo 方式统一管理前后端代码。系统支持一个店主拥有并管理多个店铺，用户登录后需选择当前操作的店铺，所有商品、库存、出入库记录及统计数据均归属于具体店铺。系统支持通过扫描商品二维码/条形码完成快速入库与出库操作，并提供库存状态及出入库记录的数据统计与可视化展示，帮助店主高效管理商品库存。

## 术语表

- **小程序（MiniApp）**：基于 Taro 框架开发的微信小程序前端应用
- **服务端（Server）**：基于 Express 框架开发的后端 API 服务
- **数据库（Database）**：基于 MySQL 的持久化存储层
- **扫码模块（Scanner）**：小程序中调用微信扫码能力的功能模块
- **商品（Product）**：库存中的基本管理单元，具有唯一编码（条形码或二维码内容），归属于特定店铺
- **库存（Inventory）**：当前在库商品的数量与状态记录，归属于特定店铺
- **入库记录（InboundRecord）**：商品进入库存的操作记录，归属于特定店铺
- **出库记录（OutboundRecord）**：商品离开库存的操作记录，归属于特定店铺
- **统计模块（Statistics）**：对库存及出入库数据进行汇总与展示的功能模块
- **操作员（Operator）**：使用小程序执行入库、出库操作的店铺工作人员
- **店主（Owner）**：拥有完整权限、可查看统计数据并管理多个店铺的用户
- **店铺（Shop）**：店主创建的独立经营单元，所有商品、库存、出入库记录和统计数据均在店铺维度下隔离管理
- **当前店铺（CurrentShop）**：用户登录后选中的、当前正在操作的店铺
- **Monorepo**：将前端（MiniApp）和后端（Server）代码统一存放在同一代码仓库中的项目组织方式，通过目录结构区分各子包

---

## 需求

### 需求 1：商品管理

**用户故事：** 作为店主，我希望能够在当前店铺下维护商品基础信息，以便在入库和出库时能够识别和管理商品。

#### 验收标准

1. THE 小程序（MiniApp） SHALL 提供商品列表页面，展示当前店铺（CurrentShop）下所有已录入商品的名称、编码、分类和当前库存数量。
2. WHEN 操作员输入商品名称、编码、规格、单位和分类后提交，THE 服务端（Server） SHALL 将商品信息与当前店铺（CurrentShop）关联后持久化至数据库（Database）并返回新建商品的唯一 ID。
3. WHEN 操作员提交的商品编码与当前店铺（CurrentShop）数据库（Database）中已有商品编码重复，THE 服务端（Server） SHALL 返回错误提示"商品编码已存在"。
4. WHEN 操作员修改商品的名称、规格、单位或分类并提交，THE 服务端（Server） SHALL 更新数据库（Database）中对应商品记录并返回更新后的商品信息。
5. IF 操作员提交的商品名称为空，THEN THE 服务端（Server） SHALL 返回错误提示"商品名称不能为空"。
6. IF 操作员提交的商品编码为空，THEN THE 服务端（Server） SHALL 返回错误提示"商品编码不能为空"。

---

### 需求 2：扫码入库

**用户故事：** 作为操作员，我希望通过扫描商品条形码/二维码完成入库操作，以便快速、准确地将商品录入当前店铺的库存。

#### 验收标准

1. WHEN 操作员在入库页面点击"扫码"按钮，THE 扫码模块（Scanner） SHALL 调用微信扫码 API 获取商品编码。
2. WHEN 扫码模块（Scanner）获取到商品编码，THE 小程序（MiniApp） SHALL 向服务端（Server）查询当前店铺（CurrentShop）下该编码对应的商品信息并展示商品名称、规格和当前库存数量。
3. WHEN 操作员确认商品信息并输入入库数量（正整数）后提交，THE 服务端（Server） SHALL 在数据库（Database）中新增一条归属于当前店铺（CurrentShop）的入库记录（InboundRecord），并将该商品的库存（Inventory）数量增加对应值。
4. WHEN 入库操作成功，THE 小程序（MiniApp） SHALL 展示"入库成功"提示，并显示更新后的库存数量。
5. IF 扫码获取的编码在当前店铺（CurrentShop）数据库（Database）中不存在对应商品，THEN THE 小程序（MiniApp） SHALL 提示"未找到商品，请先添加商品信息"并提供跳转至商品添加页面的入口。
6. IF 操作员提交的入库数量不是正整数，THEN THE 小程序（MiniApp） SHALL 提示"入库数量必须为正整数"并阻止提交。
7. IF 服务端（Server）处理入库请求时发生数据库（Database）写入错误，THEN THE 服务端（Server） SHALL 回滚本次事务并返回错误信息，库存数量保持不变。

---

### 需求 3：扫码出库

**用户故事：** 作为操作员，我希望通过扫描商品条形码/二维码完成出库操作，以便快速、准确地将商品从当前店铺的库存中移出。

#### 验收标准

1. WHEN 操作员在出库页面点击"扫码"按钮，THE 扫码模块（Scanner） SHALL 调用微信扫码 API 获取商品编码。
2. WHEN 扫码模块（Scanner）获取到商品编码，THE 小程序（MiniApp） SHALL 向服务端（Server）查询当前店铺（CurrentShop）下该编码对应的商品信息并展示商品名称、规格和当前库存数量。
3. WHEN 操作员确认商品信息并输入出库数量（正整数）后提交，THE 服务端（Server） SHALL 在数据库（Database）中新增一条归属于当前店铺（CurrentShop）的出库记录（OutboundRecord），并将该商品的库存（Inventory）数量减少对应值。
4. WHEN 出库操作成功，THE 小程序（MiniApp） SHALL 展示"出库成功"提示，并显示更新后的库存数量。
5. IF 操作员提交的出库数量大于该商品在当前店铺（CurrentShop）的当前库存数量，THEN THE 服务端（Server） SHALL 返回错误提示"出库数量不能超过当前库存数量（当前库存：X）"并拒绝本次出库操作。
6. IF 操作员提交的出库数量不是正整数，THEN THE 小程序（MiniApp） SHALL 提示"出库数量必须为正整数"并阻止提交。
7. IF 扫码获取的编码在当前店铺（CurrentShop）数据库（Database）中不存在对应商品，THEN THE 小程序（MiniApp） SHALL 提示"未找到商品，请先添加商品信息"。
8. IF 服务端（Server）处理出库请求时发生数据库（Database）写入错误，THEN THE 服务端（Server） SHALL 回滚本次事务并返回错误信息，库存数量保持不变。

---

### 需求 4：库存查询

**用户故事：** 作为店主，我希望能够查看当前店铺所有商品的库存状态，以便及时掌握库存情况并做出补货决策。

#### 验收标准

1. THE 小程序（MiniApp） SHALL 提供库存列表页面，展示当前店铺（CurrentShop）下所有商品的名称、编码、分类、规格、单位和当前库存数量。
2. WHEN 店主在库存列表页面输入商品名称或编码关键词，THE 小程序（MiniApp） SHALL 实时过滤并展示当前店铺（CurrentShop）中匹配的商品库存信息。
3. WHEN 店主选择按分类筛选，THE 小程序（MiniApp） SHALL 仅展示当前店铺（CurrentShop）该分类下的商品库存信息。
4. WHILE 某商品库存数量低于该商品设定的预警阈值，THE 小程序（MiniApp） SHALL 在库存列表中以醒目标识（红色或警告图标）标注该商品。
5. WHEN 店主点击某商品，THE 小程序（MiniApp） SHALL 展示该商品的详细信息及最近 30 条出入库记录。

---

### 需求 5：出入库记录查询

**用户故事：** 作为店主，我希望能够查询当前店铺的历史出入库记录，以便追溯库存变动情况。

#### 验收标准

1. THE 小程序（MiniApp） SHALL 提供出入库记录列表页面，展示当前店铺（CurrentShop）下每条记录的商品名称、操作类型（入库/出库）、数量、操作时间和操作员。
2. WHEN 店主选择日期范围进行筛选，THE 服务端（Server） SHALL 返回当前店铺（CurrentShop）在该时间范围内的出入库记录列表。
3. WHEN 店主选择按操作类型（入库或出库）筛选，THE 服务端（Server） SHALL 仅返回当前店铺（CurrentShop）中对应类型的记录。
4. WHEN 店主输入商品名称或编码关键词进行搜索，THE 服务端（Server） SHALL 返回当前店铺（CurrentShop）中匹配该关键词的出入库记录。
5. THE 小程序（MiniApp） SHALL 以分页方式展示出入库记录，每页展示 20 条，并支持上拉加载更多。

---

### 需求 6：数据统计与可视化

**用户故事：** 作为店主，我希望能够查看当前店铺的库存和出入库统计数据，以便分析经营状况和库存趋势。

#### 验收标准

1. THE 统计模块（Statistics） SHALL 展示当前店铺（CurrentShop）今日入库总数量、今日出库总数量、当前库存商品种类数和库存预警商品数量四项核心指标。
2. WHEN 店主查看统计页面，THE 统计模块（Statistics） SHALL 展示当前店铺（CurrentShop）最近 7 天每日出入库数量的折线图或柱状图。
3. WHEN 店主查看统计页面，THE 统计模块（Statistics） SHALL 展示当前店铺（CurrentShop）各商品分类的库存占比饼图。
4. WHEN 店主选择自定义时间范围，THE 服务端（Server） SHALL 返回当前店铺（CurrentShop）在该时间范围内的出入库汇总数据，时间范围最长不超过 365 天。
5. WHEN 店主查看统计页面，THE 统计模块（Statistics） SHALL 展示当前店铺（CurrentShop）库存数量排名前 10 的商品列表。
6. IF 所选时间范围内无出入库记录，THEN THE 统计模块（Statistics） SHALL 展示"暂无数据"提示。

---

### 需求 7：用户身份与权限

**用户故事：** 作为店主，我希望系统能够区分店主和操作员的权限，以便保护敏感数据和管理操作。

#### 验收标准

1. WHEN 用户首次打开小程序（MiniApp），THE 小程序（MiniApp） SHALL 引导用户通过微信授权登录并获取微信 OpenID。
2. WHEN 服务端（Server）收到登录请求，THE 服务端（Server） SHALL 验证微信 OpenID 并返回包含用户角色信息的访问令牌（JWT）。
3. WHILE 用户角色为操作员（Operator），THE 小程序（MiniApp） SHALL 仅展示入库、出库和库存查询功能，隐藏统计和用户管理入口。
4. WHILE 用户角色为店主（Owner），THE 小程序（MiniApp） SHALL 展示全部功能入口，包括统计模块、用户管理和店铺管理。
5. IF 访问令牌（JWT）过期或无效，THEN THE 服务端（Server） SHALL 返回 HTTP 401 状态码，THE 小程序（MiniApp） SHALL 引导用户重新登录。
6. WHEN 店主在用户管理页面邀请新操作员并指定角色，THE 服务端（Server） SHALL 将该用户信息及角色与当前店铺（CurrentShop）关联后持久化至数据库（Database）。

---

### 需求 8：店铺管理

**用户故事：** 作为店主，我希望能够创建和管理多个店铺，并在使用时选择或切换当前操作的店铺，以便在同一账号下独立管理不同门店的库存数据。

#### 验收标准

1. WHEN 店主首次登录且名下无任何店铺（Shop），THE 小程序（MiniApp） SHALL 引导店主创建第一个店铺，并在创建完成后自动将其设为当前店铺（CurrentShop）。
2. WHEN 店主提交包含店铺名称的创建请求，THE 服务端（Server） SHALL 在数据库（Database）中新建一条店铺（Shop）记录并与该店主账号关联，返回新建店铺的唯一 ID。
3. IF 店主提交的店铺名称为空，THEN THE 服务端（Server） SHALL 返回错误提示"店铺名称不能为空"。
4. THE 小程序（MiniApp） SHALL 提供店铺列表页面，展示当前店主名下所有店铺（Shop）的名称和创建时间。
5. WHEN 店主在店铺列表中选择某个店铺，THE 小程序（MiniApp） SHALL 将所选店铺设为当前店铺（CurrentShop），并刷新页面数据以展示该店铺下的商品、库存和记录信息。
6. WHILE 用户已登录且当前店铺（CurrentShop）已选定，THE 小程序（MiniApp） SHALL 在页面顶部持续展示当前店铺（CurrentShop）的名称。
7. WHEN 店主修改店铺名称并提交，THE 服务端（Server） SHALL 更新数据库（Database）中对应店铺（Shop）记录并返回更新后的店铺信息。
8. IF 服务端（Server）收到的请求未携带有效的当前店铺（CurrentShop）标识，THEN THE 服务端（Server） SHALL 返回 HTTP 400 状态码及错误提示"未指定店铺"。
9. THE 服务端（Server） SHALL 对所有涉及商品、库存、出入库记录和统计数据的接口进行店铺（Shop）归属校验，确保用户只能访问其有权限的店铺数据。

---

### 需求 9：Monorepo 项目结构

**用户故事：** 作为开发者，我希望前端和后端代码统一在同一仓库中管理，以便简化依赖管理、统一代码规范并方便跨端协作。

#### 验收标准

1. THE Monorepo SHALL 采用单一代码仓库组织方式，将小程序（MiniApp）和服务端（Server）作为独立子包分别存放于 `packages/miniapp` 和 `packages/server` 目录下。
2. THE Monorepo SHALL 在根目录提供统一的依赖安装命令，执行后可完成所有子包的依赖安装。
3. THE Monorepo SHALL 在根目录提供统一的启动命令，分别用于启动小程序（MiniApp）开发构建和服务端（Server）本地服务。
4. WHERE 多个子包存在共享工具函数或类型定义，THE Monorepo SHALL 支持将共享代码提取至独立的公共子包（如 `packages/shared`）供各子包引用。
5. THE Monorepo SHALL 在根目录维护统一的代码规范配置文件（如 ESLint、Prettier），所有子包共享同一套规范。
