<template>
  <v-card>
    <v-card-title>{{ isEditing ? 'Edit Plan' : 'Create Plan' }}</v-card-title>
    <v-card-text>
      <v-form ref="formRef" @submit.prevent="onSubmit">
        <v-text-field
          v-model="form.name"
          label="Plan Name"
          :rules="[rules.required]"
          class="mb-2"
        />
        <v-text-field
          v-model="form.speed"
          label="Speed (e.g., 50 Mbps)"
          :rules="[rules.required]"
          class="mb-2"
        />
        <v-text-field
          v-model="monthlyFeeDisplay"
          label="Monthly Fee (₱)"
          type="number"
          min="0"
          step="0.01"
          :rules="[rules.required, rules.positiveNumber]"
          prefix="₱"
          class="mb-2"
        />
        <v-text-field
          v-model="installationFeeDisplay"
          label="Installation Fee (₱)"
          type="number"
          min="0"
          step="0.01"
          :rules="[rules.positiveNumber]"
          prefix="₱"
          class="mb-2"
        />
      </v-form>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn variant="text" @click="$emit('cancel')">Cancel</v-btn>
      <v-btn color="primary" :loading="loading" @click="onSubmit">
        {{ isEditing ? 'Update' : 'Create' }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { IInternetPlan } from '@/services/planService';

const props = defineProps<{
  plan: IInternetPlan | null;
  loading: boolean;
}>();

const emit = defineEmits<{
  submit: [payload: { name: string; speed: string; monthly_fee: number; installation_fee: number }];
  cancel: [];
}>();

const isEditing = computed(() => !!props.plan);

const formRef = ref();
const form = ref({
  name: '',
  speed: '',
});
const monthlyFeeDisplay = ref('');
const installationFeeDisplay = ref('');

const rules = {
  required: (v: string) => !!v || 'This field is required',
  positiveNumber: (v: string) => {
    if (!v && v !== '0') return true;
    const num = parseFloat(v);
    return (!isNaN(num) && num >= 0) || 'Must be a positive number';
  },
};

watch(
  () => props.plan,
  (plan) => {
    if (plan) {
      form.value.name = plan.name;
      form.value.speed = plan.speed;
      monthlyFeeDisplay.value = (plan.monthly_fee / 100).toFixed(2);
      installationFeeDisplay.value = (plan.installation_fee / 100).toFixed(2);
    } else {
      form.value.name = '';
      form.value.speed = '';
      monthlyFeeDisplay.value = '';
      installationFeeDisplay.value = '';
    }
  },
  { immediate: true }
);

async function onSubmit() {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  emit('submit', {
    name: form.value.name,
    speed: form.value.speed,
    monthly_fee: Math.round(parseFloat(monthlyFeeDisplay.value || '0') * 100),
    installation_fee: Math.round(parseFloat(installationFeeDisplay.value || '0') * 100),
  });
}
</script>
