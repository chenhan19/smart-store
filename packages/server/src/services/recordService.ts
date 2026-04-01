import { Op, WhereOptions } from 'sequelize';
import { StockRecord } from '../models/StockRecord';
import { Product } from '../models/Product';
import { User } from '../models/User';

export interface RecordFilters {
  type?: 'in' | 'out';
  startDate?: string;
  endDate?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export async function listRecords(
  shopId: number,
  filters: RecordFilters = {}
): Promise<{ total: number; page: number; pageSize: number; list: StockRecord[] }> {
  const { type, startDate, endDate, keyword, page = 1, pageSize = 20 } = filters;

  const where: WhereOptions = { shopId };

  if (type) {
    (where as any).type = type;
  }

  if (startDate || endDate) {
    const dateRange: any = {};
    if (startDate) {
      dateRange[Op.gte] = new Date(startDate + 'T00:00:00.000Z');
    }
    if (endDate) {
      dateRange[Op.lte] = new Date(endDate + 'T23:59:59.999Z');
    }
    (where as any).createdAt = dateRange;
  }

  const productWhere: WhereOptions | undefined = keyword
    ? {
        [Op.or]: [
          { name: { [Op.like]: `%${keyword}%` } },
          { code: { [Op.like]: `%${keyword}%` } },
        ],
      }
    : undefined;

  const offset = (page - 1) * pageSize;

  const { count, rows } = await StockRecord.findAndCountAll({
    where,
    include: [
      {
        model: Product,
        attributes: ['id', 'name', 'code'],
        where: productWhere,
        required: !!keyword,
      },
      {
        model: User,
        as: 'operator',
        attributes: ['id', 'nickname'],
      },
    ],
    order: [['createdAt', 'DESC']],
    limit: pageSize,
    offset,
    distinct: true,
  });

  return {
    total: count,
    page,
    pageSize,
    list: rows,
  };
}
