import { Router } from 'express';
import { authenticate, requireRole, requireStoreAccess } from '../middleware/auth';
import { validate, productValidators, searchValidators, commonValidators } from '../utils/validation';
import { productService } from '../services/product.service';
import { ApiResponse } from '@shared/types';

const router = Router();

// 所有商品路由都需要认证
router.use(authenticate);

// 获取商品列表
router.get(
  '/',
  validate([
    ...searchValidators.searchProducts,
    ...commonValidators.pagination,
  ]),
  async (req, res, next) => {
    try {
      const result = await productService.getProducts({
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
        storeId: req.query.storeId as string,
        shelfId: req.query.shelfId as string,
        category: req.query.category as string,
        status: req.query.status as string,
        keyword: req.query.keyword as string,
        lowStock: req.query.lowStock === 'true',
      });

      const response: ApiResponse = {
        success: true,
        data: result,
        code: 'SUCCESS',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// 获取单个商品详情
router.get(
  '/:id',
  validate([commonValidators.id]),
  async (req, res, next) => {
    try {
      const product = await productService.getProductById(req.params.id);
      
      const response: ApiResponse = {
        success: true,
        data: product,
        code: 'SUCCESS',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// 创建商品（需要店主或管理员权限）
router.post(
  '/',
  requireRole('store_owner', 'admin'),
  validate(productValidators.create),
  async (req, res, next) => {
    try {
      const product = await productService.createProduct({
        ...req.body,
        userId: req.user!.id,
      });

      const response: ApiResponse = {
        success: true,
        data: product,
        message: '商品创建成功',
        code: 'PRODUCT_CREATED',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

// 更新商品
router.put(
  '/:id',
  validate([
    commonValidators.id,
    ...productValidators.update,
  ]),
  async (req, res, next) => {
    try {
      const product = await productService.updateProduct(req.params.id, {
        ...req.body,
        userId: req.user!.id,
      });

      const response: ApiResponse = {
        success: true,
        data: product,
        message: '商品更新成功',
        code: 'PRODUCT_UPDATED',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// 扫码处理
router.post(
  '/scan',
  validate(productValidators.scan),
  async (req, res, next) => {
    try {
      const result = await productService.handleScan({
        ...req.body,
        userId: req.user!.id,
      });

      const response: ApiResponse = {
        success: true,
        data: result,
        code: 'SCAN_SUCCESS',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// 商品入库
router.post(
  '/:id/stock-in',
  validate([
    commonValidators.id,
    ...productValidators.stockOperation,
  ]),
  async (req, res, next) => {
    try {
      const product = await productService.stockIn(req.params.id, {
        ...req.body,
        userId: req.user!.id,
      });

      const response: ApiResponse = {
        success: true,
        data: product,
        message: '商品入库成功',
        code: 'STOCK_IN_SUCCESS',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// 商品出库
router.post(
  '/:id/stock-out',
  validate([
    commonValidators.id,
    ...productValidators.stockOperation,
  ]),
  async (req, res, next) => {
    try {
      const product = await productService.stockOut(req.params.id, {
        ...req.body,
        userId: req.user!.id,
      });

      const response: ApiResponse = {
        success: true,
        data: product,
        message: '商品出库成功',
        code: 'STOCK_OUT_SUCCESS',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// 获取商品操作日志
router.get(
  '/:id/logs',
  validate([commonValidators.id]),
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const logs = await productService.getProductLogs(
        req.params.id,
        page,
        limit
      );

      const response: ApiResponse = {
        success: true,
        data: logs,
        code: 'SUCCESS',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// 删除商品（软删除）
router.delete(
  '/:id',
  requireRole('store_owner', 'admin'),
  validate([commonValidators.id]),
  async (req, res, next) => {
    try {
      await productService.deleteProduct(req.params.id, req.user!.id);

      const response: ApiResponse = {
        success: true,
        message: '商品删除成功',
        code: 'PRODUCT_DELETED',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;