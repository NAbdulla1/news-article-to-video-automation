import axios from 'axios';
import * as keycloakService from './keycloakService';

const apiClient = axios.create({
    baseURL: 'http://localhost:3000', // Backend URL
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request Interceptor to inject Token
apiClient.interceptors.request.use(async (config) => {
    if (keycloakService.isAuthenticated()) {
        try {
            await keycloakService.updateToken(); // Refresh if needed
            const token = keycloakService.getToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error("Failed to refresh token", error);
            keycloakService.login(); // Force login if refresh fails? Or just fail request?
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default apiClient;
