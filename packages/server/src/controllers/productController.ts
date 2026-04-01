import { Request, Response, NextFunction } from 'express';
import * as productService from '../services/productService';

export async function createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const shopId = parseInt(req.params.shopId, 10);
    const { name, code, category, spec, unit, alertThreshold } = req.body;
    const product = await productService.createProduct(shopId, { name, code, category, spec, unit, alertThreshold });
    res.status(201).json({ code: 'SUCCESS', message: '创建成功', data: product });
  } catch (err) {
    next(err);
  }
}

export async function listProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const shopId = parseInt(req.params.shopId, 10);
    const { keyword, category } = req.query as { keyword?: string; category?: string };
    const products = await productService.listProducts(shopId, { keyword, category });
    res.status(200).json({ code: 'SUCCESS', data: products });
  } catch (err) {
    next(err);
  }
}

export async function getProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const shopId = parseInt(req.params.shopId, 10);
    const productId = parseInt(req.params.productId, 10);
    const product = await productService.getProductById(shopId, productId);
    res.status(200).json({ code: 'SUCCESS', data: product });
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const shopId = parseInt(req.params.shopId, 10);
    const productId = parseInt(req.params.productId, 10);
    const { name, code, category, spec, unit, alertThreshold } = req.body;
    const product = await productService.updateProduct(shopId, productId, { name, code, category, spec, unit, alertThreshold });
    res.status(200).json({ code: 'SUCCESS', data: product });
  } catch (err) {
    next(err);
  }
}

export async function getProductByCode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const shopId = parseInt(req.params.shopId, 10);
    const { code } = req.params;
    const product = await productService.getProductByCode(shopId, code);
    res.status(200).json({ code: 'SUCCESS', data: product });
  } catch (err) {
    next(err);
  }
}
