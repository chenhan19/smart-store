import { Router } from 'express';
import { validate, userValidators } from '../utils/validation';
import { userService } from '../services/user.service';
import { authenticate, optionalAuth } from '../middleware/auth';
import { refreshToken, decodeToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { ApiResponse } from '@shared/types';

const router = Router();

// 用户登录（微信登录）
router.post(
  '/login',
  validate(userValidators.login),
  async (req, res, next) => {
    try {
      const result = await userService.login(req.body);
      
      const response: ApiResponse = {
        success: true,
        data: result,
        message: '登录成功',
        code: 'LOGIN_SUCCESS',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// 获取用户信息
router.get(
  '/me',
  authenticate,
  async (req, res, next) => {
    try {
      const user = await userService.getUserById(req.user!.id);
      
      const response: ApiResponse = {
        success: true,
        data: user,
        code: 'SUCCESS',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// 更新用户信息
router.put(
  '/me',
  authenticate,
  validate(userValidators.updateProfile),
  async (req, res, next) => {
    try {
      const user = await userService.updateUser(req.user!.id, req.body);
      
      const response: ApiResponse = {
        success: true,
        data: user,
        message: '用户信息更新成功',
        code: 'PROFILE_UPDATED',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// 刷新令牌
router.post(
  '/refresh',
  optionalAuth,
  async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        throw new AppError(401, '未提供令牌', 'UNAUTHORIZED');
      }

      const newToken = refreshToken(token);
      if (!newToken) {
        throw new AppError(400, '令牌无需刷新', 'TOKEN_NOT_EXPIRED');
      }

      const response: ApiResponse = {
        success: true,
        data: { token: newToken },
        message: '令牌刷新成功',
        code: 'TOKEN_REFRESHED',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// 检查用户名是否可用
router.get(
  '/check-username',
  async (req, res, next) => {
    try {
      const { username } = req.query;
      if (!username || typeof username !== 'string') {
        throw new AppError(400, '请提供用户名', 'USERNAME_REQUIRED');
      }

      const result = await userService.checkUsernameAvailability(username);
      
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

// 获取用户统计信息
router.get(
  '/stats',
  authenticate,
  async (req, res, next) => {
    try {
      const stats = await userService.getUserStats(req.user!.id);
      
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

// 获取用户店铺列表
router.get(
  '/stores',
  authenticate,
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const stores = await userService.getUserStores(req.user!.id, page, limit);
      
      const response: ApiResponse = {
        success: true,
        data: stores,
        code: 'SUCCESS',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// 更新用户偏好设置
router.put(
  '/preferences',
  authenticate,
  async (req, res, next) => {
    try {
      await userService.updateUserPreferences(req.user!.id, req.body);
      
      const response: ApiResponse = {
        success: true,
        message: '偏好设置更新成功',
        code: 'PREFERENCES_UPDATED',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// 删除用户账户
router.delete(
  '/me',
  authenticate,
  async (req, res, next) => {
    try {
      await userService.deleteUser(req.user!.id, req.user!.id);
      
      const response: ApiResponse = {
        success: true,
        message: '账户删除成功',
        code: 'ACCOUNT_DELETED',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;