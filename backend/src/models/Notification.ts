import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './index';
import { NotificationChannel, NotificationType, NotificationStatus } from '../types/common';

interface NotificationAttributes {
  id: string;
  customer_id: string;
  channel: NotificationChannel;
  type: NotificationType;
  recipient: string;
  message: string;
  status: NotificationStatus;
  error_message: string | null;
  sent_at: Date | null;
  created_at?: Date;
}

interface NotificationCreationAttributes extends Optional<NotificationAttributes, 'id' | 'status' | 'error_message' | 'sent_at' | 'created_at'> {}

class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
  declare id: string;
  declare customer_id: string;
  declare channel: NotificationChannel;
  declare type: NotificationType;
  declare recipient: string;
  declare message: string;
  declare status: NotificationStatus;
  declare error_message: string | null;
  declare sent_at: Date | null;
  declare created_at: Date;
}

Notification.init(
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
    channel: {
      type: DataTypes.ENUM(...Object.values(NotificationChannel)),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(...Object.values(NotificationType)),
      allowNull: false,
    },
    recipient: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(NotificationStatus)),
      allowNull: false,
      defaultValue: NotificationStatus.PENDING,
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'notifications',
    modelName: 'Notification',
    timestamps: true,
    updatedAt: false,
    paranoid: false,
  }
);

export default Notification;
export { NotificationAttributes, NotificationCreationAttributes };
