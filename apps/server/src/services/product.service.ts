import { prisma, db } from '@database/index';
import { 
  Product, 
  CreateProductRequest, 
  UpdateProductRequest, 
  StockOperationRequest,
  ScanRequest,
  ScanResponse,
  StockOperationType,
  PaginationParams,
  PaginatedResponse
} from '@shared/types';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class ProductService {
  // 创建商品
  async createProduct(data: CreateProductRequest & { shelfId: string; userId: string }): Promise<Product> {
    try {
      // 检查货架是否存在
      const shelf = await prisma.shelf.findUnique({
        where: { id: data.shelfId },
        include: { store: true },
      });

      if (!shelf) {
        throw new AppError(404, '货架不存在', 'SHELF_NOT_FOUND');
      }

      // 检查条形码是否已存在
      const existingProduct = await prisma.product.findUnique({
        where: { barcode: data.barcode },
      });

      if (existingProduct) {
        throw new AppError(409, '条形码已存在', 'BARCODE_EXISTS');
      }

      // 创建商品
      const product = await prisma.product.create({
        data: {
          shelfId: data.shelfId,
          barcode: data.barcode,
          name: data.name,
          description: data.description,
          category: data.category,
          unit: data.unit,
          price: data.price,
          costPrice: data.costPrice,
          stock: 0, // 初始库存为0
          minThreshold: data.minThreshold,
          maxThreshold: data.maxThreshold,
          specifications: data.specifications || {},
          images: data.images ? JSON.stringify(data.images) : null,
          status: 'active',
        },
      });

      // 更新货架占用情况
      await prisma.shelf.update({
        where: { id: data.shelfId },
        data: {
          currentOccupancy: { increment: 1 },
        },
      });

      // 记录操作日志
      await this.createStockLog({
        productId: product.id,
        operationType: StockOperationType.IN,
        quantity: 0,
        previousStock: 0,
        newStock: 0,
        operatorId: data.userId,
        remark: '商品创建',
      });

      logger.business('创建商品', data.userId, {
        productId: product.id,
        barcode: data.barcode,
        name: data.name,
        shelfId: data.shelfId,
      });

      return this.mapProduct(product);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('创建商品失败:', error);
      throw new AppError(500, '创建商品失败', 'CREATE_PRODUCT_FAILED');
    }
  }

  // 更新商品
  async updateProduct(productId: string, data: UpdateProductRequest & { userId: string }): Promise<Product> {
    try {
      // 检查商品是否存在
      const existingProduct = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!existingProduct) {
        throw new AppError(404, '商品不存在', 'PRODUCT_NOT_FOUND');
      }

      // 更新商品
      const product = await prisma.product.update({
        where: { id: productId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.category !== undefined && { category: data.category }),
          ...(data.unit && { unit: data.unit }),
          ...(data.price !== undefined && { price: data.price }),
          ...(data.costPrice !== undefined && { costPrice: data.costPrice }),
          ...(data.minThreshold !== undefined && { minThreshold: data.minThreshold }),
          ...(data.maxThreshold !== undefined && { maxThreshold: data.maxThreshold }),
          ...(data.specifications !== undefined && { specifications: data.specifications }),
          ...(data.status && { status: data.status }),
          updatedAt: new Date(),
        },
      });

      logger.business('更新商品', data.userId, {
        productId,
        updatedFields: Object.keys(data),
      });

      return this.mapProduct(product);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('更新商品失败:', error);
      throw new AppError(500, '更新商品失败', 'UPDATE_PRODUCT_FAILED');
    }
  }

  // 获取商品操作日志
  async getProductLogs(productId: string, page: number = 1, limit: number = 20) {
    try {
      const where = { productId };
      
      const [logs, total] = await Promise.all([
        prisma.log.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            operator: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        }),
        prisma.log.count({ where }),
      ]);

      return {
        items: logs.map(log => ({
          id: log.id,
          productId: log.productId,
          operationType: log.operationType as StockOperationType,
          quantity: log.quantity,
          previousStock: log.previousStock,
          newStock: log.newStock,
          operator: {
            id: log.operator.id,
            username: log.operator.username,
          },
          referenceId: log.referenceId || undefined,
          remark: log.remark || undefined,
          createdAt: log.createdAt,
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('获取商品操作日志失败:', error);
      throw new AppError(500, '获取操作日志失败', 'GET_LOGS_FAILED');
    }
  }

  // 删除商品（软删除）
  async deleteProduct(productId: string, userId: string): Promise<void> {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          shelf: true,
        },
      });

      if (!product) {
        throw new AppError(404, '商品不存在', 'PRODUCT_NOT_FOUND');
      }

      // 软删除：更改状态
      await prisma.product.update({
        where: { id: productId },
        data: {
          status: 'discontinued',
          updatedAt: new Date(),
        },
      });

      // 更新货架占用情况
      await prisma.shelf.update({
        where: { id: product.shelfId },
        data: {
          currentOccupancy: { decrement: 1 },
        },
      });

      // 记录操作日志
      await this.createStockLog({
        productId,
        operationType: StockOperationType.ADJUST,
        quantity: 0,
        previousStock: product.stock,
        newStock: 0,
        operatorId: userId,
        remark: '商品下架删除',
      });

      logger.business('删除商品', userId, {
        productId,
        productName: product.name,
        stock: product.stock,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('删除商品失败:', error);
      throw new AppError(500, '删除商品失败', 'DELETE_PRODUCT_FAILED');
    }
  }

  // 获取商品列表（支持分页和搜索）
  async getProducts(params: PaginationParams & {
    storeId?: string;
    shelfId?: string;
    category?: string;
    status?: string;
    keyword?: string;
    lowStock?: boolean;
  }): Promise<PaginatedResponse<Product>> {
    try {
      const where: any = {};

      // 按店铺筛选
      if (params.storeId) {
        where.shelf = {
          storeId: params.storeId,
        };
      }

      // 按货架筛选
      if (params.shelfId) {
        where.shelfId = params.shelfId;
      }

      // 按分类筛选
      if (params.category) {
        where.category = params.category;
      }

      // 按状态筛选
      if (params.status) {
        where.status = params.status;
      }

      // 按关键词搜索（条形码或名称）
      if (params.keyword) {
        where.OR = [
          { barcode: { contains: params.keyword } },
          { name: { contains: params.keyword } },
        ];
      }

      // 低库存筛选
      if (params.lowStock) {
        where.stock = { lte: prisma.product.fields.minThreshold };
      }

      const page = params.page || 1;
      const limit = params.limit || 20;
      const orderBy = params.sortBy 
        ? { [params.sortBy]: params.sortOrder || 'desc' }
        : { createdAt: 'desc' };

      const result = await db.paginate(prisma.product, where, page, limit, orderBy);

      return {
        ...result,
        items: result.items.map(product => this.mapProduct(product)),
      };
    } catch (error) {
      logger.error('获取商品列表失败:', error);
      throw new AppError(500, '获取商品列表失败', 'GET_PRODUCTS_FAILED');
    }
  }

  // 获取单个商品详情
  async getProductById(productId: string): Promise<Product> {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          shelf: {
            include: {
              store: true,
            },
          },
        },
      });

      if (!product) {
        throw new AppError(404, '商品不存在', 'PRODUCT_NOT_FOUND');
      }

      return this.mapProduct(product, true);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('获取商品详情失败:', error);
      throw new AppError(500, '获取商品详情失败', 'GET_PRODUCT_FAILED');
    }
  }

  // 扫码处理
  async handleScan(data: ScanRequest & { userId: string }): Promise<ScanResponse> {
    try {
      // 查找商品
      const product = await prisma.product.findUnique({
        where: { barcode: data.barcode },
        include: {
          shelf: {
            include: {
              store: true,
            },
          },
        },
      });

      if (!product) {
        logger.scan(data.barcode, '扫码：商品不存在', data.userId, { exists: false });
        return {
          exists: false,
          message: '商品不存在，请先录入商品信息',
        };
      }

      // 检查店铺权限（如果提供了storeId）
      if (data.storeId && product.shelf.storeId !== data.storeId) {
        throw new AppError(403, '该商品不属于指定店铺', 'PRODUCT_NOT_IN_STORE');
      }

      // 检查货架权限（如果提供了shelfId）
      if (data.shelfId && product.shelfId !== data.shelfId) {
        throw new AppError(403, '该商品不在指定货架上', 'PRODUCT_NOT_ON_SHELF');
      }

      logger.scan(data.barcode, '扫码：商品存在', data.userId, {
        exists: true,
        productId: product.id,
        productName: product.name,
        stock: product.stock,
      });

      return {
        product: this.mapProduct(product, true),
        exists: true,
        message: '商品已找到',
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('扫码处理失败:', error);
      throw new AppError(500, '扫码处理失败', 'SCAN_FAILED');
    }
  }

  // 商品入库
  async stockIn(productId: string, data: StockOperationRequest & { userId: string }): Promise<Product> {
    try {
      return await this.updateStock(productId, {
        ...data,
        operationType: StockOperationType.IN,
        userId: data.userId,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('商品入库失败:', error);
      throw new AppError(500, '商品入库失败', 'STOCK_IN_FAILED');
    }
  }

  // 商品出库
  async stockOut(productId: string, data: StockOperationRequest & { userId: string }): Promise<Product> {
    try {
      return await this.updateStock(productId, {
        ...data,
        operationType: StockOperationType.OUT,
        userId: data.userId,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('商品出库失败:', error);
      throw new AppError(500, '商品出库失败', 'STOCK_OUT_FAILED');
    }
  }

  // 更新库存（内部方法）
  private async updateStock(productId: string, data: {
    operationType: StockOperationType;
    quantity: number;
    userId: string;
    remark?: string;
    referenceId?: string;
  }): Promise<Product> {
    return await prisma.$transaction(async (tx) => {
      // 获取当前商品信息（使用行级锁）
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new AppError(404, '商品不存在', 'PRODUCT_NOT_FOUND');
      }

      if (product.status !== 'active') {
        throw new AppError(400, '商品已下架或禁用', 'PRODUCT_INACTIVE');
      }

      const previousStock = product.stock;
      let newStock = previousStock;

      // 根据操作类型计算新库存
      switch (data.operationType) {
        case StockOperationType.IN:
          newStock = previousStock + data.quantity;
          break;
        case StockOperationType.OUT:
          if (previousStock < data.quantity) {
            throw new AppError(400, '库存不足', 'INSUFFICIENT_STOCK');
          }
          newStock = previousStock - data.quantity;
          break;
        case StockOperationType.ADJUST:
          newStock = data.quantity;
          break;
        default:
          throw new AppError(400, '不支持的操作类型', 'INVALID_OPERATION_TYPE');
      }

      // 更新商品库存
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          stock: newStock,
          status: newStock <= 0 ? 'out_of_stock' : 'active',
          updatedAt: new Date(),
        },
      });

      // 创建库存操作日志
      await this.createStockLog({
        productId,
        operationType: data.operationType,
        quantity: data.quantity,
        previousStock,
        newStock,
        operatorId: data.userId,
        referenceId: data.referenceId,
        remark: data.remark,
      });

      // 如果是出库，创建销售记录
      if (data.operationType === StockOperationType.OUT) {
        await tx.productSale.create({
          data: {
            productId,
            quantity: data.quantity,
            amount: data.quantity * product.price,
            storeId: (await tx.shelf.findUnique({
              where: { id: product.shelfId },
              select: { storeId: true },
            }))?.storeId || undefined,
          },
        });
      }

      // 检查库存预警
      await this.checkInventoryAlert(updatedProduct, data.userId);

      logger.business('库存操作', data.userId, {
        productId,
        operationType: data.operationType,
        quantity: data.quantity,
        previousStock,
        newStock,
        productName: product.name,
      });

      return this.mapProduct(updatedProduct);
    });
  }

  // 检查库存预警
  private async checkInventoryAlert(product: any, userId: string): Promise<void> {
    // 库存过低预警
    if (product.stock <= product.minThreshold && product.stock > 0) {
      const existingAlert = await prisma.inventoryAlert.findFirst({
        where: {
          productId: product.id,
          alertType: 'low_stock',
          isResolved: false,
        },
      });

      if (!existingAlert) {
        await prisma.inventoryAlert.create({
          data: {
            productId: product.id,
            alertType: 'low_stock',
            currentStock: product.stock,
            threshold: product.minThreshold,
          },
        });

        logger.warn(`库存预警：商品 ${product.name} 库存过低`, {
          productId: product.id,
          currentStock: product.stock,
          threshold: product.minThreshold,
        });
      }
    }

    // 缺货预警
    if (product.stock <= 0 && product.status !== 'out_of_stock') {
      const existingAlert = await prisma.inventoryAlert.findFirst({
        where: {
          productId: product.id,
          alertType: 'out_of_stock',
          isResolved: false,
        },
      });

      if (!existingAlert) {
        await prisma.inventoryAlert.create({
          data: {
            productId: product.id,
            alertType: 'out_of_stock',
            currentStock: product.stock,
            threshold: 0,
          },
        });

        logger.warn(`库存预警：商品 ${product.name} 已缺货`, {
          productId: product.id,
          currentStock: product.stock,
        });
      }
    }
  }

  // 创建库存操作日志（内部方法）
  private async createStockLog(data: {
    productId: string;
    operationType: StockOperationType;
    quantity: number;
    previousStock: number;
    newStock: number;
    operatorId: string;
    referenceId?: string;
    remark?: string;
  }): Promise<void> {
    await prisma.log.create({
      data: {
        productId: data.productId,
        operationType: data.operationType,
        quantity: data.quantity,
        previousStock: data.previousStock,
        newStock: data.newStock,
        operatorId: data.operatorId,
        referenceId: data.referenceId,
        remark: data.remark,
      },
    });
  }

  // 商品对象映射
  private mapProduct(product: any, includeRelations: boolean = false): Product {
    const mapped: any = {
      id: product.id,
      shelfId: product.shelfId,
      barcode: product.barcode,
      name: product.name,
      description: product.description || undefined,
      category: product.category || undefined,
      unit: product.unit,
      price: product.price,
      costPrice: product.costPrice || undefined,
      stock: product.stock,
      minThreshold: product.minThreshold,
      maxThreshold: product.maxThreshold || undefined,
      images: product.images ? JSON.parse(product.images) : undefined,
      specifications: product.specifications || undefined,
      status: product.status as any,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    if (includeRelations && product.shelf) {
      mapped.shelf = {
        id: product.shelf.id,
        storeId: product.shelf.storeId,
        labelName: product.shelf.labelName,
        description: product.shelf.description || undefined,
        position: product.shelf.position,
        capacity: product.shelf.capacity,
        currentOccupancy: product.shelf.currentOccupancy,
        status: product.shelf.status as any,
        createdAt: product.shelf.createdAt,
        updatedAt: product.shelf.updatedAt,
      };

      if (product.shelf.store) {
        mapped.store = {
          id: product.shelf.store.id,
          userId: product.shelf.store.userId,
          name: product.shelf.store.name,
          description: product.shelf.store.description || undefined,
          address: product.shelf.store.address || undefined,
          phone: product.shelf.store.phone || undefined,
          cameraStreamUrl: product.shelf.store.cameraStreamUrl || undefined,
          status: product.shelf.store.status as any,
          createdAt: product.shelf.store.createdAt,
          updatedAt: product.shelf.store.updatedAt,
        };
      }
    }

    return mapped as Product;
  }
}

export const productService = new ProductService();