<template>
  <v-container fluid>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4">User Management</h1>
      <v-spacer />
      <v-btn color="primary" @click="showCreateDialog = true">
        <v-icon start>mdi-plus</v-icon>
        Add User
      </v-btn>
    </div>

    <!-- Users Table -->
    <v-card>
      <v-data-table
        :headers="headers"
        :items="users"
        :loading="loading"
        :items-per-page="20"
        density="compact"
      >
        <template #item.role="{ item }">
          <v-chip
            :color="roleColor(item.role)"
            size="small"
            variant="tonal"
          >
            {{ item.role }}
          </v-chip>
        </template>
        <template #item.created_at="{ item }">
          {{ formatDate(item.created_at) }}
        </template>
        <template #item.actions="{ item }">
          <v-btn size="small" variant="text" icon @click="openEditDialog(item)">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- Create User Dialog -->
    <v-dialog v-model="showCreateDialog" max-width="500">
      <v-card>
        <v-card-title>Create User</v-card-title>
        <v-card-text>
          <v-form ref="createForm" @submit.prevent="createUser">
            <v-text-field
              v-model="newUser.email"
              label="Email"
              type="email"
              :rules="[rules.required, rules.email]"
              variant="outlined"
              density="compact"
              class="mb-3"
            />
            <v-text-field
              v-model="newUser.full_name"
              label="Full Name"
              :rules="[rules.required]"
              variant="outlined"
              density="compact"
              class="mb-3"
            />
            <v-select
              v-model="newUser.role"
              :items="roleOptions"
              label="Role"
              :rules="[rules.required]"
              variant="outlined"
              density="compact"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showCreateDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="createUser" :loading="saving">Create</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit User Dialog -->
    <v-dialog v-model="showEditDialog" max-width="500">
      <v-card>
        <v-card-title>Edit User</v-card-title>
        <v-card-text>
          <v-form ref="editForm" @submit.prevent="updateUser">
            <v-text-field
              :model-value="editUser.email"
              label="Email"
              variant="outlined"
              density="compact"
              class="mb-3"
              disabled
            />
            <v-text-field
              v-model="editUser.full_name"
              label="Full Name"
              :rules="[rules.required]"
              variant="outlined"
              density="compact"
              class="mb-3"
            />
            <v-select
              v-model="editUser.role"
              :items="roleOptions"
              label="Role"
              :rules="[rules.required]"
              variant="outlined"
              density="compact"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showEditDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="updateUser" :loading="saving">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="showSnackbar" :color="snackbarColor" timeout="4000">
      {{ snackbarMessage }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/services/api';

interface IUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  cognito_sub: string;
  created_at: string;
  updated_at: string;
}

const users = ref<IUser[]>([]);
const loading = ref(false);
const saving = ref(false);
const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const showSnackbar = ref(false);
const snackbarMessage = ref('');
const snackbarColor = ref('success');

const newUser = ref({ email: '', full_name: '', role: '' });
const editUser = ref({ id: '', email: '', full_name: '', role: '' });

const roleOptions = ['SuperAdmin', 'Admin', 'Cashier'];

const headers = [
  { title: 'Name', key: 'full_name' },
  { title: 'Email', key: 'email' },
  { title: 'Role', key: 'role' },
  { title: 'Created', key: 'created_at' },
  { title: '', key: 'actions', sortable: false },
];

const rules = {
  required: (v: string) => !!v || 'Required',
  email: (v: string) => /.+@.+\..+/.test(v) || 'Invalid email',
};

function roleColor(role: string): string {
  switch (role) {
    case 'SuperAdmin': return 'error';
    case 'Admin': return 'primary';
    case 'Cashier': return 'success';
    default: return 'grey';
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

function openEditDialog(user: IUser) {
  editUser.value = { id: user.id, email: user.email, full_name: user.full_name, role: user.role };
  showEditDialog.value = true;
}

function showMessage(message: string, color = 'success') {
  snackbarMessage.value = message;
  snackbarColor.value = color;
  showSnackbar.value = true;
}

async function loadUsers() {
  loading.value = true;
  try {
    const { data } = await api.get('/users');
    users.value = data.data;
  } catch (err: any) {
    showMessage(err.response?.data?.message || 'Failed to load users', 'error');
  } finally {
    loading.value = false;
  }
}

async function createUser() {
  if (!newUser.value.email || !newUser.value.full_name || !newUser.value.role) return;
  saving.value = true;
  try {
    await api.post('/users', newUser.value);
    showCreateDialog.value = false;
    newUser.value = { email: '', full_name: '', role: '' };
    showMessage('User created successfully');
    await loadUsers();
  } catch (err: any) {
    showMessage(err.response?.data?.message || 'Failed to create user', 'error');
  } finally {
    saving.value = false;
  }
}

async function updateUser() {
  if (!editUser.value.full_name || !editUser.value.role) return;
  saving.value = true;
  try {
    await api.put(`/users/${editUser.value.id}`, {
      full_name: editUser.value.full_name,
      role: editUser.value.role,
    });
    showEditDialog.value = false;
    showMessage('User updated successfully');
    await loadUsers();
  } catch (err: any) {
    showMessage(err.response?.data?.message || 'Failed to update user', 'error');
  } finally {
    saving.value = false;
  }
}

onMounted(loadUsers);
</script>
