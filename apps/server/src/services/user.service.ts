import { prisma, db } from '@database/index';
import { User, UserLoginRequest, UserLoginResponse } from '@shared/types';
import { generateToken, generateRefreshToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

// 模拟微信登录API调用
async function getWechatUserInfo(code: string): Promise<{
  openid: string;
  nickname: string;
  avatar?: string;
}> {
  // 这里应该调用微信API获取用户信息
  // 暂时返回模拟数据
  
  logger.info(`模拟微信登录，code: ${code}`);
  
  return {
    openid: `wx_openid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    nickname: '微信用户',
    avatar: 'https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO3n',
  };
}

export class UserService {
  // 用户登录（微信登录）
  async login(data: UserLoginRequest): Promise<UserLoginResponse> {
    try {
      // 1. 通过微信code获取用户信息
      const wechatUser = await getWechatUserInfo(data.code);
      
      // 2. 查找或创建用户
      let user = await prisma.user.findUnique({
        where: { openid: wechatUser.openid },
      });

      if (!user) {
        // 创建新用户
        user = await prisma.user.create({
          data: {
            openid: wechatUser.openid,
            username: wechatUser.nickname,
            avatar: wechatUser.avatar,
            role: 'store_owner', // 默认角色为店主
            status: 'active',
          },
        });

        // 创建用户偏好设置
        await prisma.userPreference.create({
          data: {
            userId: user.id,
            language: 'zh-CN',
            theme: 'light',
            currency: 'CNY',
            notifications: true,
          },
        });

        logger.business('用户注册', user.id, {
          openid: wechatUser.openid,
          username: wechatUser.nickname,
        });
      } else if (user.status !== 'active') {
        throw new AppError(403, '用户账户已被禁用', 'USER_INACTIVE');
      }

      // 3. 生成JWT令牌
      const token = generateToken(user);
      const refreshToken = generateRefreshToken(user.id);

      // 4. 记录登录日志
      logger.business('用户登录', user.id, {
        ip: '127.0.0.1', // 实际项目中应该从请求中获取
        userAgent: '微信小程序',
      });

      return {
        user: {
          id: user.id,
          openid: user.openid,
          username: user.username,
          avatar: user.avatar || undefined,
          phone: user.phone || undefined,
          email: user.email || undefined,
          role: user.role as any,
          status: user.status as any,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token,
        expiresIn: 7 * 24 * 60 * 60, // 7天
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('用户登录失败:', error);
      throw new AppError(500, '登录失败', 'LOGIN_FAILED');
    }
  }

  // 获取用户信息
  async getUserById(userId: string): Promise<User> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          preferences: true,
        },
      });

      if (!user) {
        throw new AppError(404, '用户不存在', 'USER_NOT_FOUND');
      }

      return {
        id: user.id,
        openid: user.openid,
        username: user.username,
        avatar: user.avatar || undefined,
        phone: user.phone || undefined,
        email: user.email || undefined,
        role: user.role as any,
        status: user.status as any,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('获取用户信息失败:', error);
      throw new AppError(500, '获取用户信息失败', 'GET_USER_FAILED');
    }
  }

  // 更新用户信息
  async updateUser(userId: string, data: Partial<{
    username: string;
    phone: string;
    email: string;
    avatar: string;
  }>): Promise<User> {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(data.username && { username: data.username }),
          ...(data.phone && { phone: data.phone }),
          ...(data.email && { email: data.email }),
          ...(data.avatar && { avatar: data.avatar }),
          updatedAt: new Date(),
        },
      });

      logger.business('更新用户信息', userId, {
        updatedFields: Object.keys(data),
      });

      return {
        id: user.id,
        openid: user.openid,
        username: user.username,
        avatar: user.avatar || undefined,
        phone: user.phone || undefined,
        email: user.email || undefined,
        role: user.role as any,
        status: user.status as any,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      logger.error('更新用户信息失败:', error);
      throw new AppError(500, '更新用户信息失败', 'UPDATE_USER_FAILED');
    }
  }

  // 更新用户偏好设置
  async updateUserPreferences(
    userId: string,
    data: Partial<{
      language: string;
      theme: string;
      currency: string;
      notifications: boolean;
    }>
  ) {
    try {
      await prisma.userPreference.upsert({
        where: { userId },
        update: data,
        create: {
          userId,
          language: data.language || 'zh-CN',
          theme: data.theme || 'light',
          currency: data.currency || 'CNY',
          notifications: data.notifications ?? true,
        },
      });

      logger.business('更新用户偏好设置', userId, {
        updatedFields: Object.keys(data),
      });
    } catch (error) {
      logger.error('更新用户偏好设置失败:', error);
      throw new AppError(500, '更新用户偏好设置失败', 'UPDATE_PREFERENCES_FAILED');
    }
  }

  // 获取用户统计信息
  async getUserStats(userId: string) {
    try {
      const [storeCount, productCount, logCount] = await Promise.all([
        prisma.store.count({ where: { userId } }),
        prisma.product.count({
          where: {
            shelf: {
              store: { userId },
            },
          },
        }),
        prisma.log.count({
          where: { operatorId: userId },
        }),
      ]);

      return {
        storeCount,
        productCount,
        logCount,
      };
    } catch (error) {
      logger.error('获取用户统计信息失败:', error);
      throw new AppError(500, '获取统计信息失败', 'GET_STATS_FAILED');
    }
  }

  // 获取用户的所有店铺
  async getUserStores(userId: string, page: number = 1, limit: number = 20) {
    try {
      const result = await db.paginate(
        prisma.store,
        { userId },
        page,
        limit,
        { createdAt: 'desc' }
      );

      return {
        ...result,
        items: result.items.map(store => ({
          id: store.id,
          name: store.name,
          description: store.description || undefined,
          address: store.address || undefined,
          phone: store.phone || undefined,
          cameraStreamUrl: store.cameraStreamUrl || undefined,
          status: store.status as any,
          createdAt: store.createdAt,
          updatedAt: store.updatedAt,
        })),
      };
    } catch (error) {
      logger.error('获取用户店铺列表失败:', error);
      throw new AppError(500, '获取店铺列表失败', 'GET_STORES_FAILED');
    }
  }

  // 检查用户名是否可用
  async checkUsernameAvailability(username: string): Promise<{ available: boolean }> {
    try {
      const existingUser = await prisma.user.findFirst({
        where: { username },
      });

      return {
        available: !existingUser,
      };
    } catch (error) {
      logger.error('检查用户名可用性失败:', error);
      throw new AppError(500, '检查用户名失败', 'CHECK_USERNAME_FAILED');
    }
  }

  // 删除用户（软删除）
  async deleteUser(userId: string, currentUserId: string): Promise<void> {
    try {
      if (userId !== currentUserId) {
        // 检查当前用户是否有权限删除其他用户
        const currentUser = await prisma.user.findUnique({
          where: { id: currentUserId },
          select: { role: true },
        });

        if (currentUser?.role !== 'admin') {
          throw new AppError(403, '无权删除其他用户', 'FORBIDDEN');
        }
      }

      // 软删除：将用户状态设为inactive
      await prisma.user.update({
        where: { id: userId },
        data: {
          status: 'inactive',
          updatedAt: new Date(),
        },
      });

      logger.business('删除用户', currentUserId, {
        targetUserId: userId,
        softDelete: true,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('删除用户失败:', error);
      throw new AppError(500, '删除用户失败', 'DELETE_USER_FAILED');
    }
  }
}

export const userService = new UserService();