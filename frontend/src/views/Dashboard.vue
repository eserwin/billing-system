<template>
  <v-container fluid class="pa-4 pa-md-6">
    <!-- Stats Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" lg="3">
        <v-card rounded="lg" class="pa-4" color="blue-lighten-5">
          <div class="d-flex align-center">
            <v-avatar color="blue" size="48" class="mr-4">
              <v-icon color="white">mdi-account-group</v-icon>
            </v-avatar>
            <div>
              <div class="text-caption text-medium-emphasis">Total Active Customers</div>
              <div class="text-h5 font-weight-bold">{{ metrics.total_active_customers.toLocaleString() }}</div>
            </div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <v-card rounded="lg" class="pa-4" color="orange-lighten-5">
          <div class="d-flex align-center">
            <v-avatar color="orange" size="48" class="mr-4">
              <v-icon color="white">mdi-alert-circle</v-icon>
            </v-avatar>
            <div>
              <div class="text-caption text-medium-emphasis">Overdue Accounts</div>
              <div class="text-h5 font-weight-bold">{{ metrics.total_overdue_customers }}</div>
            </div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <v-card rounded="lg" class="pa-4" color="green-lighten-5">
          <div class="d-flex align-center">
            <v-avatar color="green" size="48" class="mr-4">
              <v-icon color="white">mdi-cash</v-icon>
            </v-avatar>
            <div>
              <div class="text-caption text-medium-emphasis">Daily Collections</div>
              <div class="text-h5 font-weight-bold">₱{{ formatCurrency(metrics.daily_collections) }}</div>
            </div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <v-card rounded="lg" class="pa-4" color="purple-lighten-5">
          <div class="d-flex align-center">
            <v-avatar color="purple" size="48" class="mr-4">
              <v-icon color="white">mdi-chart-line</v-icon>
            </v-avatar>
            <div>
              <div class="text-caption text-medium-emphasis">Monthly Revenue</div>
              <div class="text-h5 font-weight-bold">₱{{ formatCurrency(metrics.monthly_revenue) }}</div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Recent Payments -->
    <v-row class="mb-6">
      <v-col cols="12" lg="8">
        <v-card rounded="lg">
          <v-card-title class="d-flex align-center justify-space-between pa-4">
            <span class="text-subtitle-1 font-weight-bold">Recent Payments</span>
            <v-btn variant="outlined" size="small" color="primary" :to="{ name: 'Payments' }">View All</v-btn>
          </v-card-title>
          <v-data-table-server
            :headers="paymentHeaders"
            :items="payments"
            :items-length="paymentTotal"
            :loading="paymentLoading"
            :page="paymentPage"
            :items-per-page="PAGE_SIZE"
            :items-per-page-options="[10]"
            @update:page="onPaymentPageChange"
          >
            <template #item.customer="{ item }">
              {{ item.customer?.full_name || '-' }}
            </template>
            <template #item.amount="{ item }">
              ₱{{ formatCurrency(item.amount) }}
            </template>
            <template #item.method="{ item }">
              <v-chip size="small" :color="methodColor(item.method)" label>
                {{ formatMethod(item.method) }}
              </v-chip>
            </template>
            <template #item.payment_date="{ item }">
              {{ formatDate(item.payment_date) }}
            </template>
          </v-data-table-server>
        </v-card>
      </v-col>
      <v-col cols="12" lg="4">
        <v-card rounded="lg">
          <v-card-title class="pa-4">
            <span class="text-subtitle-1 font-weight-bold">Recent Activity</span>
          </v-card-title>
          <v-list density="compact">
            <v-list-item v-for="activity in recentActivity" :key="activity.id" class="py-3">
              <template #prepend>
                <v-avatar :color="activity.action === 'disconnect' ? 'error' : 'success'" size="36">
                  <v-icon color="white" size="18">{{ activity.action === 'disconnect' ? 'mdi-wifi-off' : 'mdi-wifi' }}</v-icon>
                </v-avatar>
              </template>
              <v-list-item-title class="text-body-2 font-weight-medium">{{ activity.customer_name }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption">{{ activity.action === 'disconnect' ? 'Disconnected' : 'Reconnected' }}</v-list-item-subtitle>
              <template #append>
                <span class="text-caption text-medium-emphasis">{{ formatDate(activity.created_at) }}</span>
              </template>
            </v-list-item>
            <v-list-item v-if="recentActivity.length === 0">
              <v-list-item-title class="text-body-2 text-medium-emphasis text-center">No recent activity</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <!-- Customer Management -->
    <v-row>
      <v-col cols="12">
        <v-card rounded="lg">
          <v-card-title class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between pa-4 ga-2">
            <span class="text-subtitle-1 font-weight-bold">Customer Management</span>
            <div class="d-flex align-center gap-2 w-100 w-sm-auto">
              <v-text-field
                v-model="search"
                placeholder="Search customer..."
                prepend-inner-icon="mdi-magnify"
                density="compact"
                variant="outlined"
                hide-details
                class="search-field"
                @keyup.enter="loadCustomers"
              />
              <v-btn color="primary" size="small" prepend-icon="mdi-plus" :to="{ name: 'CustomerCreate' }">Add</v-btn>
            </div>
          </v-card-title>
          <v-data-table-server
            :headers="customerHeaders"
            :items="customers"
            :items-length="customerTotal"
            :loading="customerLoading"
            :page="customerPage"
            :items-per-page="PAGE_SIZE"
            :items-per-page-options="[10]"
            @update:page="onCustomerPageChange"
          >
            <template #item.plan="{ item }">
              {{ item.plan?.name || '-' }}
            </template>
            <template #item.status="{ item }">
              <v-chip :color="statusColor(item.status)" size="small" label>
                {{ formatStatus(item.status) }}
              </v-chip>
            </template>
            <template #item.actions="{ item }">
              <v-btn icon size="small" variant="text" :to="{ name: 'CustomerDetail', params: { id: item.id } }">
                <v-icon>mdi-eye</v-icon>
              </v-btn>
              <v-btn icon size="small" variant="text" :to="{ name: 'CustomerEdit', params: { id: item.id } }">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
            </template>
          </v-data-table-server>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { fetchDashboardMetrics } from '@/services/reportService';
import { fetchCustomers } from '@/services/customerService';
import { fetchPayments } from '@/services/paymentService';
import type { DashboardMetrics, RecentDisconnection } from '@/services/reportService';
import { format } from 'date-fns';

const PAGE_SIZE = 10;

const metrics = ref<DashboardMetrics>({
  total_active_customers: 0,
  total_overdue_customers: 0,
  total_disconnected_customers: 0,
  daily_collections: 0,
  monthly_revenue: 0,
  recent_payments: [],
  recent_disconnections: [],
});

const search = ref('');

// Payments
const payments = ref<any[]>([]);
const paymentTotal = ref(0);
const paymentPage = ref(1);
const paymentLoading = ref(false);

const paymentHeaders = [
  { title: 'Customer', key: 'customer', sortable: false },
  { title: 'Amount', key: 'amount', sortable: false },
  { title: 'Method', key: 'method', sortable: false },
  { title: 'Payment Date', key: 'payment_date', sortable: false },
];

// Recent activity
const recentActivity = ref<RecentDisconnection[]>([]);

// Customers
const customers = ref<any[]>([]);
const customerTotal = ref(0);
const customerPage = ref(1);
const customerLoading = ref(false);

const customerHeaders = [
  { title: 'Account #', key: 'account_number', sortable: false },
  { title: 'Name', key: 'full_name', sortable: false },
  { title: 'Mobile', key: 'mobile_number', sortable: false },
  { title: 'Plan', key: 'plan', sortable: false },
  { title: 'Service Area', key: 'service_area', sortable: false },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false, align: 'center' as const },
];

async function loadPayments() {
  paymentLoading.value = true;
  try {
    const res = await fetchPayments({ page: paymentPage.value, limit: PAGE_SIZE, sort_by: 'payment_date', sort_order: 'DESC' });
    if (res.success) {
      payments.value = res.data;
      paymentTotal.value = res.meta.total;
    }
  } catch { /* handled */ }
  paymentLoading.value = false;
}

async function loadCustomers() {
  customerLoading.value = true;
  try {
    const res = await fetchCustomers({ page: customerPage.value, limit: PAGE_SIZE, search: search.value || undefined });
    if (res.success) {
      customers.value = res.data;
      customerTotal.value = res.meta.total;
    }
  } catch { /* handled */ }
  customerLoading.value = false;
}

function onPaymentPageChange(newPage: number) {
  paymentPage.value = newPage;
  loadPayments();
}

function onCustomerPageChange(newPage: number) {
  customerPage.value = newPage;
  loadCustomers();
}

function formatCurrency(value?: number): string {
  if (value == null) return '0.00';
  return (value / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 });
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  return format(new Date(dateStr), 'MMM dd, yyyy');
}

function statusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'success',
    due_soon: 'warning',
    overdue: 'error',
    disconnected: 'grey',
    reconnected: 'info',
    suspended: 'deep-purple',
  };
  return colors[status] || 'default';
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function methodColor(method: string): string {
  const map: Record<string, string> = { gcash: 'blue', cash: 'green', maya: 'purple', bank_transfer: 'indigo' };
  return map[method?.toLowerCase()] || 'grey';
}

function formatMethod(method: string): string {
  const labels: Record<string, string> = { cash: 'Cash', gcash: 'GCash', maya: 'Maya', bank_transfer: 'Bank Transfer' };
  return labels[method] || method;
}

onMounted(async () => {
  try {
    const res = await fetchDashboardMetrics();
    if (res.success) {
      metrics.value = res.data;
      recentActivity.value = res.data.recent_disconnections?.slice(0, 10) || [];
    }
  } catch { /* handled */ }

  await loadPayments();
  await loadCustomers();
});
</script>

<style scoped>
.search-field {
  max-width: 250px;
}

@media (max-width: 600px) {
  .search-field {
    max-width: 100%;
  }
}
</style>
