import { Request, Response, NextFunction } from 'express';
import { ShopMember, ShopMemberAttributes } from '../models/ShopMember';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      shopMember?: ShopMemberAttributes;
    }
  }
}

export async function verifyShopAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
  const shopId = parseInt(req.params.shopId, 10);
  const userId = req.user?.userId;

  if (!userId || isNaN(shopId)) {
    res.status(403).json({ code: 'FORBIDDEN', message: '无权访问该店铺' });
    return;
  }

  const member = await ShopMember.findOne({ where: { shopId, userId } });

  if (!member) {
    res.status(403).json({ code: 'FORBIDDEN', message: '无权访问该店铺' });
    return;
  }

  req.shopMember = member.toJSON() as ShopMemberAttributes;
  next();
}
