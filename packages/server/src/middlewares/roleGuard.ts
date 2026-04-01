import { Request, Response, NextFunction } from 'express';

export function roleGuard(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const role = req.shopMember?.role;

    if (!role || !roles.includes(role)) {
      res.status(403).json({ code: 'FORBIDDEN', message: '权限不足' });
      return;
    }

    next();
  };
}
