import { Op } from 'sequelize';
import { Product } from '../models/Product';
import { Inventory } from '../models/Inventory';
import { sequelize } from '../models/index';

export async function createProduct(
  shopId: number,
  data: {
    name: string;
    code: string;
    category?: string;
    spec?: string;
    unit?: string;
    alertThreshold?: number;
  }
): Promise<Product> {
  const { name, code, category, spec, unit, alertThreshold } = data;

  if (!name || !name.trim()) {
    const err: any = new Error('商品名称不能为空');
    err.status = 400;
    err.code = 'BAD_REQUEST';
    throw err;
  }

  if (!code || !code.trim()) {
    const err: any = new Error('商品编码不能为空');
    err.status = 400;
    err.code = 'BAD_REQUEST';
    throw err;
  }

  const existing = await Product.findOne({ where: { shopId, code: code.trim() } });
  if (existing) {
    const err: any = new Error('商品编码已存在');
    err.status = 409;
    err.code = 'PRODUCT_CODE_EXISTS';
    throw err;
  }

  return sequelize.transaction(async (t) => {
    const product = await Product.create(
      {
        shopId,
        name: name.trim(),
        code: code.trim(),
        category: category ?? '',
        spec: spec ?? '',
        unit: unit ?? '',
        alertThreshold: alertThreshold ?? 0,
      },
      { transaction: t }
    );

    await Inventory.create(
      { shopId, productId: product.id, quantity: 0 },
      { transaction: t }
    );

    return product;
  });
}

export async function listProducts(
  shopId: number,
  filters: { keyword?: string; category?: string }
): Promise<Product[]> {
  const where: any = { shopId };

  if (filters.category) {
    where.category = filters.category;
  }

  if (filters.keyword) {
    where[Op.or] = [
      { name: { [Op.like]: `%${filters.keyword}%` } },
      { code: { [Op.like]: `%${filters.keyword}%` } },
    ];
  }

  return Product.findAll({ where });
}

export async function getProductById(shopId: number, productId: number): Promise<Product> {
  const product = await Product.findOne({ where: { id: productId, shopId } });
  if (!product) {
    const err: any = new Error('商品不存在');
    err.status = 404;
    err.code = 'PRODUCT_NOT_FOUND';
    throw err;
  }
  return product;
}

export async function updateProduct(
  shopId: number,
  productId: number,
  data: {
    name?: string;
    code?: string;
    category?: string;
    spec?: string;
    unit?: string;
    alertThreshold?: number;
  }
): Promise<Product> {
  const { name, code, category, spec, unit, alertThreshold } = data;

  if (name !== undefined && !name.trim()) {
    const err: any = new Error('商品名称不能为空');
    err.status = 400;
    err.code = 'BAD_REQUEST';
    throw err;
  }

  if (code !== undefined && !code.trim()) {
    const err: any = new Error('商品编码不能为空');
    err.status = 400;
    err.code = 'BAD_REQUEST';
    throw err;
  }

  const product = await getProductById(shopId, productId);

  if (code && code.trim() !== product.code) {
    const existing = await Product.findOne({
      where: { shopId, code: code.trim(), id: { [Op.ne]: productId } },
    });
    if (existing) {
      const err: any = new Error('商品编码已存在');
      err.status = 409;
      err.code = 'PRODUCT_CODE_EXISTS';
      throw err;
    }
  }

  if (name !== undefined) product.name = name.trim();
  if (code !== undefined) product.code = code.trim();
  if (category !== undefined) product.category = category;
  if (spec !== undefined) product.spec = spec;
  if (unit !== undefined) product.unit = unit;
  if (alertThreshold !== undefined) product.alertThreshold = alertThreshold;

  await product.save();
  return product;
}

export async function getProductByCode(shopId: number, code: string): Promise<Product> {
  const product = await Product.findOne({
    where: { shopId, code },
    include: [{ model: Inventory, attributes: ['quantity'] }],
  });

  if (!product) {
    const err: any = new Error('商品不存在');
    err.status = 404;
    err.code = 'PRODUCT_NOT_FOUND';
    throw err;
  }

  return product;
}
