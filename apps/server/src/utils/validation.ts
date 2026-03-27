import { body, param, query, ValidationChain } from 'express-validator';
import { validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';

// 验证中间件
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // 运行所有验证规则
    for (const validation of validations) {
      const result = await validation.run(req);
      if (!result.isEmpty()) break;
    }

    // 检查验证结果
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // 提取错误信息
    const errorMessages = errors.array().map(err => ({
      field: err.type === 'field' ? err.path : err.type,
      message: err.msg,
      value: err.value,
    }));

    // 抛出验证错误
    throw new AppError(400, '数据验证失败', 'VALIDATION_ERROR', errorMessages);
  };
};

// 通用验证规则
export const commonValidators = {
  id: param('id').isString().trim().notEmpty().withMessage('ID不能为空'),
  
  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须为正整数'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    query('sortBy').optional().isString().trim().withMessage('排序字段必须是字符串'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('排序方向必须是asc或desc'),
  ],
};

// 用户相关验证
export const userValidators = {
  login: [
    body('code').isString().trim().notEmpty().withMessage('微信登录code不能为空'),
  ],
  
  updateProfile: [
    body('username').optional().isString().trim().isLength({ min: 2, max: 20 }).withMessage('用户名长度必须在2-20个字符之间'),
    body('phone').optional().isMobilePhone('zh-CN').withMessage('请输入有效的手机号码'),
    body('email').optional().isEmail().withMessage('请输入有效的邮箱地址'),
    body('avatar').optional().isURL().withMessage('头像必须是有效的URL'),
  ],
};

// 店铺相关验证
export const storeValidators = {
  create: [
    body('name').isString().trim().notEmpty().withMessage('店铺名称不能为空').isLength({ max: 100 }).withMessage('店铺名称不能超过100个字符'),
    body('description').optional().isString().trim().isLength({ max: 500 }).withMessage('店铺描述不能超过500个字符'),
    body('address').optional().isString().trim().isLength({ max: 200 }).withMessage('地址不能超过200个字符'),
    body('phone').optional().isMobilePhone('zh-CN').withMessage('请输入有效的手机号码'),
    body('cameraStreamUrl').optional().isURL().withMessage('监控流地址必须是有效的URL'),
  ],
  
  update: [
    param('id').isString().trim().notEmpty().withMessage('店铺ID不能为空'),
    body('name').optional().isString().trim().notEmpty().withMessage('店铺名称不能为空').isLength({ max: 100 }).withMessage('店铺名称不能超过100个字符'),
    body('description').optional().isString().trim().isLength({ max: 500 }).withMessage('店铺描述不能超过500个字符'),
    body('address').optional().isString().trim().isLength({ max: 200 }).withMessage('地址不能超过200个字符'),
    body('phone').optional().isMobilePhone('zh-CN').withMessage('请输入有效的手机号码'),
    body('cameraStreamUrl').optional().isURL().withMessage('监控流地址必须是有效的URL'),
    body('status').optional().isIn(['active', 'inactive', 'closed']).withMessage('店铺状态必须是active、inactive或closed'),
  ],
};

// 货架相关验证
export const shelfValidators = {
  create: [
    body('storeId').isString().trim().notEmpty().withMessage('店铺ID不能为空'),
    body('labelName').isString().trim().notEmpty().withMessage('货架标签不能为空').isLength({ max: 50 }).withMessage('货架标签不能超过50个字符'),
    body('description').optional().isString().trim().isLength({ max: 200 }).withMessage('货架描述不能超过200个字符'),
    body('position').isString().trim().notEmpty().withMessage('货架位置不能为空').isLength({ max: 10 }).withMessage('货架位置不能超过10个字符'),
    body('capacity').isInt({ min: 1, max: 10000 }).withMessage('货架容量必须是1-10000之间的整数'),
  ],
  
  update: [
    param('id').isString().trim().notEmpty().withMessage('货架ID不能为空'),
    body('labelName').optional().isString().trim().notEmpty().withMessage('货架标签不能为空').isLength({ max: 50 }).withMessage('货架标签不能超过50个字符'),
    body('description').optional().isString().trim().isLength({ max: 200 }).withMessage('货架描述不能超过200个字符'),
    body('position').optional().isString().trim().notEmpty().withMessage('货架位置不能为空').isLength({ max: 10 }).withMessage('货架位置不能超过10个字符'),
    body('capacity').optional().isInt({ min: 1, max: 10000 }).withMessage('货架容量必须是1-10000之间的整数'),
    body('status').optional().isIn(['active', 'maintenance', 'inactive']).withMessage('货架状态必须是active、maintenance或inactive'),
  ],
};

// 商品相关验证
export const productValidators = {
  create: [
    body('shelfId').isString().trim().notEmpty().withMessage('货架ID不能为空'),
    body('barcode').isString().trim().notEmpty().withMessage('条形码不能为空').isLength({ max: 50 }).withMessage('条形码不能超过50个字符'),
    body('name').isString().trim().notEmpty().withMessage('商品名称不能为空').isLength({ max: 100 }).withMessage('商品名称不能超过100个字符'),
    body('description').optional().isString().trim().isLength({ max: 500 }).withMessage('商品描述不能超过500个字符'),
    body('category').optional().isString().trim().isLength({ max: 50 }).withMessage('商品分类不能超过50个字符'),
    body('unit').isString().trim().notEmpty().withMessage('商品单位不能为空').isLength({ max: 10 }).withMessage('商品单位不能超过10个字符'),
    body('price').isFloat({ min: 0 }).withMessage('商品价格必须大于等于0'),
    body('costPrice').optional().isFloat({ min: 0 }).withMessage('成本价必须大于等于0'),
    body('minThreshold').isInt({ min: 0 }).withMessage('库存预警阈值必须大于等于0'),
    body('maxThreshold').optional().isInt({ min: 0 }).withMessage('最大库存阈值必须大于等于0'),
  ],
  
  update: [
    param('id').isString().trim().notEmpty().withMessage('商品ID不能为空'),
    body('name').optional().isString().trim().notEmpty().withMessage('商品名称不能为空').isLength({ max: 100 }).withMessage('商品名称不能超过100个字符'),
    body('description').optional().isString().trim().isLength({ max: 500 }).withMessage('商品描述不能超过500个字符'),
    body('category').optional().isString().trim().isLength({ max: 50 }).withMessage('商品分类不能超过50个字符'),
    body('unit').optional().isString().trim().notEmpty().withMessage('商品单位不能为空').isLength({ max: 10 }).withMessage('商品单位不能超过10个字符'),
    body('price').optional().isFloat({ min: 0 }).withMessage('商品价格必须大于等于0'),
    body('costPrice').optional().isFloat({ min: 0 }).withMessage('成本价必须大于等于0'),
    body('minThreshold').optional().isInt({ min: 0 }).withMessage('库存预警阈值必须大于等于0'),
    body('maxThreshold').optional().isInt({ min: 0 }).withMessage('最大库存阈值必须大于等于0'),
    body('status').optional().isIn(['active', 'out_of_stock', 'discontinued']).withMessage('商品状态必须是active、out_of_stock或discontinued'),
  ],
  
  stockOperation: [
    body('quantity').isInt({ min: 1 }).withMessage('操作数量必须为正整数'),
    body('remark').optional().isString().trim().isLength({ max: 200 }).withMessage('备注不能超过200个字符'),
    body('referenceId').optional().isString().trim().withMessage('参考ID必须是字符串'),
  ],
  
  scan: [
    body('barcode').isString().trim().notEmpty().withMessage('条形码不能为空'),
    body('storeId').optional().isString().trim().withMessage('店铺ID必须是字符串'),
    body('shelfId').optional().isString().trim().withMessage('货架ID必须是字符串'),
  ],
};

// 搜索相关验证
export const searchValidators = {
  searchProducts: [
    query('keyword').optional().isString().trim().withMessage('搜索关键词必须是字符串'),
    query('category').optional().isString().trim().withMessage('商品分类必须是字符串'),
    query('status').optional().isString().trim().withMessage('商品状态必须是字符串'),
    query('minPrice').optional().isFloat({ min: 0 }).withMessage('最低价格必须大于等于0'),
    query('maxPrice').optional().isFloat({ min: 0 }).withMessage('最高价格必须大于等于0'),
    query('lowStock').optional().isBoolean().withMessage('低库存筛选必须是布尔值'),
  ],
};

// 统计相关验证
export const analyticsValidators = {
  dateRange: [
    query('startDate').optional().isISO8601().withMessage('开始日期必须是有效的ISO8601格式'),
    query('endDate').optional().isISO8601().withMessage('结束日期必须是有效的ISO8601格式'),
    query('period').optional().isIn(['day', 'week', 'month', 'year']).withMessage('统计周期必须是day、week、month或year'),
  ],
};