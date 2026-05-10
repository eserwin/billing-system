import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './index';
import { CustomerStatusEnum } from '../types/common';

interface CustomerAttributes {
  id: string;
  account_number: string;
  full_name: string;
  address: string;
  mobile_number: string;
  email: string | null;
  installation_address: string;
  service_area: string;
  plan_id: string;
  installation_date: string;
  status: CustomerStatusEnum;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

interface CustomerCreationAttributes extends Optional<CustomerAttributes, 'id' | 'email' | 'status' | 'created_at' | 'updated_at' | 'deleted_at'> {}

class Customer extends Model<CustomerAttributes, CustomerCreationAttributes> implements CustomerAttributes {
  declare id: string;
  declare account_number: string;
  declare full_name: string;
  declare address: string;
  declare mobile_number: string;
  declare email: string | null;
  declare installation_address: string;
  declare service_area: string;
  declare plan_id: string;
  declare installation_date: string;
  declare status: CustomerStatusEnum;
  declare created_at: Date;
  declare updated_at: Date;
  declare deleted_at: Date | null;
}

Customer.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    account_number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    mobile_number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    installation_address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    service_area: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    plan_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'internet_plans',
        key: 'id',
      },
    },
    installation_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(CustomerStatusEnum)),
      allowNull: false,
      defaultValue: CustomerStatusEnum.ACTIVE,
    },
  },
  {
    sequelize,
    tableName: 'customers',
    modelName: 'Customer',
  }
);

export default Customer;
export { CustomerAttributes, CustomerCreationAttributes };
