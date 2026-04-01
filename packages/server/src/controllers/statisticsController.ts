import { Request, Response, NextFunction } from 'express';
import * as statisticsService from '../services/statisticsService';

export async function getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const shopId = parseInt(req.params.shopId, 10);
    const data = await statisticsService.getSummary(shopId);
    res.json({ code: 'SUCCESS', data });
  } catch (err) {
    next(err);
  }
}

export async function getTrend(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const shopId = parseInt(req.params.shopId, 10);
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

    if (!startDate || !endDate) {
      res.status(400).json({ code: 'BAD_REQUEST', message: '请提供 startDate 和 endDate 参数' });
      return;
    }

    const data = await statisticsService.getTrend(shopId, startDate, endDate);
    res.json({ code: 'SUCCESS', data });
  } catch (err: any) {
    if (err.status === 400) {
      res.status(400).json({ code: err.code || 'BAD_REQUEST', message: err.message });
      return;
    }
    next(err);
  }
}

export async function getCategoryDistribution(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const shopId = parseInt(req.params.shopId, 10);
    const data = await statisticsService.getCategoryDistribution(shopId);
    res.json({ code: 'SUCCESS', data });
  } catch (err) {
    next(err);
  }
}

export async function getTopInventory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const shopId = parseInt(req.params.shopId, 10);
    const data = await statisticsService.getTopInventory(shopId);
    res.json({ code: 'SUCCESS', data });
  } catch (err) {
    next(err);
  }
}
