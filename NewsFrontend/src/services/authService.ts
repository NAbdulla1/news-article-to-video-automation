import apiClient from './apiClient';

export interface RegisterData {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    password: string;
}

export const authService = {
    register: async (data: RegisterData) => {
        const response = await apiClient.post('/auth/register', data);
        return response.data;
    },

    getPendingUsers: async () => {
        const response = await apiClient.get('/auth/users/pending');
        return response.data;
    },

    approveUser: async (userId: string, role?: string) => {
        const response = await apiClient.post(`/auth/users/${userId}/approve`, { role });
        return response.data;
    }
};
