import { Request, Response, NextFunction } from 'express';
import { loginWithWechat } from '../services/authService';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { code } = req.body;

  if (!code) {
    res.status(400).json({ code: 'BAD_REQUEST', message: 'code 不能为空' });
    return;
  }

  try {
    const { token, user } = await loginWithWechat(code);
    res.status(200).json({ code: 'SUCCESS', message: '登录成功', data: { token, user } });
  } catch (err) {
    next(err);
  }
}
