import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as keycloakService from '../services/keycloakService';

export const useAuthStore = defineStore('auth', () => {
    const isAuthenticated = ref(false);
    const userProfile = ref<any>(null);
    const roles = ref<string[]>([]);

    // Permission Mapping (Should match Backend Enum roughly or logic)
    // Frontend doesn't check tokens, it checks Roles.
    // We can define permissions here based on roles.
    const permissions = computed(() => {
        const perms = new Set<string>();
        if (roles.value.includes('admin')) {
            perms.add('URL.VIEW');
            perms.add('URL.DELETE');
            perms.add('URL.PROCESS');
            perms.add('SCRAPPING.STATUS.VIEW');
            perms.add('SCRAPPING.STATUS.MODIFY');
            perms.add('ADMIN.ACCESS');
        } else if (roles.value.includes('staff')) {
            perms.add('URL.VIEW');
            perms.add('SCRAPPING.STATUS.VIEW');
        }
        return perms;
    });

    const initAuth = async () => {
        isAuthenticated.value = await keycloakService.initKeycloak();
        if (isAuthenticated.value) {
            try {
                userProfile.value = await keycloakService.getUserProfile();
                roles.value = keycloakService.default.realmAccess?.roles || [];
            } catch (e) {
                console.error("Failed to load profile", e);
            }
        }
        return isAuthenticated.value;
    };

    const login = () => keycloakService.login();
    const logout = () => keycloakService.logout();

    const hasPermission = (perm: string) => permissions.value.has(perm);
    const hasRole = (role: string) => roles.value.includes(role);
    const isAdmin = computed(() => roles.value.includes('admin'));

    const isApproved = computed(() => roles.value.includes('admin') || roles.value.includes('staff'));

    return {
        isAuthenticated,
        userProfile,
        roles,
        permissions,
        initAuth,
        login,
        logout,
        hasPermission,
        hasRole,
        isAdmin,
        isApproved
    }
});
