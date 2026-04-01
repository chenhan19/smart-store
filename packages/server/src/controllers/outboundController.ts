import { Request, Response, NextFunction } from 'express';
import * as outboundService from '../services/outboundService';

export async function createOutbound(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const shopId = parseInt(req.params.shopId, 10);
    const operatorId = (req as any).user.userId;
    const { productId, quantity, remark } = req.body;

    const { record, updatedInventory } = await outboundService.createOutbound(shopId, operatorId, {
      productId,
      quantity,
      remark,
    });

    res.status(201).json({
      code: 'SUCCESS',
      message: '出库成功',
      data: { record, updatedInventory },
    });
  } catch (err) {
    next(err);
  }
}
