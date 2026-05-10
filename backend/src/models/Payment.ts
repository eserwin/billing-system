import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './index';
import { PaymentMethod } from '../types/common';

interface PaymentAttributes {
  id: string;
  customer_id: string;
  invoice_id: string;
  amount: number;
  method: PaymentMethod;
  reference_number: string | null;
  receiver: string | null;
  payment_date: string;
  notes: string | null;
  recorded_by: string;
  created_at?: Date;
  updated_at?: Date;
}

interface PaymentCreationAttributes extends Optional<PaymentAttributes, 'id' | 'reference_number' | 'receiver' | 'notes' | 'created_at' | 'updated_at'> {}

class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
  declare id: string;
  declare customer_id: string;
  declare invoice_id: string;
  declare amount: number;
  declare method: PaymentMethod;
  declare reference_number: string | null;
  declare receiver: string | null;
  declare payment_date: string;
  declare notes: string | null;
  declare recorded_by: string;
  declare created_at: Date;
  declare updated_at: Date;
}

Payment.init(
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
    invoice_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'invoices',
        key: 'id',
      },
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Stored in centavos',
    },
    method: {
      type: DataTypes.ENUM(...Object.values(PaymentMethod)),
      allowNull: false,
    },
    reference_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    receiver: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    payment_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    recorded_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'payments',
    modelName: 'Payment',
    paranoid: false,
  }
);

export default Payment;
export { PaymentAttributes, PaymentCreationAttributes };
