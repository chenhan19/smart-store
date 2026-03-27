import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User } from '@shared/types';

// JWT Payload类型
export interface JWTPayload {
  userId: string;
  openid: string;
  username: string;
  role: string;
}

// 生成JWT令牌
export function generateToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    openid: user.openid,
    username: user.username,
    role: user.role,
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

// 验证JWT令牌
export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('TOKEN_EXPIRED');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('INVALID_TOKEN');
    }
    throw error;
  }
}

// 刷新令牌（如果需要的话）
export function refreshToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      ignoreExpiration: true,
    }) as JWTPayload;
    
    // 如果令牌过期时间小于30分钟，则刷新
    const payload = jwt.decode(token) as any;
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = payload.exp - now;
    
    if (expiresIn < 30 * 60) { // 30分钟
      return generateToken({
        id: decoded.userId,
        openid: decoded.openid,
        username: decoded.username,
        role: decoded.role,
      } as User);
    }
    
    return null;
  } catch {
    return null;
  }
}

// 生成刷新令牌（用于长期保持登录）
export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
}

// 解析令牌但不验证过期（用于续期）
export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
}

// 检查令牌是否即将过期（15分钟内过期）
export function isTokenExpiringSoon(token: string): boolean {
  try {
    const payload = jwt.decode(token) as any;
    if (!payload || !payload.exp) return false;
    
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = payload.exp - now;
    
    // 15分钟内过期
    return expiresIn < 15 * 60;
  } catch {
    return false;
  }
}

// 验证令牌中间件中使用的工具函数
export function extractTokenFromHeader(authorization: string | undefined): string | null {
  if (!authorization) return null;
  
  const parts = authorization.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}