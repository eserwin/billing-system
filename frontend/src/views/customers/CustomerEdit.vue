<template>
  <v-container fluid>
    <v-row class="mb-4">
      <v-col>
        <v-btn variant="text" prepend-icon="mdi-arrow-left" :to="{ name: 'Customers' }">
          Back to Customers
        </v-btn>
        <h1 class="text-h4 mt-2">Edit Customer</h1>
      </v-col>
    </v-row>

    <v-skeleton-loader v-if="loading && !formLoaded" type="card" />

    <v-card v-else max-width="800">
      <v-card-text>
        <v-form @submit.prevent="onSubmit">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.full_name"
                label="Full Name *"
                :error-messages="errors.full_name"
                @update:model-value="clearError('full_name')"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.mobile_number"
                label="Mobile Number *"
                :error-messages="errors.mobile_number"
                @update:model-value="clearError('mobile_number')"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.email"
                label="Email"
                type="email"
                :error-messages="errors.email"
                @update:model-value="clearError('email')"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="form.plan_id"
                label="Internet Plan *"
                :items="plans"
                item-title="label"
                item-value="value"
                :error-messages="errors.plan_id"
                @update:model-value="clearError('plan_id')"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="form.address"
                label="Address *"
                :error-messages="errors.address"
                @update:model-value="clearError('address')"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="form.installation_address"
                label="Installation Address *"
                :error-messages="errors.installation_address"
                @update:model-value="clearError('installation_address')"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.service_area"
                label="Service Area *"
                :error-messages="errors.service_area"
                @update:model-value="clearError('service_area')"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.installation_date"
                label="Installation Date *"
                type="date"
                :error-messages="errors.installation_date"
                @update:model-value="clearError('installation_date')"
              />
            </v-col>
          </v-row>

          <v-alert v-if="store.error" type="error" class="mt-4" closable>
            {{ store.error }}
          </v-alert>

          <v-row class="mt-4">
            <v-col>
              <v-btn type="submit" color="primary" :loading="store.loading" class="mr-2">
                Save Changes
              </v-btn>
              <v-btn variant="outlined" :to="{ name: 'Customers' }">Cancel</v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCustomerStore } from '@/stores/customers';
import api from '@/services/api';

const route = useRoute();
const router = useRouter();
const store = useCustomerStore();

const loading = ref(true);
const formLoaded = ref(false);

const form = reactive({
  full_name: '',
  mobile_number: '',
  email: '',
  address: '',
  installation_address: '',
  service_area: '',
  plan_id: '',
  installation_date: '',
});

const errors = reactive<Record<string, string>>({});
const plans = ref<{ label: string; value: string }[]>([]);

async function loadPlans() {
  try {
    const { data } = await api.get('/plans', { params: { limit: '100' } });
    plans.value = (data.data || []).map((p: any) => ({
      label: `${p.name} - ${p.speed} (₱${(p.monthly_fee / 100).toFixed(2)}/mo)`,
      value: p.id,
    }));
  } catch {
    // Plans will be empty if fetch fails
  }
}

async function loadCustomer() {
  const id = route.params.id as string;
  await store.loadCustomer(id);
  if (store.currentCustomer) {
    form.full_name = store.currentCustomer.full_name;
    form.mobile_number = store.currentCustomer.mobile_number;
    form.email = store.currentCustomer.email || '';
    form.address = store.currentCustomer.address;
    form.installation_address = store.currentCustomer.installation_address;
    form.service_area = store.currentCustomer.service_area;
    form.plan_id = store.currentCustomer.plan_id;
    form.installation_date = store.currentCustomer.installation_date;
    formLoaded.value = true;
  }
  loading.value = false;
}

function validate(): boolean {
  Object.keys(errors).forEach((k) => delete errors[k]);
  let valid = true;

  if (!form.full_name.trim()) { errors.full_name = 'Full name is required'; valid = false; }
  if (!form.mobile_number.trim()) { errors.mobile_number = 'Mobile number is required'; valid = false; }
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { errors.email = 'Invalid email format'; valid = false; }
  if (!form.address.trim()) { errors.address = 'Address is required'; valid = false; }
  if (!form.installation_address.trim()) { errors.installation_address = 'Installation address is required'; valid = false; }
  if (!form.service_area.trim()) { errors.service_area = 'Service area is required'; valid = false; }
  if (!form.plan_id) { errors.plan_id = 'Internet plan is required'; valid = false; }
  if (!form.installation_date) { errors.installation_date = 'Installation date is required'; valid = false; }

  return valid;
}

function clearError(field: string) {
  delete errors[field];
}

async function onSubmit() {
  if (!validate()) return;

  const id = route.params.id as string;
  try {
    await store.editCustomer(id, {
      full_name: form.full_name.trim(),
      mobile_number: form.mobile_number.trim(),
      email: form.email.trim() || null,
      address: form.address.trim(),
      installation_address: form.installation_address.trim(),
      service_area: form.service_area.trim(),
      plan_id: form.plan_id,
      installation_date: form.installation_date,
    });
    router.push({ name: 'CustomerDetail', params: { id } });
  } catch {
    // Error is set in store
  }
}

onMounted(async () => {
  await loadPlans();
  await loadCustomer();
});
</script>
