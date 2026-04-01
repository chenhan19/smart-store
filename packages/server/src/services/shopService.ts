import { Op } from 'sequelize';
import { Shop } from '../models/Shop';
import { ShopMember } from '../models/ShopMember';
import { User } from '../models/User';
import { sequelize } from '../models/index';

export async function createShop(ownerId: number, name: string): Promise<Shop> {
  return sequelize.transaction(async (t) => {
    const shop = await Shop.create({ name, ownerId }, { transaction: t });
    await ShopMember.create({ shopId: shop.id, userId: ownerId, role: 'owner' }, { transaction: t });
    return shop;
  });
}

export async function getShopsByUser(userId: number): Promise<any[]> {
  const members = await ShopMember.findAll({ where: { userId }, attributes: ['shopId'] });
  if (members.length === 0) return [];
  const shopIds = members.map((m) => m.shopId);
  const shops = await Shop.findAll({ where: { id: { [Op.in]: shopIds } } });
  // 统一返回 camelCase 字段名
  return shops.map((s) => ({
    id: s.id,
    name: s.name,
    ownerId: s.ownerId,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }));
}

export async function getShopById(shopId: number): Promise<Shop> {
  const shop = await Shop.findByPk(shopId);
  if (!shop) {
    const err: any = new Error('店铺不存在');
    err.status = 404;
    err.code = 'SHOP_NOT_FOUND';
    throw err;
  }
  return shop;
}

export async function updateShop(shopId: number, name: string): Promise<Shop> {
  const shop = await getShopById(shopId);
  shop.name = name;
  await shop.save();
  return shop;
}

export async function addMember(shopId: number, userId: number, role: 'owner' | 'operator'): Promise<ShopMember> {
  const existing = await ShopMember.findOne({ where: { shopId, userId } });
  if (existing) {
    const err: any = new Error('该用户已是店铺成员');
    err.status = 409;
    err.code = 'MEMBER_ALREADY_EXISTS';
    throw err;
  }
  return ShopMember.create({ shopId, userId, role });
}

export async function removeMember(shopId: number, userId: number): Promise<void> {
  const member = await ShopMember.findOne({ where: { shopId, userId } });
  if (!member) return;
  if (member.role === 'owner') {
    const err: any = new Error('不能移除店铺 owner');
    err.status = 400;
    err.code = 'CANNOT_REMOVE_OWNER';
    throw err;
  }
  await member.destroy();
}

export async function getMembers(shopId: number): Promise<ShopMember[]> {
  return ShopMember.findAll({
    where: { shopId },
    include: [{ model: User, attributes: ['id', 'nickname', 'avatarUrl'] }],
  });
}
