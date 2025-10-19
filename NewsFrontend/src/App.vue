<script setup lang="ts">
import { ref } from 'vue'
import ProcessLinkForm from './components/ProcessLinkForm.vue'
import ScrappingToggle from './components/ScrappingToggle.vue'
import PendingUrlsTable from './components/PendingUrlsTable.vue'

const showProcessModal = ref(false)

function openProcessModal() {
  showProcessModal.value = true
}

function closeProcessModal() {
  showProcessModal.value = false
}
</script>

<template>
  <n-layout>
    <n-layout-header class="app-header">
      <div style="display:flex;align-items:center;gap:16px">
        <h1 class="app-title">News → Video</h1>
        <ScrappingToggle />
      </div>

      <div style="display:flex;gap:8px;align-items:center">
        <el-button type="primary" size="small" @click="openProcessModal">Add Article</el-button>
      </div>
    </n-layout-header>

    <n-layout-content style="padding:16px">
      <PendingUrlsTable />

      <n-modal style="max-width: 50%" v-model:show="showProcessModal" title="Process link" :mask-closable="false">
        <n-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; margin: 0;">
              <h3>Process Link</h3>
              <el-button circle size="small" @click="closeProcessModal">x</el-button>
            </div>
          </template>
          <template #default>
            <div class="card-body">
              <ProcessLinkForm />
            </div>
          </template>
        </n-card>
      </n-modal>
    </n-layout-content>
  </n-layout>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #2d8cf0;
}

.app-title {
  color: white;
  margin: 0;
  font-size: 18px;
}

.actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.card-body {
  min-height: 44px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
