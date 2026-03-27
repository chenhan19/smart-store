import { Router } from 'express';
import { authenticate, requireRole, requireStoreAccess } from '../middleware/auth';
import { validate, storeValidators, commonValidators } from '../utils/validation';
import { storeService } from '../services/store.service';
import { ApiResponse } from '@shared/types';

const router = Router();

// 所有店铺路由都需要认证
router.use(authenticate);

// 获取店铺列表
router.get(
  '/',
  async (req, res, next) => {
    try {
      const result = await storeService.getStores({
        userId: req.user!.id,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
        status: req.query.status as string,
        keyword: req.query.keyword as string,
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

// 创建店铺
router.post(
  '/',
  requireRole('store_owner', 'admin'),
  validate(storeValidators.create),
  async (req, res, next) => {
    try {
      const store = await storeService.createStore({
        ...req.body,
        userId: req.user!.id,
      });

      const response: ApiResponse = {
        success: true,
        data: store,
        message: '店铺创建成功',
        code: 'STORE_CREATED',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

// 获取单个店铺详情
router.get(
  '/:id',
  validate([commonValidators.id]),
  async (req, res, next) => {
    try {
      const store = await storeService.getStoreById(req.params.id, req.user!.id);
      
      const response: ApiResponse = {
        success: true,
        data: store,
        code: 'SUCCESS',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// 更新店铺
router.put(
  '/:id',
  validate([
    commonValidators.id,
    ...storeValidators.update,
  ]),
  requireStoreAccess,
  async (req, res, next) => {
    try {
      const store = await storeService.updateStore(req.params.id, {
        ...req.body,
        userId: req.user!.id,
      });

      const response: ApiResponse = {
        success: true,
        data: store,
        message: '店铺更新成功',
        code: 'STORE_UPDATED',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// 删除店铺
router.delete(
  '/:id',
  validate([commonValidators.id]),
  requireStoreAccess,
  async (req, res, next) => {
    try {
      await storeService.deleteStore(req.params.id, req.user!.id);

      const response: ApiResponse = {
        success: true,
        message: '店铺删除成功',
        code: 'STORE_DELETED',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// 获取店铺统计信息
router.get(
  '/:id/stats',
  validate([commonValidators.id]),
  requireStoreAccess,
  async (req, res, next) => {
    try {
      const stats = await storeService.getStoreStats(req.params.id, req.user!.id);

      const response: ApiResponse = {
        success: true,
        data: stats,
        code: 'SUCCESS',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// 添加摄像头
router.post(
  '/:id/cameras',
  validate([commonValidators.id]),
  requireStoreAccess,
  async (req, res, next) => {
    try {
      const camera = await storeService.addCamera(req.params.id, {
        ...req.body,
        userId: req.user!.id,
      });

      const response: ApiResponse = {
        success: true,
        data: camera,
        message: '摄像头添加成功',
        code: 'CAMERA_ADDED',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

// 获取店铺摄像头列表
router.get(
  '/:id/cameras',
  validate([commonValidators.id]),
  requireStoreAccess,
  async (req, res, next) => {
    try {
      const store = await storeService.getStoreById(req.params.id, req.user!.id);
      
      const response: ApiResponse = {
        success: true,
        data: {
          cameras: store.cameras || [],
        },
        code: 'SUCCESS',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;