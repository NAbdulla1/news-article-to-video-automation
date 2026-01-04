<template>
  <div class="pending-users-container">
    <n-card title="Pending Users">
      <n-data-table
        :columns="columns"
        :data="users"
        :loading="loading"
        :bordered="false"
      />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue';
import { NButton, useMessage, NSpace } from 'naive-ui';
import { authService } from '../services/authService';

const users = ref([]);
const loading = ref(false);
const message = useMessage();

const columns = [
  { title: 'ID', key: 'id' },
  { title: 'Username', key: 'username' },
  { title: 'Email', key: 'email' },
  { title: 'First Name', key: 'firstName' },
  { title: 'Last Name', key: 'lastName' },
  {
    title: 'Action',
    key: 'actions',
    render(row: any) {
      return h(
        NSpace,
        {},
        {
          default: () => [
            h(
              NButton,
              {
                type: 'primary',
                size: 'small',
                onClick: () => approveUser(row.id, 'staff')
              },
              { default: () => 'Approve Staff' }
            ),
            h(
              NButton,
              {
                type: 'warning',
                size: 'small',
                onClick: () => approveUser(row.id, 'admin')
              },
              { default: () => 'Approve Admin' }
            )
          ]
        }
      );
    }
  }
];

const fetchPendingUsers = async () => {
  loading.value = true;
  try {
    const res = await authService.getPendingUsers();
    users.value = res.users;
  } catch (error: any) {
    message.error('Failed to fetch pending users');
  } finally {
    loading.value = false;
  }
};

const approveUser = async (id: string, role: string) => {
    try {
        await authService.approveUser(id, role);
        message.success(`User approved as ${role}`);
        fetchPendingUsers();
    } catch (e: any) {
        message.error('Failed to approve user');
    }
};

onMounted(() => {
    fetchPendingUsers();
});
</script>

<style scoped>
.pending-users-container {
    padding: 24px;
}
</style>
