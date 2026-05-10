export interface PaginationParams {
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export enum CustomerStatusEnum {
  ACTIVE = 'active',
  DUE_SOON = 'due_soon',
  OVERDUE = 'overdue',
  DISCONNECTED = 'disconnected',
  RECONNECTED = 'reconnected',
  SUSPENDED = 'suspended',
}

export enum InvoiceStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
  PARTIAL = 'partial',
  OVERDUE = 'overdue',
}

export enum PaymentMethod {
  CASH = 'cash',
  GCASH = 'gcash',
  MAYA = 'maya',
  BANK_TRANSFER = 'bank_transfer',
}

export enum NotificationChannel {
  SMS = 'sms',
  EMAIL = 'email',
}

export enum NotificationType {
  DUE_REMINDER = 'due_reminder',
  OVERDUE_NOTICE = 'overdue_notice',
  PAYMENT_CONFIRMATION = 'payment_confirmation',
  DISCONNECT_WARNING = 'disconnect_warning',
  RECONNECT_CONFIRMATION = 'reconnect_confirmation',
}

export enum MikrotikAction {
  DISCONNECT = 'disconnect',
  RECONNECT = 'reconnect',
  SYNC = 'sync',
}

export enum UserRole {
  SUPER_ADMIN = 'SuperAdmin',
  ADMIN = 'Admin',
  CASHIER = 'Cashier',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}
