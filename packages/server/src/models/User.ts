import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface UserAttributes {
  id: number;
  openid: string;
  nickname: string;
  avatarUrl: string;
  createdAt?: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'nickname' | 'avatarUrl'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: number;
  declare openid: string;
  declare nickname: string;
  declare avatarUrl: string;
  declare createdAt: Date;

  static initModel(sequelize: Sequelize): typeof User {
    User.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        openid: {
          type: DataTypes.STRING,
          unique: true,
          allowNull: false,
        },
        nickname: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: '',
        },
        avatarUrl: {
          type: DataTypes.STRING,
          field: 'avatar_url',
          defaultValue: '',
        },
        createdAt: {
          type: DataTypes.DATE,
        },
      },
      {
        sequelize,
        tableName: 'users',
        timestamps: true,
        updatedAt: false,
      }
    );
    return User;
  }
}

export default User;
