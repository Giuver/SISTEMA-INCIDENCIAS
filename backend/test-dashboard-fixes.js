const axios = require('axios');

// Configuración
const BASE_URL = 'http://localhost:5000';

// Datos de prueba
const testUsers = {
    admin: {
        email: 'admin@example.com',
        password: 'admin123'
    },
    usuario: {
        email: 'usuario1@example.com',
        password: 'usuario123'
    }
};

async function login(userData) {
    try {
        const response = await axios.post(`${BASE_URL}/api/auth/login`, userData);
        return response.data.token;
    } catch (error) {
        console.error('Error en login:', error.response?.data || error.message);
        return null;
    }
}

async function testStatsEndpoint(token, role) {
    try {
        const response = await axios.get(`${BASE_URL}/api/incidents/stats`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✅ Stats endpoint funciona para ${role}:`, response.data);
        return true;
    } catch (error) {
        console.error(`❌ Error en stats endpoint para ${role}:`, error.response?.data || error.message);
        return false;
    }
}

async function testUsersEndpoint(token, role) {
    try {
        const response = await axios.get(`${BASE_URL}/api/users`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✅ Users endpoint funciona para ${role}:`, response.data.length, 'usuarios');
        return true;
    } catch (error) {
        console.error(`❌ Error en users endpoint para ${role}:`, error.response?.data || error.message);
        return false;
    }
}

async function runTests() {
    console.log('🧪 Iniciando pruebas de los cambios del dashboard...\n');

    // Probar con admin
    console.log('👤 Probando con usuario admin...');
    const adminToken = await login(testUsers.admin);
    if (adminToken) {
        await testStatsEndpoint(adminToken, 'admin');
        await testUsersEndpoint(adminToken, 'admin');
    }

    console.log('\n👤 Probando con usuario normal...');
    const userToken = await login(testUsers.usuario);
    if (userToken) {
        await testStatsEndpoint(userToken, 'usuario');
        await testUsersEndpoint(userToken, 'usuario');
    }

    console.log('\n✅ Pruebas completadas');
}

runTests().catch(console.error); 