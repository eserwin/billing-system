<template>
  <v-container fluid>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4">Overdue Accounts</h1>
      <v-spacer />
      <v-btn color="primary" variant="outlined" @click="loadReport" :loading="loading">
        <v-icon start>mdi-refresh</v-icon>
        Refresh
      </v-btn>
    </div>

    <!-- Summary Cards -->
    <v-row v-if="report" class="mb-4">
      <v-col cols="12" sm="6" md="4">
        <v-card color="error" variant="tonal">
          <v-card-text>
            <div class="text-h5 font-weight-bold">₱{{ formatCurrency(report.total_outstanding) }}</div>
            <div class="text-body-2">Total Outstanding</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-card color="warning" variant="tonal">
          <v-card-text>
            <div class="text-h5 font-weight-bold">{{ report.total_count }}</div>
            <div class="text-body-2">Overdue Customers</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Overdue Table -->
    <v-card v-if="report">
      <v-data-table
        :headers="headers"
        :items="report.customers"
        :items-per-page="20"
        density="compact"
      >
        <template #item.outstanding_amount="{ item }">
          <span class="text-error font-weight-medium">₱{{ formatCurrency(item.outstanding_amount) }}</span>
        </template>
        <template #item.oldest_due_date="{ item }">
          {{ formatDate(item.oldest_due_date) }}
        </template>
        <template #item.actions="{ item }">
          <v-btn
            size="small"
            variant="text"
            color="primary"
            :to="`/customers/${item.customer_id}`"
          >
            View
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-overlay :model-value="loading" contained class="align-center justify-center">
      <v-progress-circular indeterminate size="64" />
    </v-overlay>

    <v-snackbar v-model="showError" color="error" timeout="5000">
      {{ errorMessage }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { fetchOverdueReport, type OverdueReport } from '@/services/reportService';

const report = ref<OverdueReport | null>(null);
const loading = ref(false);
const showError = ref(false);
const errorMessage = ref('');

const headers = [
  { title: 'Customer', key: 'customer_name' },
  { title: 'Account #', key: 'account_number' },
  { title: 'Plan', key: 'plan_name' },
  { title: 'Outstanding', key: 'outstanding_amount' },
  { title: 'Overdue Invoices', key: 'overdue_invoices' },
  { title: 'Oldest Due Date', key: 'oldest_due_date' },
  { title: '', key: 'actions', sortable: false },
];

function formatCurrency(centavos: number): string {
  return (centavos / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

async function loadReport() {
  loading.value = true;
  try {
    const res = await fetchOverdueReport();
    report.value = res.data;
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || 'Failed to load overdue report';
    showError.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(loadReport);
</script>
