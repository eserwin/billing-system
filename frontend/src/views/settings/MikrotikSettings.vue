<template>
  <v-container fluid>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4">MikroTik Settings</h1>
    </div>

    <v-card :loading="loading">
      <v-card-text>
        <!-- Enable/Disable Toggle -->
        <div class="d-flex align-center mb-6">
          <div>
            <div class="text-subtitle-1 font-weight-medium">MikroTik Integration</div>
            <div class="text-body-2 text-medium-emphasis">
              Enable automatic disconnect/reconnect via MikroTik RouterOS
            </div>
          </div>
          <v-spacer />
          <v-switch
            v-model="settings.enabled"
            color="primary"
            hide-details
            inset
            @update:model-value="saveSettings"
          />
        </div>

        <v-divider class="mb-6" />

        <!-- Overdue Threshold -->
        <v-row>
          <v-col cols="12" sm="6" md="4">
            <v-text-field
              v-model.number="settings.overdue_threshold_days"
              label="Overdue Threshold (days)"
              type="number"
              variant="outlined"
              density="compact"
              hint="Days after due date before auto-disconnect"
              persistent-hint
              :min="1"
              :max="90"
              :disabled="!settings.enabled"
            />
          </v-col>
        </v-row>

        <v-divider class="my-6" />

        <!-- Connection Info (read-only) -->
        <div class="text-subtitle-1 font-weight-medium mb-4">Connection Information</div>
        <v-row>
          <v-col cols="12" sm="6" md="4">
            <v-text-field
              :model-value="settings.host"
              label="Host"
              variant="outlined"
              density="compact"
              disabled
              hint="Configured via environment variables"
              persistent-hint
            />
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <v-text-field
              :model-value="String(settings.port)"
              label="Port"
              variant="outlined"
              density="compact"
              disabled
              hint="Configured via environment variables"
              persistent-hint
            />
          </v-col>
        </v-row>

        <!-- Save Button -->
        <div class="mt-6">
          <v-btn color="primary" @click="saveSettings" :loading="saving">
            <v-icon start>mdi-content-save</v-icon>
            Save Settings
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <v-snackbar v-model="showSnackbar" :color="snackbarColor" timeout="4000">
      {{ snackbarMessage }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/services/api';

interface MikrotikSettings {
  enabled: boolean;
  overdue_threshold_days: number;
  host: string;
  port: number;
}

const settings = ref<MikrotikSettings>({
  enabled: false,
  overdue_threshold_days: 7,
  host: '',
  port: 8728,
});

const loading = ref(false);
const saving = ref(false);
const showSnackbar = ref(false);
const snackbarMessage = ref('');
const snackbarColor = ref('success');

function showMessage(message: string, color = 'success') {
  snackbarMessage.value = message;
  snackbarColor.value = color;
  showSnackbar.value = true;
}

async function loadSettings() {
  loading.value = true;
  try {
    const { data } = await api.get('/mikrotik/settings');
    settings.value = data.data;
  } catch (err: any) {
    showMessage(err.response?.data?.message || 'Failed to load MikroTik settings', 'error');
  } finally {
    loading.value = false;
  }
}

async function saveSettings() {
  saving.value = true;
  try {
    const { data } = await api.put('/mikrotik/settings', {
      enabled: settings.value.enabled,
      overdue_threshold_days: settings.value.overdue_threshold_days,
    });
    settings.value = data.data;
    showMessage('Settings saved successfully');
  } catch (err: any) {
    showMessage(err.response?.data?.message || 'Failed to save settings', 'error');
  } finally {
    saving.value = false;
  }
}

onMounted(loadSettings);
</script>
