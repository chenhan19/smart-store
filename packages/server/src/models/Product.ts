import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface ProductAttributes {
  id: number;
  shopId: number;
  name: string;
  code: string;
  category: string;
  spec: string;
  unit: string;
  alertThreshold: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductCreationAttributes
  extends Optional<ProductAttributes, 'id' | 'category' | 'spec' | 'unit' | 'alertThreshold'> {}

export class Product
  extends Model<ProductAttributes, ProductCreationAttributes>
  implements ProductAttributes
{
  declare id: number;
  declare shopId: number;
  declare name: string;
  declare code: string;
  declare category: string;
  declare spec: string;
  declare unit: string;
  declare alertThreshold: number;
  declare createdAt: Date;
  declare updatedAt: Date;

  static initModel(sequelize: Sequelize): typeof Product {
    Product.init(
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        shopId: { type: DataTypes.INTEGER, field: 'shop_id', allowNull: false },
        name: { type: DataTypes.STRING, allowNull: false },
        code: { type: DataTypes.STRING, allowNull: false },
        category: { type: DataTypes.STRING, defaultValue: '' },
        spec: { type: DataTypes.STRING, defaultValue: '' },
        unit: { type: DataTypes.STRING, defaultValue: '' },
        alertThreshold: { type: DataTypes.INTEGER, field: 'alert_threshold', defaultValue: 0 },
      },
      {
        sequelize,
        tableName: 'products',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [{ unique: true, fields: ['shop_id', 'code'] }],
      }
    );
    return Product;
  }
}

export default Product;
