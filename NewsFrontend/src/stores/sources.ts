import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getNewsSources } from '../services/backendService'

export const useSourcesStore = defineStore('sources', () => {
  // store sources as an array of [key, value]
  const sources = ref<Array<[string, string]>>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadSources() {
    loading.value = true
    error.value = null
    try {
      const res = await getNewsSources()
      sources.value = Object.entries(res)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      loading.value = false
    }
  }

  return { sources, loading, error, loadSources }
})
