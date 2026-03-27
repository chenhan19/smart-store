import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
dotenv.config();

// 应用配置
export const config = {
  // 服务器配置
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    isTest: process.env.NODE_ENV === 'test',
  },

  // 数据库配置
  database: {
    url: process.env.DATABASE_URL || 'mysql://smartstore:smartstore123@localhost:3306/smart_store',
  },

  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // CORS配置
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:8080'],
    credentials: true,
  },

  // 微信配置
  wechat: {
    appId: process.env.WECHAT_APPID || '',
    secret: process.env.WECHAT_SECRET || '',
  },

  // Redis配置
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // 上传配置
  upload: {
    maxSize: process.env.UPLOAD_MAX_SIZE || '10mb',
    dir: process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'),
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },

  // 速率限制
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 限制每个IP 100个请求
  },

  // 日志配置
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || path.join(process.cwd(), 'logs'),
  },

  // 应用信息
  app: {
    name: process.env.APP_NAME || '智慧店铺管理系统',
    version: process.env.APP_VERSION || '1.0.0',
    description: '基于微信小程序的多店铺智能仓储管理系统',
  },
};

// 类型导出
export type Config = typeof config;

// 辅助函数：验证配置
export function validateConfig(): void {
  const required = ['JWT_SECRET', 'WECHAT_APPID', 'WECHAT_SECRET'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (!config.database.url) {
    throw new Error('DATABASE_URL is required');
  }
}