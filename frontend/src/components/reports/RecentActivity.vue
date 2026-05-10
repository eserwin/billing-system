<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon start>mdi-history</v-icon>
      Recent Activity
    </v-card-title>
    <v-card-text class="pa-0">
      <v-tabs v-model="tab" density="compact">
        <v-tab value="payments">Payments</v-tab>
        <v-tab value="connections">Connections</v-tab>
      </v-tabs>

      <v-window v-model="tab">
        <v-window-item value="payments">
          <v-list density="compact" v-if="recentPayments.length">
            <v-list-item
              v-for="payment in recentPayments"
              :key="payment.id"
              :subtitle="`${payment.method} • ${formatDate(payment.payment_date)}`"
            >
              <template #prepend>
                <v-icon color="success" size="small">mdi-cash-check</v-icon>
              </template>
              <v-list-item-title>{{ payment.customer_name }}</v-list-item-title>
              <template #append>
                <span class="text-success font-weight-medium">
                  ₱{{ formatCurrency(payment.amount) }}
                </span>
              </template>
            </v-list-item>
          </v-list>
          <div v-else class="text-center py-6 text-medium-emphasis">
            No recent payments
          </div>
        </v-window-item>

        <v-window-item value="connections">
          <v-list density="compact" v-if="recentDisconnections.length">
            <v-list-item
              v-for="event in recentDisconnections"
              :key="event.id"
              :subtitle="formatDate(event.created_at)"
            >
              <template #prepend>
                <v-icon
                  :color="event.action === 'reconnect' ? 'success' : 'error'"
                  size="small"
                >
                  {{ event.action === 'reconnect' ? 'mdi-wifi' : 'mdi-wifi-off' }}
                </v-icon>
              </template>
              <v-list-item-title>{{ event.customer_name }}</v-list-item-title>
              <template #append>
                <v-chip
                  :color="event.success ? 'success' : 'error'"
                  size="x-small"
                  variant="tonal"
                >
                  {{ event.success ? 'Success' : 'Failed' }}
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
          <div v-else class="text-center py-6 text-medium-emphasis">
            No recent connection events
          </div>
        </v-window-item>
      </v-window>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { RecentPayment, RecentDisconnection } from '@/services/reportService';

defineProps<{
  recentPayments: RecentPayment[];
  recentDisconnections: RecentDisconnection[];
}>();

const tab = ref('payments');

function formatCurrency(centavos: number): string {
  return (centavos / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 });
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}
</script>
