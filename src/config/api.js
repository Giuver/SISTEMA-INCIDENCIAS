// Configuración de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
    LOGIN: `${API_BASE_URL}/api/users/login`,
    VERIFY: `${API_BASE_URL}/api/auth/verify`,
    INCIDENTS: `${API_BASE_URL}/api/incidents`,
    CATEGORIES: `${API_BASE_URL}/api/categories`,
    NOTIFICATIONS: `${API_BASE_URL}/api/notifications`,
    AUDIT: `${API_BASE_URL}/api/audit`,
    USERS: `${API_BASE_URL}/api/users`,
};

export default API_BASE_URL; 