/**
 * Mock data for frontend development without backend API.
 * Remove this file and the mock interceptor in api.ts when the backend is ready.
 */

export const mockCustomers = [
  {
    id: 'c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    account_number: 'ISP-2024-0001',
    full_name: 'Juan Dela Cruz',
    address: '123 Rizal St, Brgy. San Jose',
    mobile_number: '09171234567',
    email: 'juan@email.com',
    installation_address: '123 Rizal St, Brgy. San Jose',
    service_area: 'Brgy. San Jose',
    plan_id: 'p1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    installation_date: '2024-01-15',
    status: 'active',
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:00:00Z',
    deleted_at: null,
    plan: { id: 'p1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', name: 'Plan 999', speed: '50 Mbps', monthly_fee: 99900, is_active: true },
  },
  {
    id: 'c2a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    account_number: 'ISP-2024-0002',
    full_name: 'Maria Santos',
    address: '456 Mabini Ave, Brgy. Poblacion',
    mobile_number: '09181234567',
    email: 'maria@email.com',
    installation_address: '456 Mabini Ave, Brgy. Poblacion',
    service_area: 'Brgy. Poblacion',
    plan_id: 'p2a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    installation_date: '2024-02-01',
    status: 'active',
    created_at: '2024-02-01T08:00:00Z',
    updated_at: '2024-02-01T08:00:00Z',
    deleted_at: null,
    plan: { id: 'p2a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', name: 'Plan 1499', speed: '100 Mbps', monthly_fee: 149900, is_active: true },
  },
  {
    id: 'c3a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    account_number: 'ISP-2024-0003',
    full_name: 'Pedro Reyes',
    address: '789 Bonifacio Rd, Brgy. Bagong Silang',
    mobile_number: '09191234567',
    email: 'pedro@email.com',
    installation_address: '789 Bonifacio Rd, Brgy. Bagong Silang',
    service_area: 'Brgy. Bagong Silang',
    plan_id: 'p1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    installation_date: '2024-03-10',
    status: 'overdue',
    created_at: '2024-03-10T08:00:00Z',
    updated_at: '2024-05-01T08:00:00Z',
    deleted_at: null,
    plan: { id: 'p1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', name: 'Plan 999', speed: '50 Mbps', monthly_fee: 99900, is_active: true },
  },
  {
    id: 'c4a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    account_number: 'ISP-2024-0004',
    full_name: 'Ana Garcia',
    address: '321 Luna St, Brgy. Maligaya',
    mobile_number: '09201234567',
    email: null,
    installation_address: '321 Luna St, Brgy. Maligaya',
    service_area: 'Brgy. Maligaya',
    plan_id: 'p3a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    installation_date: '2024-04-20',
    status: 'disconnected',
    created_at: '2024-04-20T08:00:00Z',
    updated_at: '2024-06-01T08:00:00Z',
    deleted_at: null,
    plan: { id: 'p3a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', name: 'Plan 599', speed: '25 Mbps', monthly_fee: 59900, is_active: true },
  },
];

export const mockPlans = [
  { id: 'p1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', name: 'Plan 999', speed: '50 Mbps', monthly_fee: 99900, installation_fee: 150000, is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z', deleted_at: null },
  { id: 'p2a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', name: 'Plan 1499', speed: '100 Mbps', monthly_fee: 149900, installation_fee: 150000, is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z', deleted_at: null },
  { id: 'p3a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', name: 'Plan 599', speed: '25 Mbps', monthly_fee: 59900, installation_fee: 100000, is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z', deleted_at: null },
  { id: 'p4a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', name: 'Plan 1999', speed: '200 Mbps', monthly_fee: 199900, installation_fee: 200000, is_active: false, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-03-01T00:00:00Z', deleted_at: null },
];

export const mockInvoices = [
  { id: 'i1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', customer_id: 'c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', plan_id: 'p1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', period_year: 2024, period_month: 5, amount: 99900, paid_amount: 99900, status: 'paid' as const, due_date: '2024-05-25', disconnected_days: 0, created_at: '2024-05-01T00:00:00Z', updated_at: '2024-05-20T00:00:00Z', deleted_at: null, customer: { id: 'c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', account_number: 'ISP-2024-0001', full_name: 'Juan Dela Cruz' }, plan: { id: 'p1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', name: 'Plan 999', speed: '50 Mbps', monthly_fee: 99900 } },
  { id: 'i2a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', customer_id: 'c2a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', plan_id: 'p2a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', period_year: 2024, period_month: 5, amount: 149900, paid_amount: 0, status: 'unpaid' as const, due_date: '2024-05-30', disconnected_days: 0, created_at: '2024-05-01T00:00:00Z', updated_at: '2024-05-01T00:00:00Z', deleted_at: null, customer: { id: 'c2a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', account_number: 'ISP-2024-0002', full_name: 'Maria Santos' }, plan: { id: 'p2a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', name: 'Plan 1499', speed: '100 Mbps', monthly_fee: 149900 } },
  { id: 'i3a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', customer_id: 'c3a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', plan_id: 'p1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', period_year: 2024, period_month: 5, amount: 99900, paid_amount: 50000, status: 'partial' as const, due_date: '2024-05-20', disconnected_days: 0, created_at: '2024-05-01T00:00:00Z', updated_at: '2024-05-15T00:00:00Z', deleted_at: null, customer: { id: 'c3a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', account_number: 'ISP-2024-0003', full_name: 'Pedro Reyes' }, plan: { id: 'p1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', name: 'Plan 999', speed: '50 Mbps', monthly_fee: 99900 } },
  { id: 'i4a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', customer_id: 'c4a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', plan_id: 'p3a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', period_year: 2024, period_month: 4, amount: 59900, paid_amount: 0, status: 'overdue' as const, due_date: '2024-04-25', disconnected_days: 5, created_at: '2024-04-01T00:00:00Z', updated_at: '2024-05-01T00:00:00Z', deleted_at: null, customer: { id: 'c4a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', account_number: 'ISP-2024-0004', full_name: 'Ana Garcia' }, plan: { id: 'p3a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', name: 'Plan 599', speed: '25 Mbps', monthly_fee: 59900 } },
];

export const mockPayments = [
  { id: 'pay1', customer_id: 'c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', invoice_id: 'i1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', amount: 99900, method: 'gcash' as const, reference_number: 'GC-20240520-001', receiver: 'Admin', payment_date: '2024-05-20', notes: null, recorded_by: 'dev-user-001', created_at: '2024-05-20T10:00:00Z', updated_at: '2024-05-20T10:00:00Z', customer: { id: 'c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', account_number: 'ISP-2024-0001', full_name: 'Juan Dela Cruz' }, invoice: { id: 'i1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', period_year: 2024, period_month: 5, amount: 99900, status: 'paid' } },
  { id: 'pay2', customer_id: 'c3a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', invoice_id: 'i3a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', amount: 50000, method: 'cash' as const, reference_number: null, receiver: 'Cashier', payment_date: '2024-05-15', notes: 'Partial payment', recorded_by: 'dev-user-001', created_at: '2024-05-15T14:00:00Z', updated_at: '2024-05-15T14:00:00Z', customer: { id: 'c3a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', account_number: 'ISP-2024-0003', full_name: 'Pedro Reyes' }, invoice: { id: 'i3a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', period_year: 2024, period_month: 5, amount: 99900, status: 'partial' } },
];

export const mockDashboard = {
  total_active_customers: 2,
  total_overdue_customers: 1,
  total_disconnected_customers: 1,
  daily_collections: 99900,
  monthly_revenue: 149900,
  recent_payments: [
    { id: 'pay1', customer_name: 'Juan Dela Cruz', amount: 99900, method: 'gcash', payment_date: '2024-05-20', created_at: '2024-05-20T10:00:00Z' },
    { id: 'pay2', customer_name: 'Pedro Reyes', amount: 50000, method: 'cash', payment_date: '2024-05-15', created_at: '2024-05-15T14:00:00Z' },
  ],
  recent_disconnections: [
    { id: 'disc1', customer_name: 'Ana Garcia', action: 'disconnect', success: true, created_at: '2024-05-01T08:00:00Z' },
  ],
};

export const mockMonthlyIncome = {
  year: 2024,
  months: [
    { month: 1, month_name: 'January', total_payments: 349700, payment_count: 4 },
    { month: 2, month_name: 'February', total_payments: 399600, payment_count: 4 },
    { month: 3, month_name: 'March', total_payments: 349700, payment_count: 4 },
    { month: 4, month_name: 'April', total_payments: 299800, payment_count: 3 },
    { month: 5, month_name: 'May', total_payments: 149900, payment_count: 2 },
    { month: 6, month_name: 'June', total_payments: 0, payment_count: 0 },
    { month: 7, month_name: 'July', total_payments: 0, payment_count: 0 },
    { month: 8, month_name: 'August', total_payments: 0, payment_count: 0 },
    { month: 9, month_name: 'September', total_payments: 0, payment_count: 0 },
    { month: 10, month_name: 'October', total_payments: 0, payment_count: 0 },
    { month: 11, month_name: 'November', total_payments: 0, payment_count: 0 },
    { month: 12, month_name: 'December', total_payments: 0, payment_count: 0 },
  ],
  total_annual: 1548700,
};
