<template>
  <v-navigation-drawer
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :rail="rail"
    permanent
    width="260"
    color="grey-darken-4"
    theme="dark"
  >
    <v-list-item
      :prepend-icon="rail ? undefined : undefined"
      class="pa-4"
    >
      <template v-if="!rail">
        <v-list-item-title class="text-h6 font-weight-bold">
          ISP Billing
        </v-list-item-title>
        <v-list-item-subtitle>Management System</v-list-item-subtitle>
      </template>
      <template v-else>
        <v-list-item-title class="text-center font-weight-bold">ISP</v-list-item-title>
      </template>
    </v-list-item>

    <v-divider />

    <v-list density="compact" nav>
      <v-list-item
        v-for="item in visibleItems"
        :key="item.title"
        :prepend-icon="item.icon"
        :title="item.title"
        :to="item.to"
        :value="item.title"
        rounded="xl"
      />
    </v-list>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

defineProps<{
  modelValue: boolean;
  rail: boolean;
}>();

defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const authStore = useAuthStore();

interface NavItem {
  title: string;
  icon: string;
  to: string;
  roles: string[];
}

const navItems: NavItem[] = [
  { title: 'Dashboard', icon: 'mdi-view-dashboard', to: '/', roles: ['SuperAdmin', 'Admin'] },
  { title: 'Customers', icon: 'mdi-account-group', to: '/customers', roles: ['SuperAdmin', 'Admin'] },
  { title: 'Plans', icon: 'mdi-wifi', to: '/plans', roles: ['SuperAdmin', 'Admin'] },
  { title: 'Billing', icon: 'mdi-receipt-text', to: '/billing', roles: ['SuperAdmin', 'Admin'] },
  { title: 'Payments', icon: 'mdi-cash-multiple', to: '/payments', roles: ['SuperAdmin', 'Admin', 'Cashier'] },
  { title: 'Reports', icon: 'mdi-chart-bar', to: '/reports', roles: ['SuperAdmin', 'Admin'] },
  { title: 'MikroTik', icon: 'mdi-router-wireless', to: '/mikrotik', roles: ['SuperAdmin', 'Admin'] },
  { title: 'Notifications', icon: 'mdi-bell', to: '/notifications', roles: ['SuperAdmin', 'Admin'] },
  { title: 'Users', icon: 'mdi-account-cog', to: '/users', roles: ['SuperAdmin'] },
  { title: 'Settings', icon: 'mdi-cog', to: '/settings', roles: ['SuperAdmin'] },
];

const visibleItems = computed(() => {
  const role = authStore.userRole || 'SuperAdmin';
  return navItems.filter((item) => item.roles.includes(role));
});
</script>
