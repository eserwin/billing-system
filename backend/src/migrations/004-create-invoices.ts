import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('invoices', {
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
    plan_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'internet_plans',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
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
      type: DataTypes.ENUM('unpaid', 'paid', 'partial', 'overdue'),
      allowNull: false,
      defaultValue: 'unpaid',
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
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await queryInterface.addIndex('invoices', ['status']);
  await queryInterface.addIndex('invoices', ['created_at']);
  await queryInterface.addIndex('invoices', ['customer_id']);
  await queryInterface.addIndex('invoices', ['due_date']);
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('invoices');
}
