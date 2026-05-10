import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { requiresAuth: false, title: 'Login' },
  },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { requiresAuth: true, title: 'Dashboard' },
  },
  {
    path: '/customers',
    name: 'Customers',
    component: () => import('@/views/customers/CustomerList.vue'),
    meta: { requiresAuth: true, title: 'Customers' },
  },
  {
    path: '/customers/create',
    name: 'CustomerCreate',
    component: () => import('@/views/customers/CustomerCreate.vue'),
    meta: { requiresAuth: true, title: 'Add Customer' },
  },
  {
    path: '/customers/:id',
    name: 'CustomerDetail',
    component: () => import('@/views/customers/CustomerDetail.vue'),
    meta: { requiresAuth: true, title: 'Customer Details' },
  },
  {
    path: '/customers/:id/edit',
    name: 'CustomerEdit',
    component: () => import('@/views/customers/CustomerEdit.vue'),
    meta: { requiresAuth: true, title: 'Edit Customer' },
  },
  {
    path: '/plans',
    name: 'Plans',
    component: () => import('@/views/plans/PlanList.vue'),
    meta: { requiresAuth: true, title: 'Internet Plans' },
  },
  {
    path: '/billing',
    name: 'Billing',
    component: () => import('@/views/billing/InvoiceList.vue'),
    meta: { requiresAuth: true, title: 'Billing' },
  },
  {
    path: '/billing/:id',
    name: 'InvoiceDetail',
    component: () => import('@/views/billing/InvoiceDetail.vue'),
    meta: { requiresAuth: true, title: 'Invoice Details' },
  },
  {
    path: '/payments',
    name: 'Payments',
    component: () => import('@/views/payments/PaymentList.vue'),
    meta: { requiresAuth: true, title: 'Payments' },
  },
  {
    path: '/payments/record',
    name: 'RecordPayment',
    component: () => import('@/views/payments/RecordPayment.vue'),
    meta: { requiresAuth: true, title: 'Record Payment' },
  },
  {
    path: '/reports',
    name: 'Reports',
    component: () => import('@/views/reports/CollectionReport.vue'),
    meta: { requiresAuth: true, title: 'Collection Report' },
  },
  {
    path: '/reports/collections',
    name: 'CollectionReport',
    component: () => import('@/views/reports/CollectionReport.vue'),
    meta: { requiresAuth: true, title: 'Collection Report' },
  },
  {
    path: '/reports/monthly',
    name: 'MonthlyIncome',
    component: () => import('@/views/reports/MonthlyIncome.vue'),
    meta: { requiresAuth: true, title: 'Monthly Income' },
  },
  {
    path: '/reports/overdue',
    name: 'OverdueAccounts',
    component: () => import('@/views/reports/OverdueAccounts.vue'),
    meta: { requiresAuth: true, title: 'Overdue Accounts' },
  },
  {
    path: '/mikrotik',
    name: 'MikroTik',
    component: () => import('@/views/settings/MikrotikSettings.vue'),
    meta: { requiresAuth: true, title: 'MikroTik Settings' },
  },
  {
    path: '/notifications',
    name: 'Notifications',
    component: () => import('@/views/settings/NotificationSettings.vue'),
    meta: { requiresAuth: true, title: 'Notifications' },
  },
  {
    path: '/users',
    name: 'Users',
    component: () => import('@/views/settings/UserManagement.vue'),
    meta: { requiresAuth: true, title: 'User Management' },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/settings/MikrotikSettings.vue'),
    meta: { requiresAuth: true, title: 'Settings' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

let sessionRestored = false;

router.beforeEach(async (to, _from, next) => {
  // ============================================
  // SET TO false WHEN COGNITO IS CONFIGURED
  // ============================================
  const bypassAuth = true;

  if (bypassAuth) {
    if (to.name === 'Login') {
      next({ name: 'Dashboard' });
    } else {
      next();
    }
    return;
  }

  if (!sessionRestored) {
    sessionRestored = true;
    try {
      const { useAuth } = await import('@/composables/useAuth');
      const { restoreSession } = useAuth();
      await restoreSession();
    } catch {
      // Session restore failed, continue without auth
    }
  }

  const token = localStorage.getItem('accessToken');

  if (to.meta.requiresAuth !== false && !token) {
    next({ name: 'Login' });
  } else if (to.name === 'Login' && token) {
    next({ name: 'Dashboard' });
  } else {
    next();
  }
});

export default router;
