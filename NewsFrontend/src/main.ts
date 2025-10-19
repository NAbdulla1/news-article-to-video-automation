import { createApp } from 'vue'
import { createPinia } from 'pinia'
import naive from 'naive-ui'
import 'element-plus/dist/index.css'
import ElementPlus from 'element-plus'

import App from './App.vue'
import router from './router'
import { getBackendUrl } from './config'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(naive)
app.use(ElementPlus)

// provide backend url to the app (use `inject('BACKEND_URL')` or `useBackend()` in components)
const backend = getBackendUrl()
app.provide('BACKEND_URL', backend)

if (import.meta.env.DEV) console.log('[config] BACKEND_URL =', backend)

app.mount('#app')
