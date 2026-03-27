import { prisma } from '@database/index';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class AnalyticsService {
  // 获取销售统计数据
  async getSalesStats(userId: string, params: {
    storeId?: string;
    startDate?: Date;
    endDate?: Date;
    period?: 'day' | 'week' | 'month' | 'year';
  }) {
    try {
      const where: any = {
        product: {
          shelf: {
            store: {
              userId: params.storeId ? undefined : userId,
              ...(params.storeId && { id: params.storeId }),
            },
          },
        },
      };

      // 时间范围筛选
      if (params.startDate || params.endDate) {
        where.saleDate = {};
        if (params.startDate) where.saleDate.gte = params.startDate;
        if (params.endDate) where.saleDate.lte = params.endDate;
      }

      // 获取销售数据
      const salesData = await prisma.productSale.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              barcode: true,
              price: true,
            },
          },
          store: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { saleDate: 'desc' },
      });

      // 按日期分组统计
      const dailyStats = this.groupSalesByDate(salesData, params.period || 'day');
      
      // 计算总计
      const totalStats = this.calculateTotalStats(salesData);

      // 获取商品销售排行
      const productRanking = await this.getProductRanking(userId, params);

      // 获取店铺销售排行
      const storeRanking = await this.getStoreRanking(userId, params);

      return {
        dailyStats,
        totalStats,
        productRanking,
        storeRanking,
        rawData: params.period === 'day' ? salesData.slice(0, 50) : undefined, // 仅返回最近50条原始数据
      };
    } catch (error) {
      logger.error('获取销售统计数据失败:', error);
      throw new AppError(500, '获取销售统计数据失败', 'GET_SALES_STATS_FAILED');
    }
  }

  // 获取库存分析报告
  async getInventoryAnalysis(userId: string, storeId?: string) {
    try {
      const where = {
        shelf: {
          store: {
            userId,
            ...(storeId && { id: storeId }),
          },
        },
      };

      // 获取所有商品
      const products = await prisma.product.findMany({
        where,
        include: {
          shelf: {
            include: {
              store: true,
            },
          },
          logs: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              operator: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
        },
      });

      // 分类统计
      const stats = {
        totalProducts: products.length,
        totalValue: products.reduce((sum, product) => sum + (product.stock * product.price), 0),
        totalCost: products.reduce((sum, product) => sum + (product.stock * (product.costPrice || product.price * 0.6)), 0),
        
        byCategory: this.groupByCategory(products),
        byStatus: this.groupByStatus(products),
        
        stockLevels: {
          outOfStock: products.filter(p => p.stock <= 0).length,
          lowStock: products.filter(p => p.stock > 0 && p.stock <= p.minThreshold).length,
          normalStock: products.filter(p => p.stock > p.minThreshold && (!p.maxThreshold || p.stock <= p.maxThreshold)).length,
          overStock: products.filter(p => p.maxThreshold && p.stock > p.maxThreshold).length,
        },

        topProducts: this.getTopProductsByValue(products, 10),
        recentActivities: this.getRecentActivities(products),
      };

      return stats;
    } catch (error) {
      logger.error('获取库存分析报告失败:', error);
      throw new AppError(500, '获取库存分析报告失败', 'GET_INVENTORY_ANALYSIS_FAILED');
    }
  }

  // 获取预警信息
  async getAlerts(userId: string, storeId?: string) {
    try {
      const where = {
        product: {
          shelf: {
            store: {
              userId,
              ...(storeId && { id: storeId }),
            },
          },
        },
        isResolved: false,
      };

      const alerts = await prisma.inventoryAlert.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              barcode: true,
              stock: true,
              minThreshold: true,
              shelf: {
                include: {
                  store: true,
                },
              },
            },
          },
          resolver: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // 按预警类型分组
      const groupedAlerts = {
        lowStock: alerts.filter(alert => alert.alertType === 'low_stock'),
        outOfStock: alerts.filter(alert => alert.alertType === 'out_of_stock'),
        expiring: alerts.filter(alert => alert.alertType === 'expiring'),
      };

      return {
        total: alerts.length,
        groupedAlerts,
        recentAlerts: alerts.slice(0, 20),
      };
    } catch (error) {
      logger.error('获取预警信息失败:', error);
      throw new AppError(500, '获取预警信息失败', 'GET_ALERTS_FAILED');
    }
  }

  // 获取经营概况
  async getBusinessOverview(userId: string) {
    try {
      const [storeStats, productStats, salesStats, alertStats] = await Promise.all([
        // 店铺统计
        prisma.store.aggregate({
          where: { userId },
          _count: { id: true },
          _sum: { 
            // 这里可以添加更多统计字段
          },
        }),

        // 商品统计
        prisma.product.aggregate({
          where: {
            shelf: {
              store: { userId },
            },
          },
          _count: { id: true },
          _sum: { 
            stock: true,
            price: true,
          },
          _avg: {
            stock: true,
            price: true,
          },
        }),

        // 销售统计（最近30天）
        prisma.productSale.aggregate({
          where: {
            product: {
              shelf: {
                store: { userId },
              },
            },
            saleDate: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
          _sum: {
            quantity: true,
            amount: true,
          },
          _count: { id: true },
        }),

        // 预警统计
        prisma.inventoryAlert.aggregate({
          where: {
            product: {
              shelf: {
                store: { userId },
              },
            },
            isResolved: false,
          },
          _count: { id: true },
        }),
      ]);

      // 获取最近7天的销售趋势
      const recentSalesTrend = await this.getRecentSalesTrend(userId);

      // 获取热门商品
      const popularProducts = await this.getPopularProducts(userId, 5);

      return {
        storeCount: storeStats._count.id,
        productCount: productStats._count.id,
        totalStock: productStats._sum.stock || 0,
        averageStock: productStats._avg.stock || 0,
        inventoryValue: productStats._sum.stock! * (productStats._avg.price || 0),
        
        recentSales: {
          quantity: salesStats._sum.quantity || 0,
          amount: salesStats._sum.amount || 0,
          count: salesStats._count.id,
        },
        
        alerts: {
          active: alertStats._count.id,
        },
        
        trends: recentSalesTrend,
        popularProducts,
        
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('获取经营概况失败:', error);
      throw new AppError(500, '获取经营概况失败', 'GET_BUSINESS_OVERVIEW_FAILED');
    }
  }

  // 辅助方法：按日期分组销售数据
  private groupSalesByDate(salesData: any[], period: 'day' | 'week' | 'month' | 'year') {
    const groups = new Map<string, {
      date: string;
      amount: number;
      quantity: number;
      orderCount: number;
      products: Set<string>;
    }>();

    salesData.forEach(sale => {
      const date = this.formatDate(sale.saleDate, period);
      
      if (!groups.has(date)) {
        groups.set(date, {
          date,
          amount: 0,
          quantity: 0,
          orderCount: 0,
          products: new Set(),
        });
      }

      const group = groups.get(date)!;
      group.amount += sale.amount;
      group.quantity += sale.quantity;
      group.orderCount += 1;
      group.products.add(sale.productId);
    });

    return Array.from(groups.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  // 辅助方法：格式化日期
  private formatDate(date: Date, period: string): string {
    const d = new Date(date);
    
    switch (period) {
      case 'year':
        return `${d.getFullYear()}`;
      case 'month':
        return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      case 'week':
        // 获取周数（简化版本）
        const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
        const pastDaysOfYear = (d.getTime() - firstDayOfYear.getTime()) / 86400000;
        const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        return `${d.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
      default: // day
        return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    }
  }

  // 辅助方法：计算总统计
  private calculateTotalStats(salesData: any[]) {
    return {
      totalAmount: salesData.reduce((sum, sale) => sum + sale.amount, 0),
      totalQuantity: salesData.reduce((sum, sale) => sum + sale.quantity, 0),
      totalOrders: salesData.length,
      averageOrderValue: salesData.length > 0 
        ? salesData.reduce((sum, sale) => sum + sale.amount, 0) / salesData.length 
        : 0,
      averageQuantityPerOrder: salesData.length > 0 
        ? salesData.reduce((sum, sale) => sum + sale.quantity, 0) / salesData.length 
        : 0,
      dateRange: {
        start: salesData.length > 0 
          ? new Date(Math.min(...salesData.map(s => new Date(s.saleDate).getTime())))
          : null,
        end: salesData.length > 0 
          ? new Date(Math.max(...salesData.map(s => new Date(s.saleDate).getTime())))
          : null,
      },
    };
  }

  // 辅助方法：获取商品销售排行
  private async getProductRanking(userId: string, params: any) {
    const sales = await prisma.productSale.groupBy({
      by: ['productId'],
      where: {
        product: {
          shelf: {
            store: {
              userId: params.storeId ? undefined : userId,
              ...(params.storeId && { id: params.storeId }),
            },
          },
        },
        ...(params.startDate && { saleDate: { gte: params.startDate } }),
        ...(params.endDate && { saleDate: { lte: params.endDate } }),
      },
      _sum: {
        quantity: true,
        amount: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          amount: 'desc',
        },
      },
      take: 10,
    });

    // 获取商品详细信息
    const productIds = sales.map(s => s.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        barcode: true,
        price: true,
      },
    });

    const productMap = new Map(products.map(p => [p.id, p]));

    return sales.map(sale => ({
      productId: sale.productId,
      productName: productMap.get(sale.productId)?.name || '未知商品',
      barcode: productMap.get(sale.productId)?.barcode || '',
      salesQuantity: sale._sum.quantity || 0,
      salesAmount: sale._sum.amount || 0,
      saleCount: sale._count.id,
      averagePrice: sale._sum.quantity ? sale._sum.amount! / sale._sum.quantity! : 0,
    }));
  }

  // 辅助方法：获取店铺销售排行
  private async getStoreRanking(userId: string, params: any) {
    const storeSales = await prisma.productSale.groupBy({
      by: ['storeId'],
      where: {
        store: {
          userId,
        },
        ...(params.startDate && { saleDate: { gte: params.startDate } }),
        ...(params.endDate && { saleDate: { lte: params.endDate } }),
      },
      _sum: {
        amount: true,
        quantity: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          amount: 'desc',
        },
      },
      take: 10,
    });

    // 获取店铺详细信息
    const storeIds = storeSales.map(s => s.storeId).filter(Boolean);
    const stores = await prisma.store.findMany({
      where: { id: { in: storeIds as string[] } },
      select: {
        id: true,
        name: true,
        address: true,
      },
    });

    const storeMap = new Map(stores.map(s => [s.id, s]));

    return storeSales.map(sale => ({
      storeId: sale.storeId,
      storeName: storeMap.get(sale.storeId!)?.name || '未知店铺',
      address: storeMap.get(sale.storeId!)?.address || '',
      salesAmount: sale._sum.amount || 0,
      salesQuantity: sale._sum.quantity || 0,
      saleCount: sale._count.id,
    }));
  }

  // 辅助方法：按分类分组
  private groupByCategory(products: any[]) {
    const groups = new Map<string, {
      category: string;
      count: number;
      totalValue: number;
      averageStock: number;
    }>();

    products.forEach(product => {
      const category = product.category || '未分类';
      
      if (!groups.has(category)) {
        groups.set(category, {
          category,
          count: 0,
          totalValue: 0,
          averageStock: 0,
        });
      }

      const group = groups.get(category)!;
      group.count += 1;
      group.totalValue += product.stock * product.price;
    });

    // 计算平均值
    groups.forEach(group => {
      group.averageStock = group.totalValue / group.count;
    });

    return Array.from(groups.values()).sort((a, b) => b.totalValue - a.totalValue);
  }

  // 辅助方法：按状态分组
  private groupByStatus(products: any[]) {
    const groups = {
      active: { count: 0, stock: 0, value: 0 },
      out_of_stock: { count: 0, stock: 0, value: 0 },
      discontinued: { count: 0, stock: 0, value: 0 },
    };

    products.forEach(product => {
      const group = groups[product.status as keyof typeof groups];
      if (group) {
        group.count += 1;
        group.stock += product.stock;
        group.value += product.stock * product.price;
      }
    });

    return groups;
  }

  // 辅助方法：按价值获取前N个商品
  private getTopProductsByValue(products: any[], limit: number) {
    return products
      .map(product => ({
        ...product,
        value: product.stock * product.price,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, limit)
      .map(p => ({
        id: p.id,
        name: p.name,
        barcode: p.barcode,
        stock: p.stock,
        price: p.price,
        value: p.value,
        status: p.status,
      }));
  }

  // 辅助方法：获取最近活动
  private getRecentActivities(products: any[]) {
    const allLogs = products.flatMap(product => 
      product.logs.map((log: any) => ({
        ...log,
        productName: product.name,
        productBarcode: product.barcode,
      }))
    );

    return allLogs
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20);
  }

  // 辅助方法：获取最近销售趋势
  private async getRecentSalesTrend(userId: string) {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

    const dailySales = await prisma.productSale.groupBy({
      by: ['saleDate'],
      where: {
        product: {
          shelf: {
            store: { userId },
          },
        },
        saleDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
        quantity: true,
      },
      _count: {
        id: true,
      },
    });

    // 填充缺失的日期
    const trendData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(endDate.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = this.formatDate(date, 'day');
      
      const salesForDay = dailySales.find(s => 
        this.formatDate(s.saleDate, 'day') === dateStr
      );

      trendData.push({
        date: dateStr,
        amount: salesForDay?._sum.amount || 0,
        quantity: salesForDay?._sum.quantity || 0,
        orderCount: salesForDay?._count.id || 0,
      });
    }

    return trendData;
  }

  // 辅助方法：获取热门商品
  private async getPopularProducts(userId: string, limit: number) {
    const recentSales = await prisma.productSale.groupBy({
      by: ['productId'],
      where: {
        product: {
          shelf: {
            store: { userId },
          },
        },
        saleDate: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: limit,
    });

    const productIds = recentSales.map(s => s.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        barcode: true,
        price: true,
        stock: true,
      },
    });

    const productMap = new Map(products.map(p => [p.id, p]));

    return recentSales.map(sale => ({
      productId: sale.productId,
      productName: productMap.get(sale.productId)?.name || '未知商品',
      barcode: productMap.get(sale.productId)?.barcode || '',
      salesQuantity: sale._sum.quantity || 0,
      currentStock: productMap.get(sale.productId)?.stock || 0,
      price: productMap.get(sale.productId)?.price || 0,
    }));
  }
}

export const analyticsService = new AnalyticsService();