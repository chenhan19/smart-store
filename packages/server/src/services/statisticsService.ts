import { sequelize } from '../config/database';
import { Product } from '../models/Product';

export async function getSummary(shopId: number) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const [todayInboundResult, todayOutboundResult, productCount, alertCount] = await Promise.all([
    sequelize.query(
      `SELECT COALESCE(SUM(quantity), 0) as total FROM stock_records
       WHERE shop_id = :shopId AND type = 'in' AND DATE(created_at) = :today`,
      { replacements: { shopId, today }, type: 'SELECT' }
    ),
    sequelize.query(
      `SELECT COALESCE(SUM(quantity), 0) as total FROM stock_records
       WHERE shop_id = :shopId AND type = 'out' AND DATE(created_at) = :today`,
      { replacements: { shopId, today }, type: 'SELECT' }
    ),
    Product.count({ where: { shopId } }),
    sequelize.query(
      `SELECT COUNT(*) as cnt FROM inventory i
       JOIN products p ON i.product_id = p.id
       WHERE i.shop_id = :shopId AND p.alert_threshold > 0 AND i.quantity < p.alert_threshold`,
      { replacements: { shopId }, type: 'SELECT' }
    ),
  ]);

  return {
    todayInbound: Number((todayInboundResult[0] as any)?.total) || 0,
    todayOutbound: Number((todayOutboundResult[0] as any)?.total) || 0,
    productCount,
    alertCount: Number((alertCount[0] as any)?.cnt) || 0,
  };
}

export async function getTrend(shopId: number, startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 365) {
    throw Object.assign(new Error('时间范围不能超过 365 天'), { status: 400, code: 'BAD_REQUEST' });
  }

  const records = await sequelize.query(
    `SELECT DATE(created_at) as date, type, SUM(quantity) as total
     FROM stock_records
     WHERE shop_id = :shopId AND created_at BETWEEN :start AND :end
     GROUP BY DATE(created_at), type
     ORDER BY date ASC`,
    { replacements: { shopId, start, end }, type: 'SELECT' }
  ) as Array<{ date: string; type: string; total: number }>;

  // Build date range array
  const dates: string[] = [];
  const inboundMap: Record<string, number> = {};
  const outboundMap: Record<string, number> = {};

  for (const r of records) {
    const d = r.date.toString().slice(0, 10);
    if (r.type === 'in') inboundMap[d] = Number(r.total);
    else outboundMap[d] = Number(r.total);
  }

  const cur = new Date(start);
  while (cur <= end) {
    const d = cur.toISOString().slice(0, 10);
    dates.push(d);
    cur.setDate(cur.getDate() + 1);
  }

  return {
    dates,
    inbound: dates.map((d) => inboundMap[d] || 0),
    outbound: dates.map((d) => outboundMap[d] || 0),
  };
}

export async function getCategoryDistribution(shopId: number) {
  const rows = await sequelize.query(
    `SELECT p.category, SUM(i.quantity) as total
     FROM inventory i
     JOIN products p ON i.product_id = p.id
     WHERE i.shop_id = :shopId
     GROUP BY p.category`,
    { replacements: { shopId }, type: 'SELECT' }
  ) as Array<{ category: string; total: number }>;

  const grandTotal = rows.reduce((sum, r) => sum + Number(r.total), 0);

  return rows.map((r) => ({
    category: r.category || '未分类',
    count: Number(r.total),
    percentage: grandTotal > 0 ? Math.round((Number(r.total) / grandTotal) * 10000) / 100 : 0,
  }));
}

export async function getTopInventory(shopId: number) {
  const rows = await sequelize.query(
    `SELECT p.id as productId, p.name, i.quantity
     FROM inventory i
     JOIN products p ON i.product_id = p.id
     WHERE i.shop_id = :shopId
     ORDER BY i.quantity DESC
     LIMIT 10`,
    { replacements: { shopId }, type: 'SELECT' }
  ) as Array<{ productId: number; name: string; quantity: number }>;

  return rows.map((r) => ({ productId: r.productId, name: r.name, quantity: Number(r.quantity) }));
}
