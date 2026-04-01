import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface StockRecordAttributes {
  id: number;
  shopId: number;
  productId: number;
  operatorId: number;
  type: 'in' | 'out';
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  remark?: string | null;
  createdAt?: Date;
}

export interface StockRecordCreationAttributes
  extends Optional<StockRecordAttributes, 'id' | 'remark'> {}

export class StockRecord
  extends Model<StockRecordAttributes, StockRecordCreationAttributes>
  implements StockRecordAttributes
{
  declare id: number;
  declare shopId: number;
  declare productId: number;
  declare operatorId: number;
  declare type: 'in' | 'out';
  declare quantity: number;
  declare quantityBefore: number;
  declare quantityAfter: number;
  declare remark: string | null;
  declare createdAt: Date;

  static initModel(sequelize: Sequelize): typeof StockRecord {
    StockRecord.init(
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
        operatorId: {
          type: DataTypes.INTEGER,
          field: 'operator_id',
          allowNull: false,
        },
        type: {
          type: DataTypes.ENUM('in', 'out'),
          allowNull: false,
        },
        quantity: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        quantityBefore: {
          type: DataTypes.INTEGER,
          field: 'quantity_before',
          allowNull: false,
        },
        quantityAfter: {
          type: DataTypes.INTEGER,
          field: 'quantity_after',
          allowNull: false,
        },
        remark: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        createdAt: {
          type: DataTypes.DATE,
        },
      },
      {
        sequelize,
        tableName: 'stock_records',
        timestamps: true,
        updatedAt: false,
      }
    );
    return StockRecord;
  }
}

export default StockRecord;
