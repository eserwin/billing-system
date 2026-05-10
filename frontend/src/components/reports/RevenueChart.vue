<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon start>mdi-chart-line</v-icon>
      Monthly Revenue
    </v-card-title>
    <v-card-text>
      <Bar v-if="chartData" :data="chartData" :options="chartOptions" />
      <div v-else class="text-center py-8">
        <v-progress-circular indeterminate color="primary" />
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
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
import type { MonthlyIncomeItem } from '@/services/reportService';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const props = defineProps<{
  months: MonthlyIncomeItem[] | null;
}>();

const chartData = computed(() => {
  if (!props.months) return null;
  return {
    labels: props.months.map((m) => m.month_name.substring(0, 3)),
    datasets: [
      {
        label: 'Revenue (₱)',
        data: props.months.map((m) => m.total_payments / 100),
        backgroundColor: 'rgba(25, 118, 210, 0.7)',
        borderColor: 'rgba(25, 118, 210, 1)',
        borderWidth: 1,
      },
    ],
  };
});

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
</script>
