import { sequelize } from '../config/database';
import { Inventory } from '../models/Inventory';
import { StockRecord } from '../models/StockRecord';

export async function createOutbound(
  shopId: number,
  operatorId: number,
  params: { productId: number; quantity: number; remark?: string }
): Promise<{ record: StockRecord; updatedInventory: { quantity: number } }> {
  const { productId, quantity, remark } = params;

  if (!Number.isInteger(quantity) || quantity <= 0) {
    const err: any = new Error('出库数量必须为正整数');
    err.status = 400;
    err.code = 'INVALID_QUANTITY';
    throw err;
  }

  const result = await sequelize.transaction(async (transaction) => {
    const inventory = await Inventory.findOne({
      where: { shopId, productId },
      lock: true,
      transaction,
    });

    if (!inventory) {
      const err: any = new Error('库存记录不存在');
      err.status = 404;
      err.code = 'INVENTORY_NOT_FOUND';
      throw err;
    }

    if (quantity > inventory.quantity) {
      const err: any = new Error(
        `出库数量不能超过当前库存数量（当前库存：${inventory.quantity}）`
      );
      err.status = 400;
      err.code = 'INSUFFICIENT_STOCK';
      throw err;
    }

    const quantityBefore = inventory.quantity;
    const quantityAfter = quantityBefore - quantity;

    const record = await StockRecord.create(
      {
        shopId,
        productId,
        operatorId,
        type: 'out',
        quantity,
        quantityBefore,
        quantityAfter,
        remark: remark ?? null,
      },
      { transaction }
    );

    inventory.quantity = quantityAfter;
    await inventory.save({ transaction });

    return { record, updatedInventory: { quantity: quantityAfter } };
  });

  return result;
}
