import KcAdminClient from '@keycloak/keycloak-admin-client';
import logger from '../logger.js';

let kcAdminClient;

export const initKeycloakAdmin = async () => {
    if (kcAdminClient) return kcAdminClient;

    const baseUrl = process.env.KEYCLOAK_BASE_URL || 'http://localhost:8080';
    const realmName = process.env.KEYCLOAK_REALM || 'news-realm';

    // We use the 'news-backend' client which has Service Account enabled
    // The client credentials should be in .env
    const clientId = process.env.KEYCLOAK_CLIENT_ID || 'news-backend';
    const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;

    if (!clientSecret) {
        logger.warn("KEYCLOAK_CLIENT_SECRET is missing. Keycloak Admin initialization might fail.");
    }

    try {
        kcAdminClient = new KcAdminClient({
            baseUrl,
            realmName,
        });

        await kcAdminClient.auth({
            grantType: 'client_credentials',
            clientId,
            clientSecret,
        });

        logger.info('Keycloak Admin Client initialized successfully.');
        return kcAdminClient;
    } catch (err) {
        logger.error('Failed to initialize Keycloak Admin Client:', err);
        throw err;
    }
};

export const getKeycloakAdmin = async () => {
    if (!kcAdminClient) {
        return await initKeycloakAdmin();
    }
    return kcAdminClient;
};
