import axios from 'axios';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { ShopMember } from '../models/ShopMember';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
const JWT_EXPIRES_IN = '7d';

export async function loginWithWechat(code: string): Promise<{
  token: string;
  user: { id: number; nickname: string; avatarUrl: string; role: 'owner' | 'operator' };
}> {
  const WX_APP_ID = process.env.WX_APP_ID || '';
  const WX_APP_SECRET = process.env.WX_APP_SECRET || '';

  if (!WX_APP_ID || !WX_APP_SECRET) {
    throw new Error('未配置微信 AppID 或 AppSecret，请检查环境变量 WX_APP_ID 和 WX_APP_SECRET');
  }

  // 调用微信 code2Session 接口获取 openid
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${WX_APP_ID}&secret=${WX_APP_SECRET}&js_code=${code}&grant_type=authorization_code`;
  const response = await axios.get(url);
  const { openid, errcode, errmsg } = response.data;

  if (!openid) {
    throw new Error(`微信登录失败: ${errmsg || errcode || '未知错误'}`);
  }

  // 查询或创建用户
  const [user] = await User.findOrCreate({
    where: { openid },
    defaults: { openid, nickname: '', avatarUrl: '' },
  });

  // 查询该用户的 ShopMember 记录，确定 role
  const members = await ShopMember.findAll({
    where: { userId: user.id },
    attributes: ['role'],
  });

  let role: 'owner' | 'operator' = 'owner';
  if (members.length > 0) {
    const hasOwner = members.some((m) => m.role === 'owner');
    role = hasOwner ? 'owner' : 'operator';
  }

  // 签发 JWT
  const token = jwt.sign({ userId: user.id, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return {
    token,
    user: {
      id: user.id,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      role,
    },
  };
}
