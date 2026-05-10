<template>
  <v-container fluid>
    <v-row class="mb-4" align="center">
      <v-col>
        <v-btn variant="text" prepend-icon="mdi-arrow-left" :to="{ name: 'Billing' }">
          Back to Invoices
        </v-btn>
      </v-col>
    </v-row>

    <v-progress-linear v-if="store.loading" indeterminate color="primary" />

    <v-alert v-if="store.error" type="error" class="mb-4">{{ store.error }}</v-alert>

    <template v-if="invoice">
      <v-row>
        <v-col cols="12" md="8">
          <v-card>
            <v-card-title class="d-flex align-center">
              <span>Invoice Details</span>
              <v-spacer />
              <v-chip :color="invoiceStatusColor(invoice.status)" label>
                {{ formatStatus(invoice.status) }}
              </v-chip>
            </v-card-title>
            <v-card-text>
              <v-table>
                <tbody>
                  <tr>
                    <td class="font-weight-bold">Customer</td>
                    <td>{{ invoice.customer?.full_name || '—' }}</td>
                  </tr>
                  <tr>
                    <td class="font-weight-bold">Account #</td>
                    <td>{{ invoice.customer?.account_number || '—' }}</td>
                  </tr>
                  <tr>
                    <td class="font-weight-bold">Plan</td>
                    <td>{{ invoice.plan?.name || '—' }} ({{ invoice.plan?.speed || '' }})</td>
                  </tr>
                  <tr>
                    <td class="font-weight-bold">Billing Period</td>
                    <td>{{ formatPeriod(invoice.period_year, invoice.period_month) }}</td>
                  </tr>
                  <tr>
                    <td class="font-weight-bold">Due Date</td>
                    <td>{{ formatDate(invoice.due_date) }}</td>
                  </tr>
                  <tr>
                    <td class="font-weight-bold">Disconnected Days</td>
                    <td>{{ invoice.disconnected_days }}</td>
                  </tr>
                  <tr>
                    <td class="font-weight-bold">Amount</td>
                    <td class="text-h6">₱{{ formatCurrency(invoice.amount) }}</td>
                  </tr>
                  <tr>
                    <td class="font-weight-bold">Paid Amount</td>
                    <td class="text-h6">₱{{ formatCurrency(invoice.paid_amount) }}</td>
                  </tr>
                  <tr>
                    <td class="font-weight-bold">Balance</td>
                    <td class="text-h6">₱{{ formatCurrency(invoice.amount - invoice.paid_amount) }}</td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
            <v-card-actions>
              <v-btn color="primary" prepend-icon="mdi-file-pdf-box" @click="downloadPdf">
                Export PDF
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card>
            <v-card-title>Timeline</v-card-title>
            <v-card-text>
              <v-list density="compact">
                <v-list-item>
                  <template #prepend>
                    <v-icon color="grey">mdi-calendar-plus</v-icon>
                  </template>
                  <v-list-item-title>Created</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDateTime(invoice.created_at) }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <template #prepend>
                    <v-icon color="grey">mdi-calendar-edit</v-icon>
                  </template>
                  <v-list-item-title>Last Updated</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDateTime(invoice.updated_at) }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useBillingStore } from '@/stores/billing';
import { exportInvoicePdf } from '@/services/billingService';
import { format } from 'date-fns';

const route = useRoute();
const store = useBillingStore();

const invoice = computed(() => store.currentInvoice);

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

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '—';
  return format(new Date(dateStr), 'MMM dd, yyyy hh:mm a');
}

function formatPeriod(year: number, month: number): string {
  const date = new Date(year, month - 1);
  return format(date, 'MMMM yyyy');
}

async function downloadPdf() {
  if (!invoice.value) return;
  try {
    const blob = await exportInvoicePdf(invoice.value.id);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${invoice.value.period_year}-${invoice.value.period_month}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  } catch {
    // PDF export failed silently
  }
}

onMounted(() => {
  const id = route.params.id as string;
  store.loadInvoice(id);
});
</script>
