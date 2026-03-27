import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ApiResponse } from '@shared/types';

// 自定义错误类
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// 全局错误处理中间件
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 如果是AppError（自定义错误）
  if (error instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      code: error.code || 'INTERNAL_ERROR',
      message: error.message,
    };

    // 如果是开发环境，返回错误详情
    if (process.env.NODE_ENV === 'development' && error.details) {
      response.data = { details: error.details };
    }

    logger.warn(`业务错误: ${error.code || 'UNKNOWN'} - ${error.message}`, {
      path: req.path,
      method: req.method,
      statusCode: error.statusCode,
    });

    return res.status(error.statusCode).json(response);
  }

  // 如果是JWT验证错误
  if (error.name === 'JsonWebTokenError') {
    logger.warn('JWT验证失败', { path: req.path, method: req.method });
    return res.status(401).json({
      success: false,
      code: 'INVALID_TOKEN',
      message: '无效的认证令牌',
    });
  }

  // 如果是JWT过期错误
  if (error.name === 'TokenExpiredError') {
    logger.warn('JWT已过期', { path: req.path, method: req.method });
    return res.status(401).json({
      success: false,
      code: 'TOKEN_EXPIRED',
      message: '认证令牌已过期',
    });
  }

  // 如果是验证错误（express-validator）
  if (error.name === 'ValidationError') {
    logger.warn('数据验证失败', { path: req.path, method: req.method });
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: '数据验证失败',
      data: { errors: (error as any).errors },
    });
  }

  // 如果是数据库错误
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    
    // 唯一约束冲突
    if (prismaError.code === 'P2002') {
      const field = prismaError.meta?.target?.[0] || '字段';
      logger.warn(`唯一约束冲突: ${field}`, { path: req.path, method: req.method });
      return res.status(409).json({
        success: false,
        code: 'DUPLICATE_ENTRY',
        message: `${field}已存在`,
      });
    }

    // 外键约束失败
    if (prismaError.code === 'P2003') {
      logger.warn('外键约束失败', { path: req.path, method: req.method });
      return res.status(400).json({
        success: false,
        code: 'FOREIGN_KEY_CONSTRAINT',
        message: '关联数据不存在',
      });
    }

    // 记录未找到
    if (prismaError.code === 'P2025') {
      logger.warn('记录不存在', { path: req.path, method: req.method });
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: '请求的资源不存在',
      });
    }
  }

  // 默认错误处理（未预期的错误）
  logger.error('未预期的服务器错误:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    user: (req as any).user?.id,
  });

  const response: ApiResponse = {
    success: false,
    code: 'INTERNAL_SERVER_ERROR',
    message: process.env.NODE_ENV === 'production' 
      ? '服务器内部错误' 
      : error.message,
  };

  // 开发环境下返回错误详情
  if (process.env.NODE_ENV === 'development') {
    response.data = {
      error: error.message,
      stack: error.stack,
    };
  }

  res.status(500).json(response);
};

// 404中间件（用于处理不存在的路由）
export const notFoundHandler = (req: Request, res: Response) => {
  logger.warn(`路由不存在: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    code: 'NOT_FOUND',
    message: `无法找到 ${req.method} ${req.originalUrl}`,
  });
};