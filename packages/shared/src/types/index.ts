// 基础类型定义
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  code: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 用户相关类型
export interface User {
  id: string;
  openid: string;
  username: string;
  avatar?: string;
  phone?: string;
  email?: string;
  role: 'admin' | 'store_owner' | 'employee';
  status: 'active' | 'inactive' | 'banned';
  createdAt: Date;
  updatedAt: Date;
}

export interface UserLoginRequest {
  code: string; // 微信登录code
}

export interface UserLoginResponse {
  user: User;
  token: string;
  expiresIn: number;
}

// 店铺相关类型
export interface Store {
  id: string;
  userId: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  cameraStreamUrl?: string;
  status: 'active' | 'inactive' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStoreRequest {
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  cameraStreamUrl?: string;
}

export interface UpdateStoreRequest extends Partial<CreateStoreRequest> {
  status?: 'active' | 'inactive' | 'closed';
}

// 货架相关类型
export interface Shelf {
  id: string;
  storeId: string;
  labelName: string;
  description?: string;
  position: string; // 货架位置，如"A1", "B2"等
  capacity: number; // 最大容量
  currentOccupancy: number; // 当前占用数量
  status: 'active' | 'maintenance' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateShelfRequest {
  labelName: string;
  description?: string;
  position: string;
  capacity: number;
}

export interface UpdateShelfRequest extends Partial<CreateShelfRequest> {
  status?: 'active' | 'maintenance' | 'inactive';
}

// 商品相关类型
export interface Product {
  id: string;
  shelfId: string;
  barcode: string;
  name: string;
  description?: string;
  category?: string;
  unit: string; // 单位：件、箱、袋等
  price: number;
  costPrice?: number;
  stock: number;
  minThreshold: number;
  maxThreshold?: number;
  specifications?: Record<string, any>; // 商品规格
  images?: string[]; // 商品图片URL
  status: 'active' | 'out_of_stock' | 'discontinued';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductRequest {
  barcode: string;
  name: string;
  description?: string;
  category?: string;
  unit: string;
  price: number;
  costPrice?: number;
  minThreshold: number;
  maxThreshold?: number;
  specifications?: Record<string, any>;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  status?: 'active' | 'out_of_stock' | 'discontinued';
}

// 库存操作类型
export enum StockOperationType {
  IN = 'IN', // 入库
  OUT = 'OUT', // 出库
  ADJUST = 'ADJUST', // 调整
  TRANSFER = 'TRANSFER' // 转移
}

export interface StockLog {
  id: string;
  productId: string;
  operationType: StockOperationType;
  quantity: number;
  previousStock: number;
  newStock: number;
  operatorId: string;
  remark?: string;
  referenceId?: string; // 相关单据ID
  createdAt: Date;
}

export interface StockOperationRequest {
  quantity: number;
  remark?: string;
  referenceId?: string;
}

// 扫码相关类型
export interface ScanRequest {
  barcode: string;
  storeId?: string;
  shelfId?: string;
}

export interface ScanResponse {
  product?: Product;
  exists: boolean;
  message: string;
}

// 统计相关类型
export interface SalesStat {
  date: string;
  amount: number;
  quantity: number;
  orderCount: number;
}

export interface InventoryStat {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface ProductRank {
  productId: string;
  productName: string;
  barcode: string;
  salesQuantity: number;
  salesAmount: number;
}

// 错误类型
export interface AppError extends Error {
  code: string;
  statusCode: number;
  details?: any;
}