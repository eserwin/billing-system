<template>
  <v-container fluid>
    <v-row class="mb-4" align="center">
      <v-col cols="12" sm="auto" class="d-flex justify-end">
        <v-btn color="primary" prepend-icon="mdi-plus" :to="{ name: 'RecordPayment' }" block class="d-sm-none">
          Record Payment
        </v-btn>
        <v-btn color="primary" prepend-icon="mdi-plus" :to="{ name: 'RecordPayment' }" class="d-none d-sm-flex">
          Record Payment
        </v-btn>
      </v-col>
    </v-row>

    <v-card>
      <v-card-text>
        <v-row dense>
          <v-col cols="12" md="3">
            <v-select
              v-model="methodFilter"
              label="Payment Method"
              :items="methodOptions"
              clearable
              hide-details
              @update:model-value="loadData"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="dateFrom"
              label="Date From"
              type="date"
              hide-details
              @update:model-value="loadData"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="dateTo"
              label="Date To"
              type="date"
              hide-details
              @update:model-value="loadData"
            />
          </v-col>
        </v-row>
      </v-card-text>

      <v-data-table-server
        :headers="headers"
        :items="store.payments"
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

        <template #item.amount="{ item }">
          ₱{{ formatCurrency(item.amount) }}
        </template>

        <template #item.method="{ item }">
          <v-chip size="small" label>{{ formatMethod(item.method) }}</v-chip>
        </template>

        <template #item.payment_date="{ item }">
          {{ formatDate(item.payment_date) }}
        </template>

        <template #item.created_at="{ item }">
          {{ formatDate(item.created_at) }}
        </template>
      </v-data-table-server>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { usePaymentStore } from '@/stores/payments';
import { format } from 'date-fns';

const store = usePaymentStore();

const page = ref(1);
const itemsPerPage = ref(20);
const sortBy = ref('created_at');
const sortOrder = ref<'ASC' | 'DESC'>('DESC');
const methodFilter = ref<string | null>(null);
const dateFrom = ref('');
const dateTo = ref('');

const methodOptions = [
  { title: 'Cash', value: 'cash' },
  { title: 'GCash', value: 'gcash' },
  { title: 'Maya', value: 'maya' },
  { title: 'Bank Transfer', value: 'bank_transfer' },
];

const headers = [
  { title: 'Customer', key: 'customer', sortable: false },
  { title: 'Amount', key: 'amount', sortable: true },
  { title: 'Method', key: 'method', sortable: true },
  { title: 'Reference #', key: 'reference_number', sortable: false },
  { title: 'Payment Date', key: 'payment_date', sortable: true },
  { title: 'Recorded', key: 'created_at', sortable: true },
];

function loadData() {
  store.loadPayments({
    page: page.value,
    limit: itemsPerPage.value,
    sort_by: sortBy.value,
    sort_order: sortOrder.value,
    method: methodFilter.value || undefined,
    date_from: dateFrom.value || undefined,
    date_to: dateTo.value || undefined,
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

onMounted(() => {
  loadData();
});
</script>
