import { Request, Response, NextFunction } from 'express';
import * as shopService from '../services/shopService';

export async function createShop(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { name } = req.body;
  if (!name || !name.trim()) {
    res.status(400).json({ code: 'BAD_REQUEST', message: '店铺名称不能为空' });
    return;
  }
  try {
    const shop = await shopService.createShop(req.user!.userId, name.trim());
    res.status(201).json({ code: 'SUCCESS', message: '创建成功', data: shop });
  } catch (err) {
    next(err);
  }
}

export async function getShops(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const shops = await shopService.getShopsByUser(req.user!.userId);
    res.status(200).json({ code: 'SUCCESS', data: shops });
  } catch (err) {
    next(err);
  }
}

export async function getShop(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const shopId = parseInt(req.params.shopId, 10);
    const shop = await shopService.getShopById(shopId);
    res.status(200).json({ code: 'SUCCESS', data: shop });
  } catch (err) {
    next(err);
  }
}

export async function updateShop(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { name } = req.body;
  if (!name || !name.trim()) {
    res.status(400).json({ code: 'BAD_REQUEST', message: '店铺名称不能为空' });
    return;
  }
  try {
    const shopId = parseInt(req.params.shopId, 10);
    const shop = await shopService.updateShop(shopId, name.trim());
    res.status(200).json({ code: 'SUCCESS', data: shop });
  } catch (err) {
    next(err);
  }
}

export async function getMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const shopId = parseInt(req.params.shopId, 10);
    const members = await shopService.getMembers(shopId);
    res.status(200).json({ code: 'SUCCESS', data: members });
  } catch (err) {
    next(err);
  }
}

export async function addMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const shopId = parseInt(req.params.shopId, 10);
    const { userId, role } = req.body;
    const member = await shopService.addMember(shopId, userId, role);
    res.status(201).json({ code: 'SUCCESS', message: '添加成功', data: member });
  } catch (err) {
    next(err);
  }
}

export async function removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const shopId = parseInt(req.params.shopId, 10);
    const userId = parseInt(req.params.userId, 10);
    await shopService.removeMember(shopId, userId);
    res.status(200).json({ code: 'SUCCESS', message: '移除成功' });
  } catch (err) {
    next(err);
  }
}
