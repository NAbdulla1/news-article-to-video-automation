import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getScrappingEnabled, setScrappingEnabled } from '../services/backendService'

export const useScrappingStore = defineStore('scrapping', () => {
  const enabled = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      const res = await getScrappingEnabled()
      enabled.value = !!res.scrappingEnabled
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      loading.value = false
    }
  }

  async function setEnabled(v: boolean) {
    loading.value = true
    error.value = null
    try {
      const res = await setScrappingEnabled(v)
      enabled.value = !!res.scrappingEnabled
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return { enabled, loading, error, load, setEnabled }
})
