<script setup lang="ts">
import { onMounted } from 'vue'
import { useScrappingStore } from '../stores/scrapping'

const store = useScrappingStore()

onMounted(() => {
  // ensure the store has current value from backend
  store.load().catch(() => {
    if (import.meta.env.DEV) console.warn('Failed to load scrapping state')
  })
})

async function toggle(value: boolean) {
  try {
    await store.setEnabled(value)
  } catch {
    // setEnabled will populate store.error
  }
}
</script>

<template>
  <div class="scrapping-toggle">
    <label style="display:flex;align-items:center;gap:12px">
      <span>Enable Cron Schedule Scrapping</span>
      <n-switch :loading="store.loading" v-model:checked="store.enabled" @update:value="toggle" />
    </label>

    <div style="margin-top:8px;display:flex;gap:8px;align-items:center">
      <div v-if="store.error" style="color:var(--n-error-6)">{{ store.error }}</div>
    </div>
  </div>
</template>

<style scoped>
.scrapping-toggle {
  display: flex;
  flex-direction: column;
}
</style>
