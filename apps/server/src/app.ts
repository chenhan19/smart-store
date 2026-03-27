import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config, validateConfig } from './config';
import { connectDatabase, checkDatabaseHealth } from '@database/index';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { requestLogger } from './middleware/requestLogger';
import authRoutes from './routes/auth.routes';
import storeRoutes from './routes/store.routes';
import productRoutes from './routes/product.routes';
import analyticsRoutes from './routes/analytics.routes';

// 验证配置
validateConfig();

// 创建Express应用
const app = express();

// 安全中间件
app.use(helmet());

// CORS配置
app.use(cors(config.cors));

// 请求体解析
app.use(express.json({ limit: config.upload.maxSize }));
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use(requestLogger);

// 速率限制
if (config.server.isProduction) {
  app.use(
    '/api/',
    rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      message: '请求过于频繁，请稍后再试',
    })
  );
}

// 健康检查端点
app.get('/health', async (req, res) => {
  const dbHealth = await checkDatabaseHealth();
  const healthStatus = {
    status: dbHealth ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    service: config.app.name,
    version: config.app.version,
    database: dbHealth ? 'connected' : 'disconnected',
    environment: config.server.nodeEnv,
  };

  res.status(dbHealth ? 200 : 503).json(healthStatus);
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `找不到路由: ${req.originalUrl}`,
  });
});

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
async function startServer() {
  try {
    // 连接数据库
    await connectDatabase();

    // 启动服务器
    const server = app.listen(config.server.port, config.server.host, () => {
      logger.info(`🚀 服务器已启动`);
      logger.info(`📡 环境: ${config.server.nodeEnv}`);
      logger.info(`🌐 地址: http://${config.server.host}:${config.server.port}`);
      logger.info(`📊 健康检查: http://${config.server.host}:${config.server.port}/health`);
      logger.info(`📦 应用: ${config.app.name} v${config.app.version}`);
    });

    // 优雅关闭
    const shutdown = async () => {
      logger.info('🛑 收到关闭信号，正在优雅关闭...');
      server.close(async () => {
        logger.info('👋 HTTP服务器已关闭');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    return server;
  } catch (error) {
    logger.error('❌ 启动服务器失败:', error);
    process.exit(1);
  }
}

// 启动服务器（如果不是在测试环境中）
if (require.main === module) {
  startServer();
}

export { app, startServer };