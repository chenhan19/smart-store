import winston from 'winston';
import path from 'path';
import { config } from '../config';

// 定义日志级别
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// 根据环境定义日志级别
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'info';
};

// 定义日志颜色
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// 添加颜色
winston.addColors(colors);

// 定义日志格式
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
  winston.format.errors({ stack: true }),
);

// 定义日志传输方式
const transports = [
  // 控制台输出
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
    ),
  }),
];

// 如果是生产环境，添加文件传输
if (config.server.isProduction) {
  transports.push(
    new winston.transports.File({
      filename: path.join(config.logger.dir, 'error.log'),
      level: 'error',
      format: winston.format.combine(
        winston.format.uncolorize(),
        winston.format.json(),
      ),
    }),
    new winston.transports.File({
      filename: path.join(config.logger.dir, 'combined.log'),
      format: winston.format.combine(
        winston.format.uncolorize(),
        winston.format.json(),
      ),
    }),
  );
}

// 创建Winston日志实例
export const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(config.logger.dir, 'exceptions.log'),
      format: winston.format.combine(
        winston.format.uncolorize(),
        winston.format.json(),
      ),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(config.logger.dir, 'rejections.log'),
      format: winston.format.combine(
        winston.format.uncolorize(),
        winston.format.json(),
      ),
    }),
  ],
});

// 日志工具函数
export const log = {
  // 错误日志
  error: (message: string, meta?: any) => {
    logger.error(message, meta);
  },

  // 警告日志
  warn: (message: string, meta?: any) => {
    logger.warn(message, meta);
  },

  // 信息日志
  info: (message: string, meta?: any) => {
    logger.info(message, meta);
  },

  // HTTP请求日志
  http: (message: string, meta?: any) => {
    logger.http(message, meta);
  },

  // 调试日志
  debug: (message: string, meta?: any) => {
    logger.debug(message, meta);
  },

  // 数据库查询日志
  dbQuery: (query: string, duration: number, params?: any) => {
    logger.debug(`📊 DB查询: ${query} (${duration}ms)`, { query, duration, params });
  },

  // 业务操作日志
  business: (action: string, userId: string, details?: any) => {
    logger.info(`🔧 业务操作: ${action}`, { action, userId, ...details });
  },

  // 扫码操作日志
  scan: (barcode: string, action: string, userId: string, result: any) => {
    logger.info(`📱 扫码操作: ${action} - ${barcode}`, { barcode, action, userId, result });
  },
};