<template>
  <v-container fluid>
    <v-row class="mb-4" align="center">
      <v-col cols="12" sm="auto" class="d-flex justify-end">
        <v-btn color="primary" prepend-icon="mdi-receipt-text-plus" :loading="store.loading" @click="confirmGenerate" block class="d-sm-none">
          Generate Billing
        </v-btn>
        <v-btn color="primary" prepend-icon="mdi-receipt-text-plus" :loading="store.loading" @click="confirmGenerate" class="d-none d-sm-flex">
          Generate Billing
        </v-btn>
      </v-col>
    </v-row>

    <v-card>
      <v-card-text>
        <v-row dense>
          <v-col cols="12" md="3">
            <v-select
              v-model="statusFilter"
              label="Status"
              :items="statusOptions"
              clearable
              hide-details
              @update:model-value="loadData"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="periodYear"
              label="Year"
              :items="yearOptions"
              clearable
              hide-details
              @update:model-value="loadData"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="periodMonth"
              label="Month"
              :items="monthOptions"
              clearable
              hide-details
              @update:model-value="loadData"
            />
          </v-col>
        </v-row>
      </v-card-text>

      <v-data-table-server
        :headers="headers"
        :items="store.invoices"
        :items-length="store.meta.total"
        :loading="store.loading"
        :page="page"
        :items-per-page="itemsPerPage"
        @update:page="onPageChange"
        @update:items-per-page="onItemsPerPageChange"
        @update:sort-by="onSortChange"
      >
        <template #item.customer="{ item }">
          {{ item.customer?.full_name || '—' }}
        </template>

        <template #item.period="{ item }">
          {{ formatPeriod(item.period_year, item.period_month) }}
        </template>

        <template #item.amount="{ item }">
          ₱{{ formatCurrency(item.amount) }}
        </template>

        <template #item.paid_amount="{ item }">
          ₱{{ formatCurrency(item.paid_amount) }}
        </template>

        <template #item.status="{ item }">
          <v-chip :color="invoiceStatusColor(item.status)" size="small" label>
            {{ formatStatus(item.status) }}
          </v-chip>
        </template>

        <template #item.due_date="{ item }">
          {{ formatDate(item.due_date) }}
        </template>

        <template #item.actions="{ item }">
          <v-btn icon size="small" variant="text" :to="{ name: 'InvoiceDetail', params: { id: item.id } }">
            <v-icon>mdi-eye</v-icon>
          </v-btn>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- Generate Billing Confirmation -->
    <v-dialog v-model="generateDialog" max-width="400">
      <v-card>
        <v-card-title>Generate Monthly Billing</v-card-title>
        <v-card-text>
          This will generate invoices for all active customers for the current billing period. Continue?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="generateDialog = false">Cancel</v-btn>
          <v-btn color="primary" :loading="store.loading" @click="doGenerate">Generate</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useBillingStore } from '@/stores/billing';
import { format } from 'date-fns';

const store = useBillingStore();

const page = ref(1);
const itemsPerPage = ref(20);
const sortBy = ref('created_at');
const sortOrder = ref<'ASC' | 'DESC'>('DESC');
const statusFilter = ref<string | null>(null);
const periodYear = ref<number | null>(null);
const periodMonth = ref<number | null>(null);

const generateDialog = ref(false);
const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

const statusOptions = [
  { title: 'Unpaid', value: 'unpaid' },
  { title: 'Paid', value: 'paid' },
  { title: 'Partial', value: 'partial' },
  { title: 'Overdue', value: 'overdue' },
];

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 5 }, (_, i) => ({
  title: String(currentYear - i),
  value: currentYear - i,
}));

const monthOptions = [
  { title: 'January', value: 1 },
  { title: 'February', value: 2 },
  { title: 'March', value: 3 },
  { title: 'April', value: 4 },
  { title: 'May', value: 5 },
  { title: 'June', value: 6 },
  { title: 'July', value: 7 },
  { title: 'August', value: 8 },
  { title: 'September', value: 9 },
  { title: 'October', value: 10 },
  { title: 'November', value: 11 },
  { title: 'December', value: 12 },
];

const headers = [
  { title: 'Customer', key: 'customer', sortable: false },
  { title: 'Period', key: 'period', sortable: false },
  { title: 'Amount', key: 'amount', sortable: true },
  { title: 'Paid', key: 'paid_amount', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Due Date', key: 'due_date', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'center' as const },
];

function loadData() {
  store.loadInvoices({
    page: page.value,
    limit: itemsPerPage.value,
    sort_by: sortBy.value,
    sort_order: sortOrder.value,
    status: statusFilter.value || undefined,
    period_year: periodYear.value || undefined,
    period_month: periodMonth.value || undefined,
  });
}

function onPageChange(newPage: number) {
  page.value = newPage;
  loadData();
}

function onItemsPerPageChange(newLimit: number) {
  itemsPerPage.value = newLimit;
  page.value = 1;
  loadData();
}

function onSortChange(sortOptions: any[]) {
  if (sortOptions.length > 0) {
    sortBy.value = sortOptions[0].key;
    sortOrder.value = sortOptions[0].order === 'asc' ? 'ASC' : 'DESC';
  } else {
    sortBy.value = 'created_at';
    sortOrder.value = 'DESC';
  }
  loadData();
}

function confirmGenerate() {
  generateDialog.value = true;
}

async function doGenerate() {
  try {
    const result = await store.generate();
    generateDialog.value = false;
    snackbarColor.value = 'success';
    snackbarText.value = `Generated ${result.generated} invoice(s) successfully.`;
    snackbar.value = true;
    loadData();
  } catch {
    snackbarColor.value = 'error';
    snackbarText.value = store.error || 'Failed to generate billing.';
    snackbar.value = true;
  }
}

function invoiceStatusColor(status: string): string {
  const colors: Record<string, string> = {
    unpaid: 'warning',
    paid: 'success',
    partial: 'info',
    overdue: 'error',
  };
  return colors[status] || 'default';
}

function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatCurrency(value?: number): string {
  if (value == null) return '0.00';
  return (value / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 });
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  return format(new Date(dateStr), 'MMM dd, yyyy');
}

function formatPeriod(year: number, month: number): string {
  const date = new Date(year, month - 1);
  return format(date, 'MMMM yyyy');
}

onMounted(() => {
  loadData();
});
</script>
