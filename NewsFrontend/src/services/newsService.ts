import apiClient from './apiClient';

export const newsService = {
    getPendingUrls: async (params: { page: number; limit: number; status?: string; source?: string }) => {
        const response = await apiClient.get('/pending-urls', { params });
        return response.data;
    },

    processUrl: async (link: string, source: string) => {
        const response = await apiClient.post('/process-link', { link, source });
        return response.data;
    },

    processPendingUrl: async (id: string) => {
        const response = await apiClient.post(`/pending-urls/${id}/process`);
        return response.data;
    },
    
    deletePendingUrl: async (id: string) => {
        const response = await apiClient.delete(`/pending-urls/${id}`);
        return response.data;
    },

    getNewsSources: async () => {
        const response = await apiClient.get('/news-sources');
        return response.data;
    },

    getScrappingStatus: async () => {
        const response = await apiClient.get('/scrapping-enabled');
        return response.data;
    },

    setScrappingStatus: async (enabled: boolean) => {
        const response = await apiClient.post('/scrapping-enabled', { enabled });
        return response.data;
    }
};
