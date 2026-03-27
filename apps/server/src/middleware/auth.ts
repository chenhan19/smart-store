import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';
import { prisma } from '@database/index';
import { AppError } from './errorHandler';
import { logger } from '../utils/logger';

// 扩展Express Request类型以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        openid: string;
        username: string;
        role: string;
      };
    }
  }
}

// 认证中间件
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 从请求头中提取令牌
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      throw new AppError(401, '未提供认证令牌', 'UNAUTHORIZED');
    }

    // 验证令牌
    const payload = verifyToken(token);
    
    // 检查用户是否存在且状态正常
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        openid: true,
        username: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      throw new AppError(401, '用户不存在', 'USER_NOT_FOUND');
    }

    if (user.status !== 'active') {
      throw new AppError(403, '用户账户已被禁用', 'USER_INACTIVE');
    }

    // 将用户信息附加到请求对象
    req.user = {
      id: user.id,
      openid: user.openid,
      username: user.username,
      role: user.role,
    };

    // 记录认证成功
    logger.debug(`用户认证成功: ${user.username} (${user.role})`, {
      userId: user.id,
      path: req.path,
      method: req.method,
    });

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else if (error.message === 'TOKEN_EXPIRED') {
      next(new AppError(401, '认证令牌已过期', 'TOKEN_EXPIRED'));
    } else if (error.message === 'INVALID_TOKEN') {
      next(new AppError(401, '无效的认证令牌', 'INVALID_TOKEN'));
    } else {
      logger.error('认证过程中发生错误:', error);
      next(new AppError(500, '认证失败', 'AUTHENTICATION_FAILED'));
    }
  }
};

// 角色权限检查中间件
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, '用户未认证', 'UNAUTHORIZED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`权限拒绝: ${req.user.username} (${req.user.role}) 尝试访问需要 ${allowedRoles.join(', ')} 角色的资源`, {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        path: req.path,
        method: req.method,
      });
      
      return next(new AppError(403, '权限不足', 'FORBIDDEN'));
    }

    next();
  };
};

// 店铺权限检查中间件（检查用户是否拥有该店铺）
export const requireStoreAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError(401, '用户未认证', 'UNAUTHORIZED'));
    }

    const storeId = req.params.storeId || req.body.storeId || req.query.storeId;
    
    if (!storeId) {
      return next(new AppError(400, '缺少店铺ID参数', 'MISSING_STORE_ID'));
    }

    // 管理员可以访问所有店铺
    if (req.user.role === 'admin') {
      return next();
    }

    // 检查用户是否拥有该店铺
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        userId: req.user.id,
      },
    });

    if (!store) {
      logger.warn(`店铺访问拒绝: 用户 ${req.user.username} 尝试访问店铺 ${storeId}`, {
        userId: req.user.id,
        storeId,
        path: req.path,
        method: req.method,
      });
      
      return next(new AppError(403, '无权访问该店铺', 'STORE_ACCESS_DENIED'));
    }

    // 将店铺信息附加到请求对象
    (req as any).store = store;

    next();
  } catch (error) {
    logger.error('店铺权限检查失败:', error);
    next(new AppError(500, '权限检查失败', 'PERMISSION_CHECK_FAILED'));
  }
};

// 员工权限检查（店员只能访问自己店铺）
export const requireEmployeeStoreAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError(401, '用户未认证', 'UNAUTHORIZED'));
    }

    // 如果是店主或管理员，直接通过
    if (req.user.role === 'store_owner' || req.user.role === 'admin') {
      return next();
    }

    // 店员需要检查是否有分配的店铺访问权限
    const storeId = req.params.storeId || req.body.storeId || req.query.storeId;
    
    if (!storeId) {
      return next(new AppError(400, '缺少店铺ID参数', 'MISSING_STORE_ID'));
    }

    // 这里可以添加员工店铺分配表的检查
    // 暂时假设所有店员都可以访问所有店铺（实际项目需要调整）
    
    next();
  } catch (error) {
    logger.error('员工权限检查失败:', error);
    next(new AppError(500, '权限检查失败', 'PERMISSION_CHECK_FAILED'));
  }
};

// 可选认证中间件（认证失败也不阻止请求）
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return next();
    }

    const payload = verifyToken(token);
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        openid: true,
        username: true,
        role: true,
        status: true,
      },
    });

    if (user && user.status === 'active') {
      req.user = {
        id: user.id,
        openid: user.openid,
        username: user.username,
        role: user.role,
      };
    }
  } catch (error) {
    // 静默失败，不设置用户信息
  }
  
  next();
};