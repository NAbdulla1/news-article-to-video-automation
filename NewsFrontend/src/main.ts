import { createApp } from 'vue'
import { createPinia } from 'pinia'
import naive from 'naive-ui'
import 'element-plus/dist/index.css'
import ElementPlus from 'element-plus'

import App from './App.vue'
import { getBackendUrl } from './config'

const app = createApp(App)

app.use(createPinia())
app.use(naive)
app.use(ElementPlus)

// provide backend url to the app (use `inject('BACKEND_URL')` or `useBackend()` in components)
const backend = getBackendUrl()
app.provide('BACKEND_URL', backend)

if (import.meta.env.DEV) console.log('[config] BACKEND_URL =', backend)

// Initialize Auth before mounting
import { useAuthStore } from './stores/authStore'
const authStore = useAuthStore()

authStore.initAuth().then(() => {
  // Mount app regardless of auth status - Router guards will handle protection
  import('./router').then(({ default: router }) => {
    app.use(router)
    app.mount('#app')
  })
}).catch((err) => {
  console.error("Failed to initialize auth:", err)
  // Still mount to show error page or public routes if possible, or just fail gracefully
  alert("Auth initialization failed - Network or Config Error");
})
