import axios from 'axios';

// Crear instancia de axios con configuración base
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para agregar token automáticamente
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        const { response } = error;

        // Manejar errores específicos
        if (response) {
            switch (response.status) {
                case 401:
                    // Token expirado o inválido
                    localStorage.removeItem('token');
                    localStorage.removeItem('userId');
                    localStorage.removeItem('role');
                    window.location.href = '/login';
                    break;

                case 403:
                    // Acceso denegado
                    console.error('Acceso denegado:', response.data.message);
                    break;

                case 404:
                    // Recurso no encontrado
                    console.error('Recurso no encontrado:', response.data.message);
                    break;

                case 422:
                    // Error de validación
                    console.error('Error de validación:', response.data.errors);
                    break;

                case 429:
                    // Rate limit excedido
                    console.error('Demasiadas solicitudes. Intenta de nuevo en unos minutos.');
                    break;

                case 500:
                    // Error del servidor
                    console.error('Error del servidor:', response.data.message);
                    break;

                default:
                    console.error('Error desconocido:', response.data.message);
            }
        } else {
            // Error de red
            console.error('Error de conexión:', error.message);
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

export default api; 