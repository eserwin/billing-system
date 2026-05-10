import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './index';

interface SystemSettingAttributes {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updated_by: string | null;
  created_at?: Date;
  updated_at?: Date;
}

interface SystemSettingCreationAttributes extends Optional<SystemSettingAttributes, 'id' | 'description' | 'updated_by' | 'created_at' | 'updated_at'> {}

class SystemSetting extends Model<SystemSettingAttributes, SystemSettingCreationAttributes> implements SystemSettingAttributes {
  declare id: string;
  declare key: string;
  declare value: string;
  declare description: string | null;
  declare updated_by: string | null;
  declare created_at: Date;
  declare updated_at: Date;
}

SystemSetting.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'system_settings',
    modelName: 'SystemSetting',
    paranoid: false,
  }
);

export default SystemSetting;
export { SystemSettingAttributes, SystemSettingCreationAttributes };
