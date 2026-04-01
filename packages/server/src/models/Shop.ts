import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface ShopAttributes {
  id: number;
  name: string;
  ownerId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ShopCreationAttributes extends Optional<ShopAttributes, 'id'> {}

export class Shop extends Model<ShopAttributes, ShopCreationAttributes> implements ShopAttributes {
  declare id: number;
  declare name: string;
  declare ownerId: number;
  declare createdAt: Date;
  declare updatedAt: Date;

  static initModel(sequelize: Sequelize): typeof Shop {
    Shop.init(
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING, allowNull: false },
        ownerId: { type: DataTypes.INTEGER, field: 'owner_id', allowNull: false },
      },
      {
        sequelize,
        tableName: 'shops',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      }
    );
    return Shop;
  }
}

export default Shop;
