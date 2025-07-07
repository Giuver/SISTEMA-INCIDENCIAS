// Utilidad para probar y diagnosticar la autenticación
import { authService } from './apiService';

export const testAuthentication = () => {
    console.log('🧪 === PRUEBA DE AUTENTICACIÓN ===');

    // Verificar localStorage
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const userId = localStorage.getItem('userId');

    console.log('📋 Datos en localStorage:');
    console.log('  Token:', token ? `${token.substring(0, 50)}...` : 'No encontrado');
    console.log('  Role:', role || 'No encontrado');
    console.log('  UserId:', userId || 'No encontrado');

    // Verificar autenticación
    const isAuth = authService.isAuthenticated();
    console.log('🔐 Usuario autenticado:', isAuth);

    // Obtener usuario actual
    const currentUser = authService.getCurrentUser();
    console.log('👤 Usuario actual:', currentUser);

    // Verificar roles
    const isAdmin = authService.hasRole('admin');
    const isUser = authService.hasRole('user');
    console.log('🎭 Roles:');
    console.log('  Es admin:', isAdmin);
    console.log('  Es user:', isUser);

    // Verificar token con backend
    if (token) {
        console.log('🔍 Verificando token con backend...');
        authService.verifyToken()
            .then(data => {
                console.log('✅ Token válido en backend:', data);
            })
            .catch(error => {
                console.log('❌ Error al verificar token:', error.message);
            });
    }

    console.log('🧪 === FIN DE PRUEBA ===');
};

// Función para limpiar datos de prueba
export const clearTestData = () => {
    console.log('🧹 Limpiando datos de prueba...');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    console.log('✅ Datos limpiados');
};

// Función para simular login exitoso
export const simulateLogin = (token, role, userId) => {
    console.log('🎭 Simulando login...');
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('userId', userId);
    console.log('✅ Login simulado completado');
    testAuthentication();
}; 