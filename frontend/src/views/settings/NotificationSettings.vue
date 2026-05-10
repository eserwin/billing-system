<template>
  <v-container fluid>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4">Notification Settings</h1>
    </div>

    <!-- Notification Channels -->
    <v-card class="mb-6">
      <v-card-title>Channels</v-card-title>
      <v-card-text>
        <div class="d-flex align-center mb-4">
          <v-icon class="mr-3" color="primary">mdi-email</v-icon>
          <div>
            <div class="text-subtitle-1 font-weight-medium">Email (AWS SES)</div>
            <div class="text-body-2 text-medium-emphasis">
              Send notifications via email using AWS SES
            </div>
          </div>
          <v-spacer />
          <v-chip color="success" size="small" variant="tonal">Active</v-chip>
        </div>
        <v-divider class="mb-4" />
        <div class="d-flex align-center">
          <v-icon class="mr-3" color="primary">mdi-message-text</v-icon>
          <div>
            <div class="text-subtitle-1 font-weight-medium">SMS (Semaphore)</div>
            <div class="text-body-2 text-medium-emphasis">
              Send SMS notifications via Semaphore API
            </div>
          </div>
          <v-spacer />
          <v-chip color="success" size="small" variant="tonal">Active</v-chip>
        </div>
      </v-card-text>
    </v-card>

    <!-- Notification Schedule -->
    <v-card class="mb-6">
      <v-card-title>Reminder Schedule</v-card-title>
      <v-card-text>
        <v-list density="compact">
          <v-list-item>
            <template #prepend>
              <v-icon color="info">mdi-clock-alert</v-icon>
            </template>
            <v-list-item-title>Due Date Reminder</v-list-item-title>
            <v-list-item-subtitle>Sent 3 days before invoice due date</v-list-item-subtitle>
          </v-list-item>
          <v-list-item>
            <template #prepend>
              <v-icon color="warning">mdi-alert</v-icon>
            </template>
            <v-list-item-title>Overdue Notice</v-list-item-title>
            <v-list-item-subtitle>Sent 1 day after due date, then every 3 days</v-list-item-subtitle>
          </v-list-item>
          <v-list-item>
            <template #prepend>
              <v-icon color="error">mdi-wifi-off</v-icon>
            </template>
            <v-list-item-title>Disconnect Warning</v-list-item-title>
            <v-list-item-subtitle>Sent 1 day before auto-disconnect</v-list-item-subtitle>
          </v-list-item>
          <v-list-item>
            <template #prepend>
              <v-icon color="success">mdi-check-circle</v-icon>
            </template>
            <v-list-item-title>Payment Confirmation</v-list-item-title>
            <v-list-item-subtitle>Sent immediately after payment is recorded</v-list-item-subtitle>
          </v-list-item>
          <v-list-item>
            <template #prepend>
              <v-icon color="success">mdi-wifi</v-icon>
            </template>
            <v-list-item-title>Reconnection Confirmation</v-list-item-title>
            <v-list-item-subtitle>Sent after customer is reconnected</v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>

    <!-- Recent Notification Logs -->
    <v-card>
      <v-card-title class="d-flex align-center">
        Notification Logs
        <v-spacer />
        <v-btn variant="text" size="small" @click="loadLogs" :loading="loading">
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
      </v-card-title>
      <v-data-table
        :headers="logHeaders"
        :items="logs"
        :loading="loading"
        :items-per-page="10"
        density="compact"
      >
        <template #item.channel="{ item }">
          <v-icon size="small" :color="item.channel === 'email' ? 'primary' : 'success'">
            {{ item.channel === 'email' ? 'mdi-email' : 'mdi-message-text' }}
          </v-icon>
          {{ item.channel }}
        </template>
        <template #item.status="{ item }">
          <v-chip
            :color="item.status === 'sent' ? 'success' : 'error'"
            size="x-small"
            variant="tonal"
          >
            {{ item.status }}
          </v-chip>
        </template>
        <template #item.sent_at="{ item }">
          {{ item.sent_at ? formatDate(item.sent_at) : '—' }}
        </template>
      </v-data-table>
    </v-card>

    <v-snackbar v-model="showError" color="error" timeout="5000">
      {{ errorMessage }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/services/api';

interface NotificationLog {
  id: string;
  customer_id: string;
  channel: string;
  type: string;
  recipient: string;
  message: string;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

const logs = ref<NotificationLog[]>([]);
const loading = ref(false);
const showError = ref(false);
const errorMessage = ref('');

const logHeaders = [
  { title: 'Channel', key: 'channel' },
  { title: 'Type', key: 'type' },
  { title: 'Recipient', key: 'recipient' },
  { title: 'Status', key: 'status' },
  { title: 'Sent At', key: 'sent_at' },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function loadLogs() {
  loading.value = true;
  try {
    const { data } = await api.get('/notifications/logs', { params: { limit: '50' } });
    logs.value = data.data;
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || 'Failed to load notification logs';
    showError.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(loadLogs);
</script>
