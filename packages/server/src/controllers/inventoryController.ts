import { Request, Response, NextFunction } from 'express';
import * as inventoryService from '../services/inventoryService';

export async function listInventory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const shopId = parseInt(req.params.shopId, 10);
    const { keyword, category, alert } = req.query as {
      keyword?: string;
      category?: string;
      alert?: string;
    };
    const alertOnly = alert === 'true';
    const items = await inventoryService.listInventory(shopId, { keyword, category, alertOnly });
    res.status(200).json({ code: 'SUCCESS', data: items });
  } catch (err) {
    next(err);
  }
}

export async function setAlertThreshold(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const shopId = parseInt(req.params.shopId, 10);
    const productId = parseInt(req.params.productId, 10);
    const { threshold } = req.body;
    const product = await inventoryService.setAlertThreshold(shopId, productId, threshold);
    res.status(200).json({ code: 'SUCCESS', data: product });
  } catch (err) {
    next(err);
  }
}
