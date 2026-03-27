import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// 跳过日志的路由
const SKIP_LOGS = ['/health', '/favicon.ico'];

// 请求日志中间件
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  // 跳过健康检查和favicon请求
  if (SKIP_LOGS.some(path => req.path.includes(path))) {
    return next();
  }

  const start = Date.now();
  const { method, originalUrl, ip } = req;

  // 记录请求开始
  logger.info(`📥 请求开始: ${method} ${originalUrl}`, {
    method,
    path: originalUrl,
    ip,
    userAgent: req.get('User-Agent'),
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    body: method !== 'GET' && Object.keys(req.body).length > 0 ? req.body : undefined,
    user: (req as any).user?.id,
  });

  // 在响应结束时记录
  const originalSend = res.send;
  res.send = function (body) {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    // 根据状态码决定日志级别
    if (statusCode >= 400 && statusCode < 500) {
      logger.warn(`📤 请求完成: ${method} ${originalUrl} - ${statusCode} (${duration}ms)`, {
        method,
        path: originalUrl,
        statusCode,
        duration,
        ip,
        user: (req as any).user?.id,
        error: body,
      });
    } else if (statusCode >= 500) {
      logger.error(`📤 请求错误: ${method} ${originalUrl} - ${statusCode} (${duration}ms)`, {
        method,
        path: originalUrl,
        statusCode,
        duration,
        ip,
        user: (req as any).user?.id,
        error: body,
      });
    } else {
      logger.info(`📤 请求完成: ${method} ${originalUrl} - ${statusCode} (${duration}ms)`, {
        method,
        path: originalUrl,
        statusCode,
        duration,
        ip,
        user: (req as any).user?.id,
        responseSize: body?.length || 0,
      });
    }

    return originalSend.call(this, body);
  };

  next();
};