import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  fetchCustomers,
  fetchCustomer,
  createCustomer,
  updateCustomer,
  archiveCustomer,
  restoreCustomer,
  type ICustomer,
  type CustomerListParams,
  type CreateCustomerPayload,
  type UpdateCustomerPayload,
  type PaginationMeta,
} from '@/services/customerService';

export const useCustomerStore = defineStore('customers', () => {
  const customers = ref<ICustomer[]>([]);
  const currentCustomer = ref<ICustomer | null>(null);
  const meta = ref<PaginationMeta>({ total: 0, page: 1, limit: 20, total_pages: 0 });
  const loading = ref(false);
  const error = ref<string | null>(null);

  const totalCustomers = computed(() => meta.value.total);

  async function loadCustomers(params: CustomerListParams = {}) {
    loading.value = true;
    error.value = null;
    try {
      const response = await fetchCustomers(params);
      customers.value = response.data;
      meta.value = response.meta as PaginationMeta;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to load customers';
    } finally {
      loading.value = false;
    }
  }

  async function loadCustomer(id: string) {
    loading.value = true;
    error.value = null;
    try {
      const response = await fetchCustomer(id);
      currentCustomer.value = response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to load customer';
    } finally {
      loading.value = false;
    }
  }

  async function addCustomer(payload: CreateCustomerPayload) {
    loading.value = true;
    error.value = null;
    try {
      const response = await createCustomer(payload);
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to create customer';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function editCustomer(id: string, payload: UpdateCustomerPayload) {
    loading.value = true;
    error.value = null;
    try {
      const response = await updateCustomer(id, payload);
      currentCustomer.value = response.data;
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to update customer';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function removeCustomer(id: string) {
    loading.value = true;
    error.value = null;
    try {
      await archiveCustomer(id);
      customers.value = customers.value.filter((c) => c.id !== id);
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to archive customer';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function unarchiveCustomer(id: string) {
    loading.value = true;
    error.value = null;
    try {
      const response = await restoreCustomer(id);
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to restore customer';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    customers,
    currentCustomer,
    meta,
    loading,
    error,
    totalCustomers,
    loadCustomers,
    loadCustomer,
    addCustomer,
    editCustomer,
    removeCustomer,
    unarchiveCustomer,
  };
});
