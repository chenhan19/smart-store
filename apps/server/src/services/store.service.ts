import { prisma, db } from '@database/index';
import { Store, CreateStoreRequest, UpdateStoreRequest, PaginationParams, PaginatedResponse } from '@shared/types';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class StoreService {
  // 创建店铺
  async createStore(data: CreateStoreRequest & { userId: string }): Promise<Store> {
    try {
      // 检查用户是否存在
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
      });

      if (!user) {
        throw new AppError(404, '用户不存在', 'USER_NOT_FOUND');
      }

      // 创建店铺
      const store = await prisma.store.create({
        data: {
          userId: data.userId,
          name: data.name,
          description: data.description,
          address: data.address,
          phone: data.phone,
          cameraStreamUrl: data.cameraStreamUrl,
          status: 'active',
        },
      });

      logger.business('创建店铺', data.userId, {
        storeId: store.id,
        storeName: data.name,
      });

      return this.mapStore(store);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('创建店铺失败:', error);
      throw new AppError(500, '创建店铺失败', 'CREATE_STORE_FAILED');
    }
  }

  // 更新店铺
  async updateStore(storeId: string, data: UpdateStoreRequest & { userId: string }): Promise<Store> {
    try {
      // 检查店铺是否存在且属于该用户
      const existingStore = await prisma.store.findFirst({
        where: {
          id: storeId,
          userId: data.userId,
        },
      });

      if (!existingStore) {
        throw new AppError(404, '店铺不存在或无权限', 'STORE_NOT_FOUND');
      }

      // 更新店铺
      const store = await prisma.store.update({
        where: { id: storeId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.address !== undefined && { address: data.address }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.cameraStreamUrl !== undefined && { cameraStreamUrl: data.cameraStreamUrl }),
          ...(data.status && { status: data.status }),
          updatedAt: new Date(),
        },
      });

      logger.business('更新店铺', data.userId, {
        storeId,
        updatedFields: Object.keys(data),
      });

      return this.mapStore(store);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('更新店铺失败:', error);
      throw new AppError(500, '更新店铺失败', 'UPDATE_STORE_FAILED');
    }
  }

  // 获取店铺列表
  async getStores(params: PaginationParams & {
    userId?: string;
    status?: string;
    keyword?: string;
  }): Promise<PaginatedResponse<Store>> {
    try {
      const where: any = {};

      // 按用户筛选
      if (params.userId) {
        where.userId = params.userId;
      }

      // 按状态筛选
      if (params.status) {
        where.status = params.status;
      }

      // 按关键词搜索
      if (params.keyword) {
        where.OR = [
          { name: { contains: params.keyword } },
          { description: { contains: params.keyword } },
          { address: { contains: params.keyword } },
        ];
      }

      const page = params.page || 1;
      const limit = params.limit || 20;
      const orderBy = params.sortBy 
        ? { [params.sortBy]: params.sortOrder || 'desc' }
        : { createdAt: 'desc' };

      const result = await db.paginate(prisma.store, where, page, limit, orderBy);

      return {
        ...result,
        items: result.items.map(store => this.mapStore(store)),
      };
    } catch (error) {
      logger.error('获取店铺列表失败:', error);
      throw new AppError(500, '获取店铺列表失败', 'GET_STORES_FAILED');
    }
  }

  // 获取单个店铺详情
  async getStoreById(storeId: string, userId?: string): Promise<Store> {
    try {
      const where: any = { id: storeId };
      
      // 如果提供了userId，检查权限
      if (userId) {
        where.userId = userId;
      }

      const store = await prisma.store.findUnique({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
          shelves: {
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
          cameras: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!store) {
        throw new AppError(404, '店铺不存在', 'STORE_NOT_FOUND');
      }

      return this.mapStore(store, true);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('获取店铺详情失败:', error);
      throw new AppError(500, '获取店铺详情失败', 'GET_STORE_FAILED');
    }
  }

  // 删除店铺
  async deleteStore(storeId: string, userId: string): Promise<void> {
    try {
      // 检查店铺是否存在且属于该用户
      const store = await prisma.store.findFirst({
        where: {
          id: storeId,
          userId,
        },
        include: {
          shelves: {
            include: {
              products: true,
            },
          },
        },
      });

      if (!store) {
        throw new AppError(404, '店铺不存在或无权限', 'STORE_NOT_FOUND');
      }

      // 检查店铺是否为空（没有货架和商品）
      const hasProducts = store.shelves.some(shelf => shelf.products.length > 0);
      if (hasProducts) {
        throw new AppError(400, '店铺内还有商品，请先清空商品再删除', 'STORE_NOT_EMPTY');
      }

      // 开始事务：删除相关数据
      await prisma.$transaction(async (tx) => {
        // 删除摄像头
        await tx.camera.deleteMany({
          where: { storeId },
        });

        // 删除货架
        await tx.shelf.deleteMany({
          where: { storeId },
        });

        // 删除店铺
        await tx.store.delete({
          where: { id: storeId },
        });
      });

      logger.business('删除店铺', userId, {
        storeId,
        storeName: store.name,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('删除店铺失败:', error);
      throw new AppError(500, '删除店铺失败', 'DELETE_STORE_FAILED');
    }
  }

  // 获取店铺统计信息
  async getStoreStats(storeId: string, userId?: string) {
    try {
      const where: any = { id: storeId };
      if (userId) {
        where.userId = userId;
      }

      const store = await prisma.store.findUnique({
        where,
        include: {
          shelves: {
            include: {
              _count: {
                select: { products: true },
              },
              products: {
                select: {
                  stock: true,
                  price: true,
                  status: true,
                },
              },
            },
          },
          _count: {
            select: {
              shelves: true,
              cameras: true,
            },
          },
        },
      });

      if (!store) {
        throw new AppError(404, '店铺不存在', 'STORE_NOT_FOUND');
      }

      // 计算统计信息
      const shelfStats = store.shelves.map(shelf => ({
        shelfId: shelf.id,
        labelName: shelf.labelName,
        productCount: shelf._count.products,
        totalStock: shelf.products.reduce((sum, p) => sum + p.stock, 0),
        totalValue: shelf.products.reduce((sum, p) => sum + (p.stock * p.price), 0),
        capacityUsage: shelf.capacity > 0 ? (shelf.currentOccupancy / shelf.capacity) * 100 : 0,
      }));

      const totalProducts = store.shelves.reduce((sum, shelf) => sum + shelf._count.products, 0);
      const totalStock = store.shelves.reduce((sum, shelf) => 
        sum + shelf.products.reduce((s, p) => s + p.stock, 0), 0);
      const totalValue = store.shelves.reduce((sum, shelf) => 
        sum + shelf.products.reduce((s, p) => s + (p.stock * p.price), 0), 0);

      // 获取最近销售数据
      const recentSales = await prisma.productSale.aggregate({
        where: {
          storeId,
          saleDate: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 最近30天
          },
        },
        _sum: {
          amount: true,
          quantity: true,
        },
        _count: {
          id: true,
        },
      });

      return {
        basicInfo: {
          shelfCount: store._count.shelves,
          cameraCount: store._count.cameras,
          productCount: totalProducts,
          totalStock,
          totalValue,
        },
        shelfStats,
        recentSales: {
          amount: recentSales._sum.amount || 0,
          quantity: recentSales._sum.quantity || 0,
          count: recentSales._count.id,
        },
        capacityInfo: {
          totalCapacity: store.shelves.reduce((sum, shelf) => sum + shelf.capacity, 0),
          usedCapacity: store.shelves.reduce((sum, shelf) => sum + shelf.currentOccupancy, 0),
          usagePercentage: store.shelves.reduce((sum, shelf) => sum + shelf.capacity, 0) > 0
            ? (store.shelves.reduce((sum, shelf) => sum + shelf.currentOccupancy, 0) / 
               store.shelves.reduce((sum, shelf) => sum + shelf.capacity, 0)) * 100
            : 0,
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('获取店铺统计信息失败:', error);
      throw new AppError(500, '获取店铺统计信息失败', 'GET_STORE_STATS_FAILED');
    }
  }

  // 添加摄像头
  async addCamera(storeId: string, data: {
    name: string;
    streamUrl: string;
    position: string;
    userId: string;
  }) {
    try {
      // 检查店铺权限
      const store = await prisma.store.findFirst({
        where: {
          id: storeId,
          userId: data.userId,
        },
      });

      if (!store) {
        throw new AppError(404, '店铺不存在或无权限', 'STORE_NOT_FOUND');
      }

      const camera = await prisma.camera.create({
        data: {
          storeId,
          name: data.name,
          streamUrl: data.streamUrl,
          position: data.position,
          status: 'active',
        },
      });

      logger.business('添加摄像头', data.userId, {
        storeId,
        cameraId: camera.id,
        cameraName: data.name,
      });

      return {
        id: camera.id,
        name: camera.name,
        streamUrl: camera.streamUrl,
        position: camera.position,
        status: camera.status,
        createdAt: camera.createdAt,
        updatedAt: camera.updatedAt,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('添加摄像头失败:', error);
      throw new AppError(500, '添加摄像头失败', 'ADD_CAMERA_FAILED');
    }
  }

  // 店铺对象映射
  private mapStore(store: any, includeRelations: boolean = false): Store {
    const mapped: any = {
      id: store.id,
      userId: store.userId,
      name: store.name,
      description: store.description || undefined,
      address: store.address || undefined,
      phone: store.phone || undefined,
      cameraStreamUrl: store.cameraStreamUrl || undefined,
      status: store.status as any,
      createdAt: store.createdAt,
      updatedAt: store.updatedAt,
    };

    if (includeRelations) {
      if (store.user) {
        mapped.owner = {
          id: store.user.id,
          username: store.user.username,
        };
      }

      if (store.shelves) {
        mapped.shelves = store.shelves.map((shelf: any) => ({
          id: shelf.id,
          labelName: shelf.labelName,
          description: shelf.description || undefined,
          position: shelf.position,
          capacity: shelf.capacity,
          currentOccupancy: shelf.currentOccupancy,
          status: shelf.status as any,
          createdAt: shelf.createdAt,
          updatedAt: shelf.updatedAt,
        }));
      }

      if (store.cameras) {
        mapped.cameras = store.cameras.map((camera: any) => ({
          id: camera.id,
          name: camera.name,
          streamUrl: camera.streamUrl,
          position: camera.position,
          status: camera.status,
          createdAt: camera.createdAt,
          updatedAt: camera.updatedAt,
        }));
      }
    }

    return mapped as Store;
  }
}

export const storeService = new StoreService();