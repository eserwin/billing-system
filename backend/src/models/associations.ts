import User from './User';
import Customer from './Customer';
import InternetPlan from './InternetPlan';
import Invoice from './Invoice';
import Payment from './Payment';
import CustomerStatus from './CustomerStatus';
import Notification from './Notification';
import MikrotikLog from './MikrotikLog';
import AuditLog from './AuditLog';
import SystemSetting from './SystemSetting';

// Customer belongs to InternetPlan
Customer.belongsTo(InternetPlan, { foreignKey: 'plan_id', as: 'plan' });
InternetPlan.hasMany(Customer, { foreignKey: 'plan_id', as: 'customers' });

// Invoice belongs to Customer and InternetPlan
Invoice.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Customer.hasMany(Invoice, { foreignKey: 'customer_id', as: 'invoices' });

Invoice.belongsTo(InternetPlan, { foreignKey: 'plan_id', as: 'plan' });
InternetPlan.hasMany(Invoice, { foreignKey: 'plan_id', as: 'invoices' });

// Payment belongs to Customer, Invoice, and User (recorded_by)
Payment.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Customer.hasMany(Payment, { foreignKey: 'customer_id', as: 'payments' });

Payment.belongsTo(Invoice, { foreignKey: 'invoice_id', as: 'invoice' });
Invoice.hasMany(Payment, { foreignKey: 'invoice_id', as: 'payments' });

Payment.belongsTo(User, { foreignKey: 'recorded_by', as: 'recorder' });
User.hasMany(Payment, { foreignKey: 'recorded_by', as: 'recorded_payments' });

// CustomerStatus belongs to Customer and User (changed_by)
CustomerStatus.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Customer.hasMany(CustomerStatus, { foreignKey: 'customer_id', as: 'status_history' });

CustomerStatus.belongsTo(User, { foreignKey: 'changed_by', as: 'changed_by_user' });

// Notification belongs to Customer
Notification.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Customer.hasMany(Notification, { foreignKey: 'customer_id', as: 'notifications' });

// MikrotikLog belongs to Customer and User (triggered_by)
MikrotikLog.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Customer.hasMany(MikrotikLog, { foreignKey: 'customer_id', as: 'mikrotik_logs' });

MikrotikLog.belongsTo(User, { foreignKey: 'triggered_by', as: 'triggered_by_user' });

// AuditLog belongs to User
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'audit_logs' });

// SystemSetting updated_by User
SystemSetting.belongsTo(User, { foreignKey: 'updated_by', as: 'updated_by_user' });

export {
  User,
  Customer,
  InternetPlan,
  Invoice,
  Payment,
  CustomerStatus,
  Notification,
  MikrotikLog,
  AuditLog,
  SystemSetting,
};
