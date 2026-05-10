import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('notifications', {
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
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    channel: {
      type: DataTypes.ENUM('sms', 'email'),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('due_reminder', 'overdue_notice', 'payment_confirmation', 'disconnect_warning', 'reconnect_confirmation'),
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
      type: DataTypes.ENUM('pending', 'sent', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  await queryInterface.addIndex('notifications', ['customer_id']);
  await queryInterface.addIndex('notifications', ['status']);
  await queryInterface.addIndex('notifications', ['created_at']);
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('notifications');
}
