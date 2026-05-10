<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title>ISP Billing System</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-form ref="formRef">
              <v-alert
                v-if="authStore.error"
                type="error"
                variant="tonal"
                class="mb-4"
                closable
                @click:close="authStore.setError(null)"
              >
                {{ authStore.error }}
              </v-alert>

              <v-text-field
                v-model="email"
                label="Email"
                type="email"
                prepend-inner-icon="mdi-email"
                :rules="bypassAuth ? [] : [rules.required, rules.email]"
                :disabled="authStore.loading"
                autocomplete="email"
              />

              <v-text-field
                v-model="password"
                label="Password"
                :type="showPassword ? 'text' : 'password'"
                prepend-inner-icon="mdi-lock"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                :rules="bypassAuth ? [] : [rules.required]"
                :disabled="authStore.loading"
                autocomplete="current-password"
                @click:append-inner="showPassword = !showPassword"
              />

              <v-btn
                color="primary"
                block
                size="large"
                :loading="authStore.loading"
                class="mt-4"
                @click="handleLogin"
              >
                Sign In
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const { login } = useAuth();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const formRef = ref();
const bypassAuth = import.meta.env.VITE_BYPASS_AUTH === 'true';

onMounted(() => {
  if (bypassAuth) {
    authStore.setUser({ email: 'admin@isp.local', name: 'Dev Admin', role: 'SuperAdmin', sub: 'dev-user-001' });
    router.replace({ name: 'Dashboard' });
  }
});

const rules = {
  required: (v: string) => !!v || 'This field is required',
  email: (v: string) => /.+@.+\..+/.test(v) || 'Enter a valid email',
};

async function handleLogin() {
  if (bypassAuth) {
    authStore.setUser({ email: 'admin@isp.local', name: 'Dev Admin', role: 'SuperAdmin', sub: 'dev-user-001' });
    router.push({ name: 'Dashboard' });
    return;
  }

  const { valid } = await formRef.value.validate();
  if (!valid) return;

  try {
    await login(email.value, password.value);
    router.push({ name: 'Dashboard' });
  } catch {
    // Error is already set in the store by useAuth
  }
}
</script>
