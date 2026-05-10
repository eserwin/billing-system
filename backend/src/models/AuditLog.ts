import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './index';

interface AuditLogAttributes {
  id: string;
  user_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  previous_values: object | null;
  new_values: object | null;
  ip_address: string | null;
  created_at?: Date;
}

interface AuditLogCreationAttributes extends Optional<AuditLogAttributes, 'id' | 'user_id' | 'target_id' | 'previous_values' | 'new_values' | 'ip_address' | 'created_at'> {}

class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
  declare id: string;
  declare user_id: string | null;
  declare action: string;
  declare target_type: string;
  declare target_id: string | null;
  declare previous_values: object | null;
  declare new_values: object | null;
  declare ip_address: string | null;
  declare created_at: Date;
}

AuditLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    target_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    target_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    previous_values: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    new_values: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'audit_logs',
    modelName: 'AuditLog',
    timestamps: true,
    updatedAt: false,
    paranoid: false,
  }
);

export default AuditLog;
export { AuditLogAttributes, AuditLogCreationAttributes };
