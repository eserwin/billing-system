import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  fetchInvoices,
  fetchInvoice,
  generateBilling,
  type IInvoice,
  type InvoiceListParams,
} from '@/services/billingService';
import type { PaginationMeta } from '@/services/customerService';

export const useBillingStore = defineStore('billing', () => {
  const invoices = ref<IInvoice[]>([]);
  const currentInvoice = ref<IInvoice | null>(null);
  const meta = ref<PaginationMeta>({ total: 0, page: 1, limit: 20, total_pages: 0 });
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function loadInvoices(params: InvoiceListParams = {}) {
    loading.value = true;
    error.value = null;
    try {
      const response = await fetchInvoices(params);
      invoices.value = response.data;
      meta.value = response.meta;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to load invoices';
    } finally {
      loading.value = false;
    }
  }

  async function loadInvoice(id: string) {
    loading.value = true;
    error.value = null;
    try {
      const response = await fetchInvoice(id);
      currentInvoice.value = response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to load invoice';
    } finally {
      loading.value = false;
    }
  }

  async function generate() {
    loading.value = true;
    error.value = null;
    try {
      const response = await generateBilling();
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to generate billing';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    invoices,
    currentInvoice,
    meta,
    loading,
    error,
    loadInvoices,
    loadInvoice,
    generate,
  };
});
