export interface User {
  id: number;
  openid: string;
  nickname: string;
  avatarUrl: string;
  createdAt: Date;
}

export interface Shop {
  id: number;
  name: string;
  ownerId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShopMember {
  id: number;
  shopId: number;
  userId: number;
  role: 'owner' | 'operator';
  createdAt: Date;
}

export interface Product {
  id: number;
  shopId: number;
  name: string;
  code: string;
  category: string;
  spec: string;
  unit: string;
  alertThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Inventory {
  id: number;
  shopId: number;
  productId: number;
  quantity: number;
  updatedAt: Date;
  isAlert?: boolean;
}

export interface StockRecord {
  id: number;
  shopId: number;
  productId: number;
  operatorId: number;
  type: 'in' | 'out';
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  remark?: string;
  createdAt: Date;
}

export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  pageSize: number;
  list: T[];
}
