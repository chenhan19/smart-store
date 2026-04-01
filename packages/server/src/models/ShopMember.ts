import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface ShopMemberAttributes {
  id: number;
  shopId: number;
  userId: number;
  role: 'owner' | 'operator';
  createdAt?: Date;
}

export interface ShopMemberCreationAttributes extends Optional<ShopMemberAttributes, 'id'> {}

export class ShopMember
  extends Model<ShopMemberAttributes, ShopMemberCreationAttributes>
  implements ShopMemberAttributes
{
  declare id: number;
  declare shopId: number;
  declare userId: number;
  declare role: 'owner' | 'operator';
  declare createdAt: Date;

  static initModel(sequelize: Sequelize): typeof ShopMember {
    ShopMember.init(
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        shopId: { type: DataTypes.INTEGER, field: 'shop_id', allowNull: false },
        userId: { type: DataTypes.INTEGER, field: 'user_id', allowNull: false },
        role: { type: DataTypes.ENUM('owner', 'operator'), allowNull: false },
      },
      {
        sequelize,
        tableName: 'shop_members',
        timestamps: true,
        updatedAt: false,
        createdAt: 'created_at',
        indexes: [{ unique: true, fields: ['shop_id', 'user_id'] }],
      }
    );
    return ShopMember;
  }
}

export default ShopMember;
