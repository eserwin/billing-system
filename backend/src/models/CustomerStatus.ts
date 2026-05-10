import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './index';
import { CustomerStatusEnum } from '../types/common';

interface CustomerStatusAttributes {
  id: string;
  customer_id: string;
  previous_status: CustomerStatusEnum;
  new_status: CustomerStatusEnum;
  reason: string | null;
  changed_by: string | null;
  created_at?: Date;
}

interface CustomerStatusCreationAttributes extends Optional<CustomerStatusAttributes, 'id' | 'reason' | 'changed_by' | 'created_at'> {}

class CustomerStatus extends Model<CustomerStatusAttributes, CustomerStatusCreationAttributes> implements CustomerStatusAttributes {
  declare id: string;
  declare customer_id: string;
  declare previous_status: CustomerStatusEnum;
  declare new_status: CustomerStatusEnum;
  declare reason: string | null;
  declare changed_by: string | null;
  declare created_at: Date;
}

CustomerStatus.init(
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
    previous_status: {
      type: DataTypes.ENUM(...Object.values(CustomerStatusEnum)),
      allowNull: false,
    },
    new_status: {
      type: DataTypes.ENUM(...Object.values(CustomerStatusEnum)),
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    changed_by: {
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
    tableName: 'customer_statuses',
    modelName: 'CustomerStatus',
    timestamps: true,
    updatedAt: false,
    paranoid: false,
  }
);

export default CustomerStatus;
export { CustomerStatusAttributes, CustomerStatusCreationAttributes };
