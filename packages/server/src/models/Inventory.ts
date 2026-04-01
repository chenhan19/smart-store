import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface InventoryAttributes {
  id: number;
  shopId: number;
  productId: number;
  quantity: number;
  updatedAt?: Date;
}

export interface InventoryCreationAttributes extends Optional<InventoryAttributes, 'id' | 'quantity'> {}

export class Inventory
  extends Model<InventoryAttributes, InventoryCreationAttributes>
  implements InventoryAttributes
{
  declare id: number;
  declare shopId: number;
  declare productId: number;
  declare quantity: number;
  declare updatedAt: Date;

  static initModel(sequelize: Sequelize): typeof Inventory {
    Inventory.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        shopId: {
          type: DataTypes.INTEGER,
          field: 'shop_id',
          allowNull: false,
        },
        productId: {
          type: DataTypes.INTEGER,
          field: 'product_id',
          allowNull: false,
        },
        quantity: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },
        updatedAt: {
          type: DataTypes.DATE,
        },
      },
      {
        sequelize,
        tableName: 'inventory',
        timestamps: true,
        createdAt: false,
        indexes: [
          {
            unique: true,
            fields: ['shop_id', 'product_id'],
          },
        ],
      }
    );
    return Inventory;
  }
}

export default Inventory;
