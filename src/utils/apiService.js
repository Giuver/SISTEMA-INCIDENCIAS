import axios from 'axios';
import sessionManager from './sessionManager';

// Función helper para validar tokens
const isValidToken = (token) => {
    if (!token) return false;
    if (typeof token !== 'string') return false;
    if (token.trim() === '') return false;
    if (token === 'undefined' || token === 'null') return false;
    if (token === 'TU_TOKEN_AQUI') return false; // Evitar tokens de placeholder

    // Verificar formato básico de JWT (3 partes separadas por puntos)
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    return true;
};

// Función helper para obtener token válido
const getValidToken = () => {
    const token = sessionManager.getAuthData()?.token;
    if (isValidToken(token)) {
        return token;
    }
    console.log('⚠️ Token inválido encontrado:', token);
    return null;
};

// Crear instancia de axios con configuración base
const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para agregar token automáticamente
api.interceptors.request.use(
    (config) => {
        const token = getValidToken();

        if (token) {
            console.log('🔍 API Request - Token válido encontrado, agregando a headers');
            config.headers.Authorization = `Bearer ${token}`;
        } else {
            console.log('⚠️ API Request - Token inválido o ausente, no agregando Authorization header');
            // No agregar header Authorization si no hay token válido
        }

        return config;
    },
    (error) => {
        console.log('❌ API Request - Error en interceptor:', error);
        return Promise.reject(error);
    }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
    (response) => {
        console.log('✅ API Response - Petición exitosa:', response.config.url);
        return response;
    },
    (error) => {
        const { response } = error;

        console.log('❌ API Response - Error en petición:', response?.status, response?.data);

        // Manejar errores específicos
        if (response) {
            switch (response.status) {
                case 401:
                    // Token expirado o inválido - NO redirigir automáticamente
                    console.log('❌ Token expirado o inválido (401) - Mostrando error en pantalla');
                    console.log('❌ URL que causó el error:', response.config.url);
                    console.log('❌ Token enviado:', response.config.headers.Authorization);

                    // En lugar de redirigir, lanzar un error que el componente pueda manejar
                    const authError = new Error('Token inválido o expirado');
                    authError.status = 401;
                    authError.response = response;
                    throw authError;

                case 403:
                    // Acceso denegado
                    console.error('❌ Acceso denegado (403):', response.data.message);
                    const forbiddenError = new Error('Acceso denegado');
                    forbiddenError.status = 403;
                    forbiddenError.response = response;
                    throw forbiddenError;

                case 404:
                    // Recurso no encontrado
                    console.error('❌ Recurso no encontrado (404):', response.data.message);
                    const notFoundError = new Error('Recurso no encontrado');
                    notFoundError.status = 404;
                    notFoundError.response = response;
                    throw notFoundError;

                case 422:
                    // Error de validación
                    console.error('❌ Error de validación (422):', response.data.errors);
                    const validationError = new Error('Error de validación');
                    validationError.status = 422;
                    validationError.response = response;
                    throw validationError;

                case 429:
                    // Rate limit excedido
                    console.error('❌ Demasiadas solicitudes (429). Intenta de nuevo en unos minutos.');
                    const rateLimitError = new Error('Demasiadas solicitudes');
                    rateLimitError.status = 429;
                    rateLimitError.response = response;
                    throw rateLimitError;

                case 500:
                    // Error del servidor
                    console.error('❌ Error del servidor (500):', response.data.message);
                    const serverError = new Error('Error del servidor');
                    serverError.status = 500;
                    serverError.response = response;
                    throw serverError;

                default:
                    console.error('❌ Error desconocido:', response.data.message);
                    const unknownError = new Error('Error desconocido');
                    unknownError.status = response.status;
                    unknownError.response = response;
                    throw unknownError;
            }
        } else {
            // Error de red
            console.error('❌ Error de conexión:', error.message);
            const networkError = new Error('Error de conexión');
            networkError.status = 0;
            throw networkError;
        }

        return Promise.reject(error);
    }
);

// Funciones helper para API
export const apiService = {
    // GET request
    get: async (url, config = {}) => {
        try {
            const response = await api.get(url, config);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // POST request
    post: async (url, data = {}, config = {}) => {
        try {
            const response = await api.post(url, data, config);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // PUT request
    put: async (url, data = {}, config = {}) => {
        try {
            const response = await api.put(url, data, config);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // PATCH request
    patch: async (url, data = {}, config = {}) => {
        try {
            const response = await api.patch(url, data, config);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // DELETE request
    delete: async (url, config = {}) => {
        try {
            const response = await api.delete(url, config);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Upload file
    upload: async (url, formData, config = {}) => {
        try {
            const response = await api.post(url, formData, {
                ...config,
                headers: {
                    'Content-Type': 'multipart/form-data',
                    ...config.headers,
                },
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
};

// Funciones específicas para incidencias
export const incidentAPI = {
    // Obtener todas las incidencias
    getAll: async (filters = {}) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, value);
            }
        });

        return apiService.get(`/incidents?${params.toString()}`);
    },

    // Obtener una incidencia específica
    getById: async (id) => {
        return apiService.get(`/incidents/${id}`);
    },

    // Crear nueva incidencia
    create: async (data) => {
        return apiService.post('/incidents', data);
    },

    // Actualizar incidencia
    update: async (id, data) => {
        return apiService.patch(`/incidents/${id}`, data);
    },

    // Eliminar incidencia
    delete: async (id) => {
        return apiService.delete(`/incidents/${id}`);
    },

    // Cambiar estado de incidencia
    changeStatus: async (id, status, solution = '') => {
        return apiService.patch(`/incidents/${id}/estado`, { status, solution });
    },

    // Asignar incidencia
    assign: async (id, assignedTo) => {
        return apiService.patch(`/incidents/${id}/asignar`, { assignedTo });
    },

    // Obtener estadísticas
    getStats: async () => {
        return apiService.get('/incidents/stats');
    },
};

// Funciones específicas para usuarios
export const userAPI = {
    // Login
    login: async (credentials) => {
        return apiService.post('/users/login', credentials);
    },

    // Verificar token
    verify: async () => {
        return apiService.get('/users/verify');
    },

    // Obtener todos los usuarios
    getAll: async () => {
        return apiService.get('/users');
    },

    // Crear usuario
    create: async (userData) => {
        return apiService.post('/users/register', userData);
    },

    // Actualizar usuario
    update: async (id, userData) => {
        return apiService.patch(`/users/${id}`, userData);
    },

    // Eliminar usuario
    delete: async (id) => {
        return apiService.delete(`/users/${id}`);
    },
};

// Funciones específicas para categorías
export const categoryAPI = {
    // Obtener todas las categorías
    getAll: async () => {
        return apiService.get('/categories');
    },

    // Crear categoría
    create: async (data) => {
        return apiService.post('/categories', data);
    },

    // Actualizar categoría
    update: async (id, data) => {
        return apiService.patch(`/categories/${id}`, data);
    },

    // Eliminar categoría
    delete: async (id) => {
        return apiService.delete(`/categories/${id}`);
    },
};

// Funciones específicas para auditoría
export const auditAPI = {
    // Obtener registros de auditoría
    getAll: async (filters = {}) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, value);
            }
        });
        return apiService.get(`/audit?${params.toString()}`);
    },
};

// Funciones de autenticación
export const authService = {
    // Verificar si el usuario está autenticado
    isAuthenticated: () => {
        const token = getValidToken();
        const role = localStorage.getItem('role');
        const userId = localStorage.getItem('userId');

        return !!(token && role && userId);
    },

    // Obtener información del usuario autenticado
    getCurrentUser: () => {
        const role = localStorage.getItem('role');
        const userId = localStorage.getItem('userId');

        if (role && userId) {
            return { role, userId };
        }
        return null;
    },

    // Verificar si el usuario tiene un rol específico
    hasRole: (requiredRole) => {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) return false;

        if (Array.isArray(requiredRole)) {
            return requiredRole.includes(currentUser.role);
        }
        return currentUser.role === requiredRole;
    },

    // Limpiar datos de autenticación
    logout: () => {
        console.log('🔓 Limpiando datos de autenticación');
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        window.location.href = '/login';
    },

    // Verificar token con el backend
    verifyToken: async () => {
        const token = getValidToken();
        if (!token) {
            throw new Error('No hay token válido');
        }

        try {
            const response = await api.get('/users/verify');
            return response.data;
        } catch (error) {
            console.log('❌ Error al verificar token:', error);
            throw error;
        }
    }
};

export default api; 