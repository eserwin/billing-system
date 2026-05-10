import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  fetchPayments,
  recordPayment,
  type IPayment,
  type PaymentListParams,
  type RecordPaymentPayload,
} from '@/services/paymentService';
import type { PaginationMeta } from '@/services/customerService';

export const usePaymentStore = defineStore('payments', () => {
  const payments = ref<IPayment[]>([]);
  const meta = ref<PaginationMeta>({ total: 0, page: 1, limit: 20, total_pages: 0 });
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function loadPayments(params: PaymentListParams = {}) {
    loading.value = true;
    error.value = null;
    try {
      const response = await fetchPayments(params);
      payments.value = response.data;
      meta.value = response.meta;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to load payments';
    } finally {
      loading.value = false;
    }
  }

  async function addPayment(payload: RecordPaymentPayload) {
    loading.value = true;
    error.value = null;
    try {
      const response = await recordPayment(payload);
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to record payment';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    payments,
    meta,
    loading,
    error,
    loadPayments,
    addPayment,
  };
});
