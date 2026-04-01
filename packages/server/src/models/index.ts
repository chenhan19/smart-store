import { sequelize } from '../config/database';
import { User } from './User';
import { Shop } from './Shop';
import { ShopMember } from './ShopMember';
import { Product } from './Product';
import { Inventory } from './Inventory';
import { StockRecord } from './StockRecord';

// Initialize all models
User.initModel(sequelize);
Shop.initModel(sequelize);
ShopMember.initModel(sequelize);
Product.initModel(sequelize);
Inventory.initModel(sequelize);
StockRecord.initModel(sequelize);

// Define associations — 明确指定 onDelete/onUpdate 避免与 NOT NULL 冲突
User.hasMany(Shop, { foreignKey: 'owner_id', onDelete: 'RESTRICT', onUpdate: 'CASCADE' });
Shop.belongsTo(User, { foreignKey: 'owner_id', onDelete: 'RESTRICT', onUpdate: 'CASCADE' });

Shop.hasMany(ShopMember, { foreignKey: 'shop_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
ShopMember.belongsTo(Shop, { foreignKey: 'shop_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
User.hasMany(ShopMember, { foreignKey: 'user_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
ShopMember.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

Shop.hasMany(Product, { foreignKey: 'shop_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Product.belongsTo(Shop, { foreignKey: 'shop_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

Product.hasOne(Inventory, { foreignKey: 'product_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Inventory.belongsTo(Product, { foreignKey: 'product_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

Shop.hasMany(StockRecord, { foreignKey: 'shop_id', onDelete: 'RESTRICT', onUpdate: 'CASCADE' });
StockRecord.belongsTo(Shop, { foreignKey: 'shop_id', onDelete: 'RESTRICT', onUpdate: 'CASCADE' });
Product.hasMany(StockRecord, { foreignKey: 'product_id', onDelete: 'RESTRICT', onUpdate: 'CASCADE' });
StockRecord.belongsTo(Product, { foreignKey: 'product_id', onDelete: 'RESTRICT', onUpdate: 'CASCADE' });
User.hasMany(StockRecord, { as: 'operator', foreignKey: 'operator_id', onDelete: 'RESTRICT', onUpdate: 'CASCADE' });
StockRecord.belongsTo(User, { as: 'operator', foreignKey: 'operator_id', onDelete: 'RESTRICT', onUpdate: 'CASCADE' });

export { sequelize, User, Shop, ShopMember, Product, Inventory, StockRecord };
