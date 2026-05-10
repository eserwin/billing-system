import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './index';
import { MikrotikAction } from '../types/common';

interface MikrotikLogAttributes {
  id: string;
  customer_id: string;
  action: MikrotikAction;
  device_info: string | null;
  success: boolean;
  error_message: string | null;
  triggered_by: string | null;
  created_at?: Date;
}

interface MikrotikLogCreationAttributes extends Optional<MikrotikLogAttributes, 'id' | 'device_info' | 'error_message' | 'triggered_by' | 'created_at'> {}

class MikrotikLog extends Model<MikrotikLogAttributes, MikrotikLogCreationAttributes> implements MikrotikLogAttributes {
  declare id: string;
  declare customer_id: string;
  declare action: MikrotikAction;
  declare device_info: string | null;
  declare success: boolean;
  declare error_message: string | null;
  declare triggered_by: string | null;
  declare created_at: Date;
}

MikrotikLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    customer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id',
      },
    },
    action: {
      type: DataTypes.ENUM(...Object.values(MikrotikAction)),
      allowNull: false,
    },
    device_info: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    success: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    triggered_by: {
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
    tableName: 'mikrotik_logs',
    modelName: 'MikrotikLog',
    timestamps: true,
    updatedAt: false,
    paranoid: false,
  }
);

export default MikrotikLog;
export { MikrotikLogAttributes, MikrotikLogCreationAttributes };
