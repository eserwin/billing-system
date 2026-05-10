<template>
  <v-app-bar flat border="b">
    <v-app-bar-nav-icon @click="$emit('toggle-sidebar')" />

    <v-toolbar-title class="text-body-1 font-weight-medium">
      {{ pageTitle }}
    </v-toolbar-title>

    <v-spacer />

    <v-chip
      v-if="authStore.user"
      variant="tonal"
      color="primary"
      class="mr-2"
      size="small"
    >
      {{ authStore.user.role }}
    </v-chip>

    <v-menu>
      <template #activator="{ props }">
        <v-btn icon v-bind="props">
          <v-avatar color="primary" size="36">
            <span class="text-body-2 font-weight-medium text-white">
              {{ userInitials }}
            </span>
          </v-avatar>
        </v-btn>
      </template>
      <v-list density="compact" min-width="200">
        <v-list-item v-if="authStore.user">
          <v-list-item-title class="font-weight-medium">
            {{ authStore.user.name }}
          </v-list-item-title>
          <v-list-item-subtitle>{{ authStore.user.email }}</v-list-item-subtitle>
        </v-list-item>
        <v-divider class="my-1" />
        <v-list-item prepend-icon="mdi-logout" title="Sign Out" @click="handleLogout" />
      </v-list>
    </v-menu>
  </v-app-bar>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import { useAuthStore } from '@/stores/auth';

defineEmits<{
  'toggle-sidebar': [];
}>();

const route = useRoute();
const router = useRouter();
const { logout } = useAuth();
const authStore = useAuthStore();

const pageTitle = computed(() => {
  return (route.meta?.title as string) || route.name?.toString() || 'Dashboard';
});

const userInitials = computed(() => {
  if (!authStore.user?.name) return '?';
  return authStore.user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
});

function handleLogout() {
  logout();
  router.push({ name: 'Login' });
}
</script>
