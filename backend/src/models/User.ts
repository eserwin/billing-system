import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './index';
import { UserRole } from '../types/common';

interface UserAttributes {
  id: string;
  email: string;
  full_name: string;
  cognito_sub: string;
  role: UserRole;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: string;
  declare email: string;
  declare full_name: string;
  declare cognito_sub: string;
  declare role: UserRole;
  declare created_at: Date;
  declare updated_at: Date;
  declare deleted_at: Date | null;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cognito_sub: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    role: {
      type: DataTypes.ENUM(...Object.values(UserRole)),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'users',
    modelName: 'User',
  }
);

export default User;
export { UserAttributes, UserCreationAttributes };
