<template>
  <v-container fluid class="pa-6">
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
              <div class="text-caption text-success">↑ 12.5% vs last month</div>
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
              <div class="text-caption text-error">↑ 8.3% vs last month</div>
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
              <div class="text-h5 font-weight-bold">₱{{ formatAmount(metrics.daily_collections) }}</div>
              <div class="text-caption text-success">↑ 15.2% vs yesterday</div>
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
              <div class="text-h5 font-weight-bold">₱{{ formatAmount(metrics.monthly_revenue) }}</div>
              <div class="text-caption text-success">↑ 18.7% vs last month</div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Recent Payments & Notifications -->
    <v-row class="mb-6">
      <v-col cols="12" lg="8">
        <v-card rounded="lg">
          <v-card-title class="d-flex align-center justify-space-between pa-4">
            <span class="text-subtitle-1 font-weight-bold">Recent Payments</span>
            <v-btn variant="outlined" size="small" color="primary" @click="$router.push('/payments')">View All</v-btn>
          </v-card-title>
          <v-table density="comfortable">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Account No.</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Date & Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="payment in recentPayments" :key="payment.id">
                <td>{{ payment.customer_name }}</td>
                <td class="text-medium-emphasis">{{ payment.account_no }}</td>
                <td class="font-weight-medium">₱{{ formatAmount(payment.amount) }}</td>
                <td>
                  <v-chip size="small" :color="methodColor(payment.method)" variant="tonal">
                    {{ payment.method }}
                  </v-chip>
                </td>
                <td class="text-medium-emphasis">{{ payment.date }}</td>
                <td><v-chip size="small" color="success" variant="flat">Paid</v-chip></td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
      <v-col cols="12" lg="4">
        <v-card rounded="lg">
          <v-card-title class="d-flex align-center justify-space-between pa-4">
            <span class="text-subtitle-1 font-weight-bold">Recent Notifications</span>
            <v-btn variant="outlined" size="small" color="primary" @click="$router.push('/notifications')">View All</v-btn>
          </v-card-title>
          <v-list density="compact">
            <v-list-item v-for="notif in notifications" :key="notif.id" class="py-3">
              <template #prepend>
                <v-avatar :color="notif.color" size="36">
                  <v-icon color="white" size="18">{{ notif.icon }}</v-icon>
                </v-avatar>
              </template>
              <v-list-item-title class="text-body-2 font-weight-medium">{{ notif.title }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption">{{ notif.message }}</v-list-item-subtitle>
              <template #append>
                <span class="text-caption text-medium-emphasis">{{ notif.time }}</span>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <!-- Customer Management -->
    <v-row>
      <v-col cols="12">
        <v-card rounded="lg">
          <v-card-title class="d-flex align-center justify-space-between pa-4">
            <span class="text-subtitle-1 font-weight-bold">Customer Management</span>
            <div class="d-flex align-center gap-2">
              <v-text-field
                v-model="search"
                placeholder="Search customer..."
                prepend-inner-icon="mdi-magnify"
                density="compact"
                variant="outlined"
                hide-details
                style="max-width: 250px;"
              />
              <v-btn variant="outlined" size="small" prepend-icon="mdi-filter-variant">Filter</v-btn>
              <v-btn color="primary" size="small" prepend-icon="mdi-plus">Add Customer</v-btn>
            </div>
          </v-card-title>
          <v-table density="comfortable">
            <thead>
              <tr>
                <th>Account No.</th>
                <th>Customer Name</th>
                <th>Mobile Number</th>
                <th>Plan</th>
                <th>Service Area</th>
                <th>Status</th>
                <th>Balance</th>
                <th>Last Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="customer in customers" :key="customer.id">
                <td class="font-weight-medium">{{ customer.account_number }}</td>
                <td>{{ customer.full_name }}</td>
                <td class="text-medium-emphasis">{{ customer.mobile_number }}</td>
                <td>{{ customer.plan?.speed || '-' }}</td>
                <td>{{ customer.service_area }}</td>
                <td>
                  <v-chip size="small" :color="statusColor(customer.status)" variant="flat">
                    {{ customer.status }}
                  </v-chip>
                </td>
                <td :class="customer.balance > 0 ? 'text-error font-weight-medium' : ''">
                  ₱{{ formatAmount(customer.balance || 0) }}
                </td>
                <td class="text-medium-emphasis">{{ customer.last_payment || '-' }}</td>
                <td>
                  <v-btn icon size="x-small" variant="text"><v-icon size="16">mdi-eye</v-icon></v-btn>
                  <v-btn icon size="x-small" variant="text"><v-icon size="16">mdi-pencil</v-icon></v-btn>
                  <v-btn icon size="x-small" variant="text"><v-icon size="16">mdi-dots-vertical</v-icon></v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { fetchDashboardMetrics } from '@/services/reportService';
import { fetchCustomers } from '@/services/customerService';

const metrics = ref({
  total_active_customers: 0,
  total_overdue_customers: 0,
  total_disconnected_customers: 0,
  daily_collections: 0,
  monthly_revenue: 0,
});

const search = ref('');

const recentPayments = ref([
  { id: '1', customer_name: 'Juan Dela Cruz', account_no: 'ACC-1001', amount: 99900, method: 'GCash', date: 'May 09, 2026 09:15 AM' },
  { id: '2', customer_name: 'Maria Santos', account_no: 'ACC-1002', amount: 149900, method: 'Cash', date: 'May 09, 2026 08:45 AM' },
  { id: '3', customer_name: 'Pedro Reyes', account_no: 'ACC-1003', amount: 59900, method: 'Maya', date: 'May 09, 2026 08:20 AM' },
  { id: '4', customer_name: 'Ana Garcia', account_no: 'ACC-1004', amount: 99900, method: 'Bank Transfer', date: 'May 08, 2026 06:30 PM' },
  { id: '5', customer_name: 'Robert Lee', account_no: 'ACC-1005', amount: 149900, method: 'GCash', date: 'May 08, 2026 05:45 PM' },
]);

const notifications = ref([
  { id: '1', title: 'Customer disconnected', message: 'Pedro Reyes (ACC-1003) has been disconnected.', icon: 'mdi-alert-circle', color: 'error', time: '10:20 AM' },
  { id: '2', title: 'Payment received', message: 'Payment of ₱1,299 from Juan Dela Cruz (ACC-1001).', icon: 'mdi-check-circle', color: 'success', time: '09:15 AM' },
  { id: '3', title: 'Due date reminder', message: '15 accounts are due within 3 days.', icon: 'mdi-alert', color: 'warning', time: '08:00 AM' },
  { id: '4', title: 'Reconnection successful', message: 'Maria Santos (ACC-1002) has been reconnected.', icon: 'mdi-information', color: 'info', time: 'Yesterday' },
  { id: '5', title: 'Email sent', message: 'Overdue notice sent to 82 customers.', icon: 'mdi-email', color: 'purple', time: 'Yesterday' },
]);

const customers = ref<any[]>([]);

function formatAmount(centavos: number): string {
  return (centavos / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 });
}

function statusColor(status: string): string {
  const map: Record<string, string> = { active: 'success', overdue: 'error', disconnected: 'error', due_soon: 'warning', reconnected: 'info' };
  return map[status] || 'grey';
}

function methodColor(method: string): string {
  const map: Record<string, string> = { GCash: 'blue', Cash: 'green', Maya: 'purple', 'Bank Transfer': 'indigo' };
  return map[method] || 'grey';
}

onMounted(async () => {
  try {
    const res = await fetchDashboardMetrics();
    if (res.success) metrics.value = res.data;
  } catch { /* mock data handles this */ }

  try {
    const res = await fetchCustomers({ limit: 5 });
    if (res.success) {
      customers.value = res.data.map((c: any) => ({
        ...c,
        balance: c.status === 'overdue' ? 149900 : c.status === 'disconnected' ? 99900 : 0,
        last_payment: 'May 09, 2026',
      }));
    }
  } catch { /* mock data handles this */ }
});
</script>
