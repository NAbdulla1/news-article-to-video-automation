<script setup lang="ts">
import { ref } from 'vue'
import ProcessLinkForm from './components/ProcessLinkForm.vue'
import ScrappingToggle from './components/ScrappingToggle.vue'

const title = ref('')
const items = ref<string[]>([])

function add() {
  const t = title.value.trim()
  if (!t) return
  items.value.unshift(t)
  title.value = ''
}

function remove(i: number) {
  items.value.splice(i, 1)
}
</script>

<template>
  <n-layout>
    <n-layout-header class="app-header">
      <div style="display:flex;align-items:center;gap:16px">
        <h1 class="app-title">News → Video</h1>
        <ScrappingToggle />
      </div>

      <div class="actions">
        <el-input v-model="title" placeholder="Article title" size="small" style="width:260px" />
        <el-button type="primary" size="small" @click="add">Add</el-button>
      </div>
    </n-layout-header>

    <n-layout-content style="padding:16px">
      <ProcessLinkForm />
      <div class="grid">
        <n-card v-for="(t, i) in items" :key="i" size="small" title="Article">
          <template #default>
            <div class="card-body">{{ t }}</div>
          </template>
          <template #footer>
            <div class="card-footer">
              <n-button size="small" @click="() => { }">Preview</n-button>
              <el-button type="danger" size="small" @click="remove(i)">Remove</el-button>
            </div>
          </template>
        </n-card>
      </div>

      <p v-if="items.length === 0" style="margin-top:24px">No articles yet. Add one above.</p>
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
