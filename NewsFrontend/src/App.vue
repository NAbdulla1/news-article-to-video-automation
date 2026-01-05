<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ProcessLinkForm from './components/ProcessLinkForm.vue'
import ScrappingToggle from './components/ScrappingToggle.vue'
import PendingUrlsTable from './components/PendingUrlsTable.vue'
import { useAuthStore } from './stores/authStore'
import { useRouter } from 'vue-router'
import { useSourcesStore } from './stores/sources'

const showProcessModal = ref(false)
const authStore = useAuthStore()
const router = useRouter()

function openProcessModal() {
  showProcessModal.value = true
}

function closeProcessModal() {
  showProcessModal.value = false
}

// load news sources into Pinia
try {
  const store = useSourcesStore()
  // store.loadSources may call fetch; call it but don't block mount
  store.loadSources().catch((e) => console.warn('Failed to load sources', e))
} catch (e) {
  if (import.meta.env.DEV) console.debug('sources store load skipped:', e)
}

</script>

<template>
  <n-config-provider>
    <n-dialog-provider>
      <n-notification-provider>
        <n-message-provider>
          <n-layout>
            <n-layout-header class="app-header">
              <div style="display:flex;align-items:center;gap:16px">
                <h1 class="app-title" @click="router.push('/')" style="cursor: pointer;">News → Video</h1>
                <ScrappingToggle v-if="authStore.hasPermission('SCRAPPING.STATUS.VIEW')" />
              </div>

              <div style="display:flex;gap:8px;align-items:center">
                <template v-if="authStore.isAuthenticated">
                  <span style="color: white; margin-right: 10px;" v-if="authStore.userProfile">
                      Hello, {{ authStore.userProfile.firstName }}
                  </span>

                  <n-button v-if="authStore.isAdmin" ghost size="small" @click="router.push('/pending-users')">
                      Pending Users
                  </n-button>

                  <n-button v-if="authStore.hasPermission('URL.PROCESS')" type="primary" size="small" @click="openProcessModal">Add Article</n-button>
                  <n-button size="small" type="error" ghost @click="authStore.logout">Logout</n-button>
                </template>
                <template v-else>
                  <n-button ghost size="small" @click="authStore.login">Login</n-button>
                  <n-button ghost size="small" @click="router.push('/register')">Register</n-button>
                </template>
              </div>
            </n-layout-header>

            <n-layout-content style="padding:16px">
              <!-- Show Router View for Navigation (Home, Register, PendingUsers) -->
              <!-- If on Home (root), show the default Dashboard components -->
              <!-- Wait, the original App.vue hardcoded PendingUrlsTable. We need to check if we are using RouterView or not. -->
              <!-- The router has a HomeView. Let's start using RouterView instead of hardcoding. -->
              <!-- BUT: I need to check what HomeView contains. If it's empty, I should move the dashboard there. -->

              <router-view v-if="authStore.isAuthenticated || $route.name === 'register' || $route.name === 'forbidden' || $route.meta.public" />
              <div v-else style="text-align: center; padding: 50px;">
                  <h2>Please Login to access the dashboard.</h2>
              </div>

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
        </n-message-provider>
      </n-notification-provider>
    </n-dialog-provider>
  </n-config-provider>
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

