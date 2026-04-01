import { Request, Response, NextFunction } from 'express';
import * as inboundService from '../services/inboundService';

export async function createInbound(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const shopId = parseInt(req.params.shopId, 10);
    const operatorId = (req as any).user.userId;
    const { productId, quantity, remark } = req.body;

    const { record, updatedInventory } = await inboundService.createInbound(shopId, operatorId, {
      productId,
      quantity,
      remark,
    });

    res.status(201).json({
      code: 'SUCCESS',
      message: '入库成功',
      data: { record, updatedInventory },
    });
  } catch (err) {
    next(err);
  }
}
