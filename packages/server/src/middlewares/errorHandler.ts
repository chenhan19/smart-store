import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'sequelize';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ValidationError) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: err.message,
      details: err.errors.map((e) => ({ field: e.path, message: e.message })),
    });
    return;
  }

  const status = err.status || err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || '服务器内部错误';

  res.status(status).json({
    code,
    message,
    details: err.details || null,
  });
}
