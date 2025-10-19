<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSourcesStore } from '../stores/sources'
import { processLink } from '../services/backendService'

const url = ref('')
const selected = ref<string | null>(null)
const loading = ref(false)
const result = ref<null | import('../services/backendService').ProcessLinkResponse>(null)
const error = ref<string | null>(null)

const sourcesStore = useSourcesStore()
const sources = computed(() => sourcesStore.sources)

async function submit() {
  error.value = null
  result.value = null
  const link = url.value.trim()
  if (!link) return (error.value = 'Please enter a URL')
  if (!selected.value) return (error.value = 'Please select a source')

  loading.value = true
  try {
    const res = await processLink({ link, source: selected.value })
    result.value = res
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

function reset() {
  url.value = ''
  selected.value = null
  result.value = null
  error.value = null
}
</script>

<template>
  <div class="process-form">
    <el-input v-model="url" placeholder="https://example.com/article" clearable style="width: 100%" />

    <div style="margin-top:8px">
      <n-select v-model:value="selected" :options="sources.map(([k, v]) => ({ label: k, value: v }))"
        placeholder="Select source" style="width:100%" />
    </div>

    <div style="margin-top:12px; display:flex; gap:8px; align-items:center; flex-wrap:wrap">
      <el-button type="primary" :loading="loading" @click="submit">Process</el-button>
      <n-button secondary @click="reset">Reset</n-button>
      <n-tag v-if="error" type="error">{{ error }}</n-tag>
    </div>

    <div v-if="result" style="margin-top:12px">
      <n-card title="Result" size="small">
        <template #default>
          <div><strong>URL:</strong> {{ result.result.url }}</div>
          <div><strong>Source:</strong> {{ result.result.source }}</div>
          <div><strong>Status:</strong> {{ result.result.status }}</div>
          <div style="margin-top:8px"><strong>Headline:</strong> {{ result.result.data.headline }}</div>
          <div><strong>Author:</strong> {{ result.result.data.author }}</div>
          <div style="margin-top:8px"><strong>Content:</strong></div>
          <div style="white-space:pre-wrap">{{ result.result.data.content }}</div>
        </template>
      </n-card>
    </div>
  </div>
</template>

<style scoped>
.process-form {
  max-width: 640px
}
</style>
