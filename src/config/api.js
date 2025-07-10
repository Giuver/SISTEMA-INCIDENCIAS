// Configuración de la API
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

export const API_ENDPOINTS = {
    LOGIN: `${API_BASE_URL}/users/login`,
    VERIFY: `${API_BASE_URL}/users/verify`,
    INCIDENTS: `${API_BASE_URL}/incidents`,
    CATEGORIES: `${API_BASE_URL}/categories`,
    NOTIFICATIONS: `${API_BASE_URL}/notifications`,
    AUDIT: `${API_BASE_URL}/audit`,
    USERS: `${API_BASE_URL}/users`,
};

export default API_BASE_URL; 