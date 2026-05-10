import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  fetchPlans,
  createPlan,
  updatePlan,
  togglePlanStatus,
  type IInternetPlan,
  type PlanListParams,
  type CreatePlanPayload,
  type UpdatePlanPayload,
} from '@/services/planService';
import type { PaginationMeta } from '@/services/customerService';

export const usePlanStore = defineStore('plans', () => {
  const plans = ref<IInternetPlan[]>([]);
  const meta = ref<PaginationMeta>({ total: 0, page: 1, limit: 20, total_pages: 0 });
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function loadPlans(params: PlanListParams = {}) {
    loading.value = true;
    error.value = null;
    try {
      const response = await fetchPlans(params);
      plans.value = response.data;
      meta.value = response.meta;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to load plans';
    } finally {
      loading.value = false;
    }
  }

  async function addPlan(payload: CreatePlanPayload) {
    loading.value = true;
    error.value = null;
    try {
      const response = await createPlan(payload);
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to create plan';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function editPlan(id: string, payload: UpdatePlanPayload) {
    loading.value = true;
    error.value = null;
    try {
      const response = await updatePlan(id, payload);
      const idx = plans.value.findIndex((p) => p.id === id);
      if (idx !== -1) plans.value[idx] = response.data;
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to update plan';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function toggleStatus(id: string, is_active: boolean) {
    loading.value = true;
    error.value = null;
    try {
      const response = await togglePlanStatus(id, is_active);
      const idx = plans.value.findIndex((p) => p.id === id);
      if (idx !== -1) plans.value[idx] = response.data;
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to toggle plan status';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    plans,
    meta,
    loading,
    error,
    loadPlans,
    addPlan,
    editPlan,
    toggleStatus,
  };
});
