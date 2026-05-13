<template>
  <v-container fluid>
    <v-row class="mb-4">
      <v-col>
        <v-btn variant="text" prepend-icon="mdi-arrow-left" :to="{ name: 'Payments' }">
          Back to Payments
        </v-btn>
      </v-col>
    </v-row>

    <v-card max-width="600">
      <v-card-text>
        <v-form ref="formRef" @submit.prevent="onSubmit">
          <v-autocomplete
            v-model="form.customer_id"
            label="Customer"
            :items="customers"
            item-title="label"
            item-value="id"
            :loading="customersLoading"
            :rules="[rules.required]"
            class="mb-2"
            @update:search="searchCustomers"
          />

          <v-select
            v-model="form.invoice_id"
            label="Invoice"
            :items="invoiceOptions"
            item-title="label"
            item-value="id"
            :rules="[rules.required]"
            :disabled="!form.customer_id"
            :loading="invoicesLoading"
            class="mb-2"
          />

          <v-text-field
            v-model="amountDisplay"
            label="Amount (₱)"
            type="number"
            min="0"
            step="0.01"
            prefix="₱"
            :rules="[rules.required, rules.positiveNumber]"
            class="mb-2"
          />

          <v-select
            v-model="form.method"
            label="Payment Method"
            :items="methodOptions"
            :rules="[rules.required]"
            class="mb-2"
          />

          <v-text-field
            v-model="form.reference_number"
            label="Reference Number"
            class="mb-2"
          />

          <v-text-field
            v-model="form.payment_date"
            label="Payment Date"
            type="date"
            :rules="[rules.required]"
            class="mb-2"
          />

          <v-textarea
            v-model="form.notes"
            label="Notes"
            rows="3"
            class="mb-2"
          />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :to="{ name: 'Payments' }">Cancel</v-btn>
        <v-btn color="primary" :loading="store.loading" @click="onSubmit">
          Record Payment
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { usePaymentStore } from '@/stores/payments';
import { fetchCustomers } from '@/services/customerService';
import { fetchInvoices } from '@/services/billingService';
import { format } from 'date-fns';

const router = useRouter();
const store = usePaymentStore();

const formRef = ref();
const amountDisplay = ref('');
const customersLoading = ref(false);
const invoicesLoading = ref(false);

const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

const form = ref({
  customer_id: '',
  invoice_id: '',
  method: '',
  reference_number: '',
  payment_date: format(new Date(), 'yyyy-MM-dd'),
  notes: '',
});

const customers = ref<{ id: string; label: string }[]>([]);
const invoiceOptions = ref<{ id: string; label: string }[]>([]);

const methodOptions = [
  { title: 'Cash', value: 'cash' },
  { title: 'GCash', value: 'gcash' },
  { title: 'Maya', value: 'maya' },
  { title: 'Bank Transfer', value: 'bank_transfer' },
];

const rules = {
  required: (v: string) => !!v || 'This field is required',
  positiveNumber: (v: string) => {
    if (!v) return true;
    const num = parseFloat(v);
    return (!isNaN(num) && num > 0) || 'Must be a positive number';
  },
};

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

function searchCustomers(query: string) {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    if (!query || query.length < 2) return;
    customersLoading.value = true;
    try {
      const response = await fetchCustomers({ search: query, limit: 20 });
      customers.value = response.data.map((c) => ({
        id: c.id,
        label: `${c.account_number} - ${c.full_name}`,
      }));
    } catch {
      // silently fail
    } finally {
      customersLoading.value = false;
    }
  }, 400);
}

watch(
  () => form.value.customer_id,
  async (customerId) => {
    form.value.invoice_id = '';
    invoiceOptions.value = [];
    if (!customerId) return;

    invoicesLoading.value = true;
    try {
      const response = await fetchInvoices({ customer_id: customerId, limit: 50 });
      invoiceOptions.value = response.data
        .filter((inv) => inv.status !== 'paid')
        .map((inv) => ({
          id: inv.id,
          label: `${formatPeriod(inv.period_year, inv.period_month)} — ₱${formatCurrency(inv.amount - inv.paid_amount)} remaining (${inv.status})`,
        }));
    } catch {
      // silently fail
    } finally {
      invoicesLoading.value = false;
    }
  }
);

async function onSubmit() {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  try {
    await store.addPayment({
      customer_id: form.value.customer_id,
      invoice_id: form.value.invoice_id,
      amount: Math.round(parseFloat(amountDisplay.value) * 100),
      method: form.value.method,
      reference_number: form.value.reference_number || undefined,
      payment_date: form.value.payment_date,
      notes: form.value.notes || undefined,
    });
    snackbarColor.value = 'success';
    snackbarText.value = 'Payment recorded successfully.';
    snackbar.value = true;
    setTimeout(() => router.push({ name: 'Payments' }), 1000);
  } catch {
    snackbarColor.value = 'error';
    snackbarText.value = store.error || 'Failed to record payment.';
    snackbar.value = true;
  }
}

function formatCurrency(value?: number): string {
  if (value == null) return '0.00';
  return (value / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 });
}

function formatPeriod(year: number, month: number): string {
  const date = new Date(year, month - 1);
  return format(date, 'MMM yyyy');
}
</script>
