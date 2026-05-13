<template>
  <v-container fluid>
    <v-row class="mb-4" align="center">
      <v-col cols="12" sm="auto" class="d-flex justify-end">
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog" block class="d-sm-none">
          Add Plan
        </v-btn>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog" class="d-none d-sm-flex">
          Add Plan
        </v-btn>
      </v-col>
    </v-row>

    <v-card>
      <v-data-table-server
        :headers="headers"
        :items="store.plans"
        :items-length="store.meta.total"
        :loading="store.loading"
        :page="page"
        :items-per-page="itemsPerPage"
        @update:page="onPageChange"
        @update:items-per-page="onItemsPerPageChange"
        @update:sort-by="onSortChange"
      >
        <template #item.monthly_fee="{ item }">
          ₱{{ formatCurrency(item.monthly_fee) }}
        </template>

        <template #item.installation_fee="{ item }">
          ₱{{ formatCurrency(item.installation_fee) }}
        </template>

        <template #item.is_active="{ item }">
          <v-chip :color="item.is_active ? 'success' : 'grey'" size="small" label>
            {{ item.is_active ? 'Active' : 'Inactive' }}
          </v-chip>
        </template>

        <template #item.created_at="{ item }">
          {{ formatDate(item.created_at) }}
        </template>

        <template #item.actions="{ item }">
          <v-btn icon size="small" variant="text" @click="openEditDialog(item)">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn
            icon
            size="small"
            variant="text"
            :color="item.is_active ? 'warning' : 'success'"
            @click="confirmToggle(item)"
          >
            <v-icon>{{ item.is_active ? 'mdi-pause-circle' : 'mdi-play-circle' }}</v-icon>
          </v-btn>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="formDialog" max-width="500" persistent>
      <plan-form
        :plan="editingPlan"
        :loading="store.loading"
        @submit="handleFormSubmit"
        @cancel="formDialog = false"
      />
    </v-dialog>

    <!-- Toggle Status Confirmation -->
    <v-dialog v-model="toggleDialog" max-width="400">
      <v-card>
        <v-card-title>{{ planToToggle?.is_active ? 'Deactivate' : 'Activate' }} Plan</v-card-title>
        <v-card-text>
          Are you sure you want to {{ planToToggle?.is_active ? 'deactivate' : 'activate' }}
          <strong>{{ planToToggle?.name }}</strong>?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="toggleDialog = false">Cancel</v-btn>
          <v-btn :color="planToToggle?.is_active ? 'warning' : 'success'" @click="doToggle">
            {{ planToToggle?.is_active ? 'Deactivate' : 'Activate' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { usePlanStore } from '@/stores/plans';
import type { IInternetPlan, CreatePlanPayload, UpdatePlanPayload } from '@/services/planService';
import PlanForm from './PlanForm.vue';
import { format } from 'date-fns';

const store = usePlanStore();

const page = ref(1);
const itemsPerPage = ref(20);
const sortBy = ref('created_at');
const sortOrder = ref<'ASC' | 'DESC'>('DESC');

const formDialog = ref(false);
const editingPlan = ref<IInternetPlan | null>(null);

const toggleDialog = ref(false);
const planToToggle = ref<IInternetPlan | null>(null);

const headers = [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Speed', key: 'speed', sortable: true },
  { title: 'Monthly Fee', key: 'monthly_fee', sortable: true },
  { title: 'Installation Fee', key: 'installation_fee', sortable: false },
  { title: 'Status', key: 'is_active', sortable: true },
  { title: 'Created', key: 'created_at', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'center' as const },
];

function loadData() {
  store.loadPlans({
    page: page.value,
    limit: itemsPerPage.value,
    sort_by: sortBy.value,
    sort_order: sortOrder.value,
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

function openCreateDialog() {
  editingPlan.value = null;
  formDialog.value = true;
}

function openEditDialog(plan: IInternetPlan) {
  editingPlan.value = plan;
  formDialog.value = true;
}

async function handleFormSubmit(payload: CreatePlanPayload | UpdatePlanPayload) {
  if (editingPlan.value) {
    await store.editPlan(editingPlan.value.id, payload as UpdatePlanPayload);
  } else {
    await store.addPlan(payload as CreatePlanPayload);
  }
  formDialog.value = false;
  loadData();
}

function confirmToggle(plan: IInternetPlan) {
  planToToggle.value = plan;
  toggleDialog.value = true;
}

async function doToggle() {
  if (!planToToggle.value) return;
  await store.toggleStatus(planToToggle.value.id, !planToToggle.value.is_active);
  toggleDialog.value = false;
  planToToggle.value = null;
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
