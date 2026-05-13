<template>
  <v-container fluid>
    <v-row class="mb-4" align="center">
      <v-col>
        <v-btn variant="text" prepend-icon="mdi-arrow-left" :to="{ name: 'Customers' }">
          Back to Customers
        </v-btn>
      </v-col>
      <v-col cols="auto" v-if="customer">
        <v-btn
          color="primary"
          prepend-icon="mdi-pencil"
          class="mr-2"
          :to="{ name: 'CustomerEdit', params: { id: customer.id } }"
        >
          Edit
        </v-btn>
        <v-btn
          v-if="customer.deleted_at"
          color="success"
          prepend-icon="mdi-restore"
          @click="onRestore"
        >
          Restore
        </v-btn>
        <v-btn
          v-else
          color="error"
          variant="outlined"
          prepend-icon="mdi-archive"
          @click="archiveDialog = true"
        >
          Archive
        </v-btn>
      </v-col>
    </v-row>

    <v-skeleton-loader v-if="store.loading && !customer" type="card" />

    <template v-else-if="customer">
      <v-row>
        <v-col cols="12" md="8">
          <v-card class="mb-4">
            <v-card-title>Account Information</v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" md="6">
                  <div class="text-caption text-medium-emphasis">Account Number</div>
                  <div class="text-body-1 font-weight-medium">{{ customer.account_number }}</div>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="text-caption text-medium-emphasis">Status</div>
                  <v-chip :color="statusColor(customer.status)" size="small" label>
                    {{ formatStatus(customer.status) }}
                  </v-chip>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="text-caption text-medium-emphasis">Full Name</div>
                  <div class="text-body-1">{{ customer.full_name }}</div>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="text-caption text-medium-emphasis">Mobile Number</div>
                  <div class="text-body-1">{{ customer.mobile_number }}</div>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="text-caption text-medium-emphasis">Email</div>
                  <div class="text-body-1">{{ customer.email || '—' }}</div>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="text-caption text-medium-emphasis">Service Area</div>
                  <div class="text-body-1">{{ customer.service_area }}</div>
                </v-col>
                <v-col cols="12">
                  <div class="text-caption text-medium-emphasis">Address</div>
                  <div class="text-body-1">{{ customer.address }}</div>
                </v-col>
                <v-col cols="12">
                  <div class="text-caption text-medium-emphasis">Installation Address</div>
                  <div class="text-body-1">{{ customer.installation_address }}</div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card class="mb-4">
            <v-card-title>Plan Details</v-card-title>
            <v-card-text>
              <div class="text-caption text-medium-emphasis">Plan Name</div>
              <div class="text-body-1 font-weight-medium">{{ customer.plan?.name || '—' }}</div>

              <div class="text-caption text-medium-emphasis mt-3">Speed</div>
              <div class="text-body-1">{{ customer.plan?.speed || '—' }}</div>

              <div class="text-caption text-medium-emphasis mt-3">Monthly Fee</div>
              <div class="text-body-1 font-weight-medium">
                ₱{{ formatCurrency(customer.plan?.monthly_fee) }}
              </div>

              <div class="text-caption text-medium-emphasis mt-3">Installation Date</div>
              <div class="text-body-1">{{ formatDate(customer.installation_date) }}</div>

              <div class="text-caption text-medium-emphasis mt-3">Member Since</div>
              <div class="text-body-1">{{ formatDate(customer.created_at) }}</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Payment & Invoice History -->
      <v-card>
        <v-tabs v-model="activeTab">
          <v-tab value="payments">Payments</v-tab>
          <v-tab value="invoices">Invoices</v-tab>
        </v-tabs>

        <v-card-text>
          <v-window v-model="activeTab">
            <v-window-item value="payments">
              <v-data-table
                :headers="paymentHeaders"
                :items="payments"
                :loading="paymentsLoading"
                no-data-text="No payments recorded"
              >
                <template #item.amount="{ item }">
                  ₱{{ formatCurrency(item.amount) }}
                </template>
                <template #item.payment_date="{ item }">
                  {{ formatDate(item.payment_date) }}
                </template>
                <template #item.method="{ item }">
                  {{ formatMethod(item.method) }}
                </template>
              </v-data-table>
            </v-window-item>

            <v-window-item value="invoices">
              <v-data-table
                :headers="invoiceHeaders"
                :items="invoices"
                :loading="invoicesLoading"
                no-data-text="No invoices found"
              >
                <template #item.amount="{ item }">
                  ₱{{ formatCurrency(item.amount) }}
                </template>
                <template #item.paid_amount="{ item }">
                  ₱{{ formatCurrency(item.paid_amount) }}
                </template>
                <template #item.due_date="{ item }">
                  {{ formatDate(item.due_date) }}
                </template>
                <template #item.status="{ item }">
                  <v-chip :color="invoiceStatusColor(item.status)" size="small" label>
                    {{ item.status.toUpperCase() }}
                  </v-chip>
                </template>
              </v-data-table>
            </v-window-item>
          </v-window>
        </v-card-text>
      </v-card>
    </template>

    <v-alert v-else-if="store.error" type="error">
      {{ store.error }}
    </v-alert>

    <v-dialog v-model="archiveDialog" max-width="400">
      <v-card>
        <v-card-title>Archive Customer</v-card-title>
        <v-card-text>
          Are you sure you want to archive <strong>{{ customer?.full_name }}</strong>?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="archiveDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="onArchive">Archive</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCustomerStore } from '@/stores/customers';
import api from '@/services/api';
import { format } from 'date-fns';

const route = useRoute();
const router = useRouter();
const store = useCustomerStore();

const activeTab = ref('payments');
const archiveDialog = ref(false);

const payments = ref<any[]>([]);
const invoices = ref<any[]>([]);
const paymentsLoading = ref(false);
const invoicesLoading = ref(false);

const customer = computed(() => store.currentCustomer);

const paymentHeaders = [
  { title: 'Date', key: 'payment_date' },
  { title: 'Amount', key: 'amount' },
  { title: 'Method', key: 'method' },
  { title: 'Reference', key: 'reference_number' },
  { title: 'Notes', key: 'notes' },
];

const invoiceHeaders = [
  { title: 'Period', key: 'period' },
  { title: 'Amount', key: 'amount' },
  { title: 'Paid', key: 'paid_amount' },
  { title: 'Due Date', key: 'due_date' },
  { title: 'Status', key: 'status' },
];

async function loadPayments() {
  const id = route.params.id as string;
  paymentsLoading.value = true;
  try {
    const { data } = await api.get('/payments', { params: { customer_id: id, limit: '50' } });
    payments.value = data.data || [];
  } catch {
    payments.value = [];
  } finally {
    paymentsLoading.value = false;
  }
}

async function loadInvoices() {
  const id = route.params.id as string;
  invoicesLoading.value = true;
  try {
    const { data } = await api.get('/billing', { params: { customer_id: id, limit: '50' } });
    invoices.value = (data.data || []).map((inv: any) => ({
      ...inv,
      period: `${inv.period_month}/${inv.period_year}`,
    }));
  } catch {
    invoices.value = [];
  } finally {
    invoicesLoading.value = false;
  }
}

async function onArchive() {
  if (!customer.value) return;
  await store.removeCustomer(customer.value.id);
  archiveDialog.value = false;
  router.push({ name: 'Customers' });
}

async function onRestore() {
  if (!customer.value) return;
  await store.unarchiveCustomer(customer.value.id);
  await store.loadCustomer(customer.value.id);
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

function invoiceStatusColor(status: string): string {
  const colors: Record<string, string> = {
    paid: 'success',
    partial: 'warning',
    unpaid: 'info',
    overdue: 'error',
  };
  return colors[status] || 'default';
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatCurrency(value?: number): string {
  if (value == null) return '0.00';
  return (value / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 });
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  return format(new Date(dateStr), 'MMM dd, yyyy');
}

function formatMethod(method: string): string {
  const labels: Record<string, string> = {
    cash: 'Cash',
    gcash: 'GCash',
    maya: 'Maya',
    bank_transfer: 'Bank Transfer',
  };
  return labels[method] || method;
}

onMounted(async () => {
  const id = route.params.id as string;
  await store.loadCustomer(id);
  loadPayments();
  loadInvoices();
});
</script>
