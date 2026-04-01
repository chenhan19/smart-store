import { Op, WhereOptions, literal } from 'sequelize';
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

  // Use literal with raw column name to avoid Sequelize camelCase → snake_case mapping issues
  if (startDate) {
    (where as any)[Op.and] = [
      ...((where as any)[Op.and] || []),
      literal(`\`StockRecord\`.\`created_at\` >= '${startDate} 00:00:00'`),
    ];
  }
  if (endDate) {
    (where as any)[Op.and] = [
      ...((where as any)[Op.and] || []),
      literal(`\`StockRecord\`.\`created_at\` <= '${endDate} 23:59:59'`),
    ];
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
    order: [[literal('`StockRecord`.`created_at`'), 'DESC']],
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
