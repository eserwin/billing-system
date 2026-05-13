<template>
  <v-container fluid>
    <v-row class="mb-4" align="center">
      <v-col cols="12" sm="auto" class="d-flex justify-end">
        <v-btn color="primary" prepend-icon="mdi-plus" :to="{ name: 'CustomerCreate' }" block class="d-sm-none">
          Add Customer
        </v-btn>
        <v-btn color="primary" prepend-icon="mdi-plus" :to="{ name: 'CustomerCreate' }" class="d-none d-sm-flex">
          Add Customer
        </v-btn>
      </v-col>
    </v-row>

    <v-card>
      <v-card-text>
        <v-row dense>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="search"
              label="Search customers"
              prepend-inner-icon="mdi-magnify"
              clearable
              hide-details
              @update:model-value="debouncedSearch"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="statusFilter"
              label="Status"
              :items="statusOptions"
              clearable
              hide-details
              @update:model-value="loadData"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="serviceAreaFilter"
              label="Service Area"
              clearable
              hide-details
              @update:model-value="debouncedSearch"
            />
          </v-col>
        </v-row>
      </v-card-text>

      <v-data-table-server
        :headers="headers"
        :items="store.customers"
        :items-length="store.meta.total"
        :loading="store.loading"
        :page="page"
        :items-per-page="itemsPerPage"
        @update:page="onPageChange"
        @update:items-per-page="onItemsPerPageChange"
        @update:sort-by="onSortChange"
      >
        <template #item.status="{ item }">
          <v-chip :color="statusColor(item.status)" size="small" label>
            {{ formatStatus(item.status) }}
          </v-chip>
        </template>

        <template #item.plan="{ item }">
          {{ item.plan?.name || '—' }}
        </template>

        <template #item.monthly_fee="{ item }">
          ₱{{ formatCurrency(item.plan?.monthly_fee) }}
        </template>

        <template #item.created_at="{ item }">
          {{ formatDate(item.created_at) }}
        </template>

        <template #item.actions="{ item }">
          <v-btn icon size="small" variant="text" :to="{ name: 'CustomerDetail', params: { id: item.id } }">
            <v-icon>mdi-eye</v-icon>
          </v-btn>
          <v-btn icon size="small" variant="text" :to="{ name: 'CustomerEdit', params: { id: item.id } }">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn icon size="small" variant="text" color="error" @click="confirmArchive(item)">
            <v-icon>mdi-archive</v-icon>
          </v-btn>
        </template>
      </v-data-table-server>
    </v-card>

    <v-dialog v-model="archiveDialog" max-width="400">
      <v-card>
        <v-card-title>Archive Customer</v-card-title>
        <v-card-text>
          Are you sure you want to archive <strong>{{ customerToArchive?.full_name }}</strong>?
          This action can be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="archiveDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="doArchive">Archive</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useCustomerStore } from '@/stores/customers';
import type { ICustomer } from '@/services/customerService';
import { format } from 'date-fns';

const store = useCustomerStore();

const search = ref('');
const statusFilter = ref<string | null>(null);
const serviceAreaFilter = ref('');
const page = ref(1);
const itemsPerPage = ref(20);
const sortBy = ref('created_at');
const sortOrder = ref<'ASC' | 'DESC'>('DESC');

const archiveDialog = ref(false);
const customerToArchive = ref<ICustomer | null>(null);

const statusOptions = [
  { title: 'Active', value: 'active' },
  { title: 'Due Soon', value: 'due_soon' },
  { title: 'Overdue', value: 'overdue' },
  { title: 'Disconnected', value: 'disconnected' },
  { title: 'Reconnected', value: 'reconnected' },
  { title: 'Suspended', value: 'suspended' },
];

const headers = [
  { title: 'Account #', key: 'account_number', sortable: true },
  { title: 'Name', key: 'full_name', sortable: true },
  { title: 'Mobile', key: 'mobile_number', sortable: false },
  { title: 'Service Area', key: 'service_area', sortable: true },
  { title: 'Plan', key: 'plan', sortable: false },
  { title: 'Monthly Fee', key: 'monthly_fee', sortable: false },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Created', key: 'created_at', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'center' as const },
];

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

function debouncedSearch() {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    page.value = 1;
    loadData();
  }, 400);
}

function loadData() {
  store.loadCustomers({
    page: page.value,
    limit: itemsPerPage.value,
    sort_by: sortBy.value,
    sort_order: sortOrder.value,
    search: search.value || undefined,
    status: statusFilter.value || undefined,
    service_area: serviceAreaFilter.value || undefined,
  });
}

function onPageChange(newPage: number) {
  page.value = newPage;
  loadData();
}

function onItemsPerPageChange(newLimit: number) {
  itemsPerPage.value = newLimit;
  page.value = 1;
  loadData();
}

function onSortChange(sortOptions: any[]) {
  if (sortOptions.length > 0) {
    sortBy.value = sortOptions[0].key;
    sortOrder.value = sortOptions[0].order === 'asc' ? 'ASC' : 'DESC';
  } else {
    sortBy.value = 'created_at';
    sortOrder.value = 'DESC';
  }
  loadData();
}

function confirmArchive(customer: ICustomer) {
  customerToArchive.value = customer;
  archiveDialog.value = true;
}

async function doArchive() {
  if (!customerToArchive.value) return;
  await store.removeCustomer(customerToArchive.value.id);
  archiveDialog.value = false;
  customerToArchive.value = null;
}

function statusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'success',
    due_soon: 'warning',
    overdue: 'error',
    disconnected: 'grey',
    reconnected: 'info',
    suspended: 'deep-purple',
  };
  return colors[status] || 'default';
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatCurrency(value?: number): string {
  if (value == null) return '0.00';
  return (value / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 });
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  return format(new Date(dateStr), 'MMM dd, yyyy');
}

onMounted(() => {
  loadData();
});
</script>
