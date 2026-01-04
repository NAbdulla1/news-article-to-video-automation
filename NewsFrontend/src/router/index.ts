import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import RegisterView from '../views/RegisterView.vue'
import PendingUsersView from '../views/PendingUsersView.vue'
import ForbiddenView from '../views/ForbiddenView.vue'
import * as keycloakService from '../services/keycloakService'
import { useAuthStore } from '../stores/authStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true }
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView
    },
    {
      path: '/pending-users',
      name: 'pending-users',
      component: PendingUsersView,
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/forbidden',
      name: 'forbidden',
      component: ForbiddenView
    },
    // Dummy route for old about page if needed, or remove
    /*{
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue')
    }*/
  ]
})

router.beforeEach(async (to, from, next) => {
  // Wait for Keycloak init if not already (handled in App.vue usually, but good to check)
  // Actually typically we block app render until init.
  // But router guard is good place to enforce.

  // Check if route requires auth
  if (to.meta.requiresAuth) {
    if (!keycloakService.isAuthenticated()) {
      // Not authenticated, login
      // We can trigger login() here
      keycloakService.login();
      return; // Keycloak redirect will happen
    }

    // Authenticated, now check approval
    const authStore = useAuthStore();
    if (!authStore.isApproved) {
      return next({ name: 'forbidden' });
    }
  }

  // Redirect to home if already logged in and trying to access register
  if (to.name === 'register' && keycloakService.isAuthenticated()) {
    return next({ name: 'home' });
  }

  // Check Permissions (after auth check)
  const authStore = useAuthStore();
  if (to.meta.requiresAdmin) {
    if (!authStore.isAdmin) {
      return next({ name: 'forbidden' });
    }
  }

  next();
});

export default router

