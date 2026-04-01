import { Op } from 'sequelize';
import { Product } from '../models/Product';
import { Inventory } from '../models/Inventory';

export interface InventoryItem {
  productId: number;
  name: string;
  code: string;
  category: string;
  spec: string;
  unit: string;
  alertThreshold: number;
  quantity: number;
  isAlert: boolean;
}

export async function listInventory(
  shopId: number,
  filters: { keyword?: string; category?: string; alertOnly?: boolean }
): Promise<InventoryItem[]> {
  const productWhere: any = { shopId };

  if (filters.category) {
    productWhere.category = filters.category;
  }

  if (filters.keyword) {
    productWhere[Op.or] = [
      { name: { [Op.like]: `%${filters.keyword}%` } },
      { code: { [Op.like]: `%${filters.keyword}%` } },
    ];
  }

  const products = await Product.findAll({
    where: productWhere,
    include: [{ model: Inventory, attributes: ['quantity'] }],
  });

  const items: InventoryItem[] = products.map((p) => {
    const inv = (p as any).Inventory;
    const quantity = inv ? inv.quantity : 0;
    return {
      productId: p.id,
      name: p.name,
      code: p.code,
      category: p.category,
      spec: p.spec,
      unit: p.unit,
      alertThreshold: p.alertThreshold,
      quantity,
      isAlert: quantity < p.alertThreshold,
    };
  });

  if (filters.alertOnly) {
    return items.filter((item) => item.isAlert);
  }

  return items;
}

export async function setAlertThreshold(
  shopId: number,
  productId: number,
  threshold: number
): Promise<Product> {
  const product = await Product.findOne({ where: { id: productId, shopId } });
  if (!product) {
    const err: any = new Error('商品不存在');
    err.status = 404;
    err.code = 'PRODUCT_NOT_FOUND';
    throw err;
  }

  product.alertThreshold = threshold;
  await product.save();
  return product;
}
