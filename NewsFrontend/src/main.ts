import { createApp } from 'vue'
import { createPinia } from 'pinia'
import naive from 'naive-ui'
import 'element-plus/dist/index.css'
import ElementPlus from 'element-plus'

import App from './App.vue'
import router from './router'
import { getBackendUrl } from './config'
import { useSourcesStore } from './stores/sources'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(naive)
app.use(ElementPlus)

// provide backend url to the app (use `inject('BACKEND_URL')` or `useBackend()` in components)
const backend = getBackendUrl()
app.provide('BACKEND_URL', backend)

if (import.meta.env.DEV) console.log('[config] BACKEND_URL =', backend)

// load news sources into Pinia
try {
  const store = useSourcesStore()
  // store.loadSources may call fetch; call it but don't block mount
  store.loadSources().catch((e) => console.warn('Failed to load sources', e))
} catch (e) {
  if (import.meta.env.DEV) console.debug('sources store load skipped:', e)
}

// Initialize Auth before mounting
import { useAuthStore } from './stores/authStore'
const authStore = useAuthStore()

authStore.initAuth().then(() => {
  app.mount('#app')
}).catch((err) => {
  console.error("Failed to initialize auth:", err)
  // Mount anyway to show forbidden/error state if needed, or just crash?
  // Better to mount so we can at least show something, or maybe show a global error.
  app.mount('#app')
})
