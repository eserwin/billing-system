import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './index';
import { InvoiceStatus } from '../types/common';

interface InvoiceAttributes {
  id: string;
  customer_id: string;
  plan_id: string;
  period_year: number;
  period_month: number;
  amount: number;
  paid_amount: number;
  status: InvoiceStatus;
  due_date: string;
  disconnected_days: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

interface InvoiceCreationAttributes extends Optional<InvoiceAttributes, 'id' | 'paid_amount' | 'status' | 'disconnected_days' | 'created_at' | 'updated_at' | 'deleted_at'> {}

class Invoice extends Model<InvoiceAttributes, InvoiceCreationAttributes> implements InvoiceAttributes {
  declare id: string;
  declare customer_id: string;
  declare plan_id: string;
  declare period_year: number;
  declare period_month: number;
  declare amount: number;
  declare paid_amount: number;
  declare status: InvoiceStatus;
  declare due_date: string;
  declare disconnected_days: number;
  declare created_at: Date;
  declare updated_at: Date;
  declare deleted_at: Date | null;
}

Invoice.init(
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
    plan_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'internet_plans',
        key: 'id',
      },
    },
    period_year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    period_month: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Stored in centavos',
    },
    paid_amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Stored in centavos',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(InvoiceStatus)),
      allowNull: false,
      defaultValue: InvoiceStatus.UNPAID,
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    disconnected_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'invoices',
    modelName: 'Invoice',
  }
);

export default Invoice;
export { InvoiceAttributes, InvoiceCreationAttributes };
