<template>
  <v-container fluid>
    <!-- Date Range Filter -->
    <v-card class="mb-6">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" sm="4" md="3">
            <v-text-field
              v-model="dateFrom"
              label="From"
              type="date"
              variant="outlined"
              density="compact"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="4" md="3">
            <v-text-field
              v-model="dateTo"
              label="To"
              type="date"
              variant="outlined"
              density="compact"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="4" md="3">
            <v-btn color="primary" @click="loadReport" :loading="loading">
              <v-icon start>mdi-magnify</v-icon>
              Generate Report
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Summary -->
    <v-row v-if="report" class="mb-4">
      <v-col cols="12" sm="6" md="4">
        <v-card color="success" variant="tonal">
          <v-card-text>
            <div class="text-h5 font-weight-bold">₱{{ formatCurrency(report.total_amount) }}</div>
            <div class="text-body-2">Total Collections</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-card color="info" variant="tonal">
          <v-card-text>
            <div class="text-h5 font-weight-bold">{{ report.total_count }}</div>
            <div class="text-body-2">Total Payments</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Payments Table -->
    <v-card v-if="report">
      <v-data-table
        :headers="headers"
        :items="report.payments"
        :items-per-page="20"
        density="compact"
      >
        <template #item.amount="{ item }">
          ₱{{ formatCurrency(item.amount) }}
        </template>
        <template #item.method="{ item }">
          <v-chip size="small" variant="tonal">{{ item.method }}</v-chip>
        </template>
        <template #item.payment_date="{ item }">
          {{ formatDate(item.payment_date) }}
        </template>
      </v-data-table>
    </v-card>

    <!-- Empty state -->
    <v-card v-if="!report && !loading" class="text-center py-12">
      <v-icon size="64" color="grey">mdi-file-chart-outline</v-icon>
      <div class="text-h6 mt-4 text-medium-emphasis">Select a date range to generate the report</div>
    </v-card>

    <v-snackbar v-model="showError" color="error" timeout="5000">
      {{ errorMessage }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { fetchCollectionReport, type CollectionReport } from '@/services/reportService';

const today = new Date().toISOString().split('T')[0];
const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

const dateFrom = ref(firstOfMonth);
const dateTo = ref(today);
const report = ref<CollectionReport | null>(null);
const loading = ref(false);
const showError = ref(false);
const errorMessage = ref('');

const headers = [
  { title: 'Customer', key: 'customer_name' },
  { title: 'Account #', key: 'account_number' },
  { title: 'Amount', key: 'amount' },
  { title: 'Method', key: 'method' },
  { title: 'Reference', key: 'reference_number' },
  { title: 'Date', key: 'payment_date' },
];

function formatCurrency(centavos: number): string {
  return (centavos / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

async function loadReport() {
  if (!dateFrom.value || !dateTo.value) return;
  loading.value = true;
  try {
    const res = await fetchCollectionReport(dateFrom.value, dateTo.value);
    report.value = res.data;
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || 'Failed to load collection report';
    showError.value = true;
  } finally {
    loading.value = false;
  }
}
</script>
