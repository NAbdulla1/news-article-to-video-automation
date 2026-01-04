<script setup lang="ts">
import { NResult, NButton } from 'naive-ui';
import { useAuthStore } from '../stores/authStore';

const authStore = useAuthStore();

</script>

<template>
  <div class="forbidden-container">
    <n-result v-if="authStore.isApproved" status="403" title="403 Forbidden" description="User do not have permission to access this page.">
      <template #footer>
        <n-button @click="$router.push('/')">Go Home</n-button>
      </template>
    </n-result>
    <n-result v-else status="403" title="403 Forbidden" description="User is not approved. Please contact administrator.">
      <template #footer>
        <n-button @click="$router.push('/')">Go Home</n-button>
      </template>
    </n-result>
  </div>
</template>

<style scoped>
.forbidden-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 80vh;
}
</style>
