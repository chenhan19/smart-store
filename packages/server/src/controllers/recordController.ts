import { Request, Response, NextFunction } from 'express';
import * as recordService from '../services/recordService';

export async function listRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const shopId = parseInt(req.params.shopId, 10);
    const { type, startDate, endDate, keyword, page, pageSize } = req.query;

    const result = await recordService.listRecords(shopId, {
      type: type as 'in' | 'out' | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      keyword: keyword as string | undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
