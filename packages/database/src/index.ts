import { PrismaClient } from '@prisma/client';

// 全局变量用于存储Prisma客户端实例
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 创建Prisma客户端实例
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// 在开发环境中，将实例存储在全局变量中以避免热重载时重复创建
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// 导出Prisma客户端类型
export type PrismaClientType = typeof prisma;

// 数据库连接辅助函数
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  console.log('🔌 Database disconnected');
}

// 数据库健康检查
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

// 数据库工具函数
export const db = {
  // 事务包装器
  async transaction<T>(callback: (tx: PrismaClientType) => Promise<T>): Promise<T> {
    return await prisma.$transaction(callback);
  },

  // 批量操作
  async batch<T>(items: T[], callback: (item: T, tx: PrismaClientType) => Promise<void>): Promise<void> {
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        await callback(item, tx);
      }
    });
  },

  // 分页查询助手
  async paginate<T>(
    model: any,
    where: any = {},
    page: number = 1,
    limit: number = 20,
    orderBy: any = { createdAt: 'desc' }
  ) {
    const skip = (page - 1) * limit;
    
    const [items, total] = await Promise.all([
      model.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      model.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },
};