<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { getPendingUrls, deletePendingUrl, processPendingUrl } from '../services/backendService'
import type { PendingUrl } from '../services/backendService'
import { NButton } from 'naive-ui'

const page = ref(1)
const limit = ref(10)
const total = ref(0)
const items = ref<PendingUrl[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const filterStatus = ref('')
const filterSource = ref('')

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await getPendingUrls({ page: page.value, limit: limit.value, status: filterStatus.value || undefined, source: filterSource.value || undefined })
    items.value = res.items
    total.value = res.total
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

async function onDelete(id: string) {
  loading.value = true
  try {
    await deletePendingUrl(id)
    await load()
    const index = items.value.findIndex(i => i._id === id)
    if (index !== -1) {
      items.value.splice(index, 1)
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

async function onProcess(id: string) {
  loading.value = true
  try {
    await processPendingUrl(id)
    await load()
    const item = items.value.find(i => i._id === id)
    if (item) {
      item.status = 'completed'
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

onMounted(load)

const columns = computed(() => [
  { title: 'Headline', key: 'data.headline', default: () => 'N/A' },
  { title: 'Status', key: 'status' },
  { title: 'Source', key: 'source' },
  { title: 'URL', key: 'url' },
  {
    title: 'Actions',
    key: 'actions',
    render(row: PendingUrl) {
      const texts = ['Process', 'Delete']
      return [onProcess, onDelete].map((callback, index) => {
        return h(
          NButton,
          {
            style: { marginLeft: index === 0 ? '0' : '8px' },
            strong: true,
            tertiary: true,
            size: 'small',
            onClick: () => { callback(row._id) }
          },
          { default: () => texts[index] }
        )
      });
    }
  },
])

function onPageUpdate(p: number) {
  page.value = p
  load()
}
</script>

<template>
  <div>
    <div style="display:flex; justify-content:end; gap:8px;align-items:center;margin-bottom:8px">
      <el-input v-model="filterSource" placeholder="Filter source" size="small" style="width:200px" />
      <el-input v-model="filterStatus" placeholder="Filter status" size="small" style="width:160px" />
      <el-button size="small" @click="() => { page = 1; load() }">Apply</el-button>
      <el-button size="small"
        @click="() => { filterSource = ''; filterStatus = ''; page = 1; load() }">Clear</el-button>
    </div>

    <n-config-provider>
      <n-data-table :columns="columns" :data="items" :loading="loading" style="width:100%">
        <template #empty>
          <div v-if="error" style="color:var(--n-error-6)">{{ error }}</div>
          <div v-else>No URLs found.</div>
        </template>
      </n-data-table>

      <div style="margin-top:12px;display:flex;align-items:center;gap:8px;justify-content:flex-end">
        <n-pagination :page="page" :page-size="limit" :page-count="Math.max(1, Math.ceil(total / limit))"
          @update:page="onPageUpdate" />
      </div>
    </n-config-provider>

  </div>
</template>

<style scoped></style>
