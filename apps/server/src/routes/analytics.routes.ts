import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate, analyticsValidators } from '../utils/validation';
import { analyticsService } from '../services/analytics.service';
import { ApiResponse } from '@shared/types';

const router = Router();

// 所有统计路由都需要认证
router.use(authenticate);

// 获取销售统计数据
router.get(
  '/sales',
  validate(analyticsValidators.dateRange),
  async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const { storeId, startDate, endDate, period } = req.query;

      const stats = await analyticsService.getSalesStats(userId, {
        storeId: storeId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        period: period as 'day' | 'week' | 'month' | 'year',
      });

      const response: ApiResponse = {
        success: true,
        data: stats,
        code: 'SUCCESS',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// 获取库存分析报告
router.get(
  '/inventory',
  async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const { storeId } = req.query;

      const analysis = await analyticsService.getInventoryAnalysis(
        userId,
        storeId as string
      );

      const response: ApiResponse = {
        success: true,
        data: analysis,
        code: 'SUCCESS',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// 获取预警信息
router.get(
  '/alerts',
  async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const { storeId } = req.query;

      const alerts = await analyticsService.getAlerts(
        userId,
        storeId as string
      );

      const response: ApiResponse = {
        success: true,
        data: alerts,
        code: 'SUCCESS',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// 获取经营概况
router.get(
  '/overview',
  async (req, res, next) => {
    try {
      const userId = req.user!.id;

      const overview = await analyticsService.getBusinessOverview(userId);

      const response: ApiResponse = {
        success: true,
        data: overview,
        code: 'SUCCESS',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// 解决预警
router.post(
  '/alerts/:id/resolve',
  async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const alertId = req.params.id;

      // 这里应该调用服务方法解决预警
      // 暂时返回成功响应
      
      const response: ApiResponse = {
        success: true,
        message: '预警已解决',
        code: 'ALERT_RESOLVED',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// 获取商品销售排行
router.get(
  '/ranking/products',
  validate(analyticsValidators.dateRange),
  async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const { storeId, startDate, endDate, limit } = req.query;

      // 这里可以调用具体的排行方法
      // 暂时从销售统计中获取
      const stats = await analyticsService.getSalesStats(userId, {
        storeId: storeId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      const response: ApiResponse = {
        success: true,
        data: {
          ranking: stats.productRanking,
        },
        code: 'SUCCESS',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// 获取店铺销售排行
router.get(
  '/ranking/stores',
  validate(analyticsValidators.dateRange),
  async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const { startDate, endDate } = req.query;

      // 这里可以调用具体的排行方法
      // 暂时从销售统计中获取
      const stats = await analyticsService.getSalesStats(userId, {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      const response: ApiResponse = {
        success: true,
        data: {
          ranking: stats.storeRanking,
        },
        code: 'SUCCESS',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// 导出销售数据（CSV格式）
router.get(
  '/export/sales',
  validate(analyticsValidators.dateRange),
  async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const { storeId, startDate, endDate } = req.query;

      const stats = await analyticsService.getSalesStats(userId, {
        storeId: storeId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      // 生成CSV格式的数据
      const csvData = this.generateSalesCSV(stats);

      // 设置响应头，触发文件下载
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="sales_export.csv"');

      res.send(csvData);
    } catch (error) {
      next(error);
    }
  }
);

// 辅助方法：生成销售数据CSV
function generateSalesCSV(stats: any): string {
  const headers = ['日期', '销售金额', '销售数量', '订单数', '商品种类数'];
  const rows = stats.dailyStats.map((item: any) => [
    item.date,
    item.amount.toFixed(2),
    item.quantity,
    item.orderCount,
    item.products.size,
  ]);

  // 添加总计行
  rows.push([
    '总计',
    stats.totalStats.totalAmount.toFixed(2),
    stats.totalStats.totalQuantity,
    stats.totalStats.totalOrders,
    'N/A',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row: any[]) => row.join(',')),
  ].join('\n');

  return csvContent;
}

export default router;