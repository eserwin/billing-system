<template>
  <v-container fluid>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4">Monthly Income Report</h1>
    </div>

    <!-- Year Filter -->
    <v-card class="mb-6">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" sm="4" md="3">
            <v-select
              v-model="selectedYear"
              :items="yearOptions"
              label="Year"
              variant="outlined"
              density="compact"
              hide-details
              @update:model-value="loadReport"
            />
          </v-col>
          <v-col v-if="report" cols="12" sm="4" md="3">
            <v-card color="primary" variant="tonal" flat>
              <v-card-text class="py-2">
                <div class="text-h6 font-weight-bold">₱{{ formatCurrency(report.total_annual) }}</div>
                <div class="text-caption">Annual Total</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Chart -->
    <v-card v-if="report" class="mb-6">
      <v-card-title>Revenue by Month</v-card-title>
      <v-card-text>
        <Bar :data="chartData" :options="chartOptions" />
      </v-card-text>
    </v-card>

    <!-- Monthly Breakdown Table -->
    <v-card v-if="report">
      <v-card-title>Monthly Breakdown</v-card-title>
      <v-data-table
        :headers="headers"
        :items="report.months"
        :items-per-page="-1"
        density="compact"
        hide-default-footer
      >
        <template #item.total_payments="{ item }">
          ₱{{ formatCurrency(item.total_payments) }}
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
import { ref, computed, onMounted } from 'vue';
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { fetchMonthlyIncomeReport, type MonthlyIncomeReport } from '@/services/reportService';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);
const selectedYear = ref(currentYear);
const report = ref<MonthlyIncomeReport | null>(null);
const loading = ref(false);
const showError = ref(false);
const errorMessage = ref('');

const headers = [
  { title: 'Month', key: 'month_name' },
  { title: 'Total Revenue', key: 'total_payments' },
  { title: 'Payment Count', key: 'payment_count' },
];

const chartData = computed(() => ({
  labels: report.value?.months.map((m) => m.month_name.substring(0, 3)) ?? [],
  datasets: [
    {
      label: 'Revenue (₱)',
      data: report.value?.months.map((m) => m.total_payments / 100) ?? [],
      backgroundColor: 'rgba(76, 175, 80, 0.7)',
      borderColor: 'rgba(76, 175, 80, 1)',
      borderWidth: 1,
    },
  ],
}));

const chartOptions = {
  responsive: true,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context: any) => `₱${context.raw.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value: any) => `₱${Number(value).toLocaleString()}`,
      },
    },
  },
};

function formatCurrency(centavos: number): string {
  return (centavos / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 });
}

async function loadReport() {
  loading.value = true;
  try {
    const res = await fetchMonthlyIncomeReport(selectedYear.value);
    report.value = res.data;
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || 'Failed to load monthly income report';
    showError.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(loadReport);
</script>
