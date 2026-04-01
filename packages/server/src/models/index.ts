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

// Define associations
User.hasMany(Shop, { foreignKey: 'owner_id' });
Shop.belongsTo(User, { foreignKey: 'owner_id' });

Shop.hasMany(ShopMember, { foreignKey: 'shop_id' });
ShopMember.belongsTo(Shop, { foreignKey: 'shop_id' });
User.hasMany(ShopMember, { foreignKey: 'user_id' });
ShopMember.belongsTo(User, { foreignKey: 'user_id' });

Shop.hasMany(Product, { foreignKey: 'shop_id' });

Product.hasOne(Inventory, { foreignKey: 'product_id' });

Shop.hasMany(StockRecord, { foreignKey: 'shop_id' });
Product.hasMany(StockRecord, { foreignKey: 'product_id' });
User.hasMany(StockRecord, { as: 'operator', foreignKey: 'operator_id' });

export { sequelize, User, Shop, ShopMember, Product, Inventory, StockRecord };
