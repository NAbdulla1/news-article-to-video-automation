import Keycloak from 'keycloak-js';
import backendService from './backendService';

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'news-realm',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'news-app'
});

export const initKeycloak = async () => {
  try {
    console.log("Initializing Keycloak...");
    const authenticated = await keycloak.init({
      onLoad: 'login-required',
      pkceMethod: 'S256',
      checkLoginIframe: false // Disable iframe check to rule out iframe issues for now
    });
    console.log("Keycloak init result:", authenticated);
    return authenticated;
  } catch (error) {
    console.error('Keycloak init failed', error);
    // Log more details if available
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return false;
  }
};

export const login = () => keycloak.login();
export const logout = () => keycloak.logout();
export const getToken = () => keycloak.token;
export const updateToken = () => keycloak.updateToken(70); // Refresh if expires in < 70s
export const hasRealmRole = (role: string) => keycloak.hasRealmRole(role);
export const isAuthenticated = () => !!keycloak.authenticated;
export const getUserProfile = async () => {
  try {
    // Ensure token is fresh before requesting profile
    if (keycloak.isTokenExpired(30)) {
      await keycloak.updateToken(30);
    }
    const profile = await backendService.getUserProfile();
    return profile;
  } catch (err) {
    console.error("Failed to load user profile. Token status:", {
      expired: keycloak.isTokenExpired(),
      hasToken: !!keycloak.token,
    }, err);
    throw err;
  }
};

export default keycloak;
