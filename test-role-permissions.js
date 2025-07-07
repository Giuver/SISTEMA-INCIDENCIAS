const axios = require('axios');

// Configuración
const BASE_URL = 'http://localhost:5000';

// Datos de prueba
const testUsers = {
    admin: {
        email: 'admin@example.com',
        password: 'admin123'
    },
    soporte: {
        email: 'soporte1@example.com',
        password: 'soporte123'
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

async function testIncidentsAccess(token, role) {
    try {
        const response = await axios.get(`${BASE_URL}/api/incidents`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✅ Acceso a incidencias para ${role}:`, response.data.length, 'incidencias');
        return true;
    } catch (error) {
        console.error(`❌ Error en acceso a incidencias para ${role}:`, error.response?.data || error.message);
        return false;
    }
}

async function testIncidentUpdate(token, role) {
    try {
        // Intentar actualizar una incidencia (debería fallar para usuarios)
        const response = await axios.patch(`${BASE_URL}/api/incidents/123456789012345678901234`, {
            status: 'en_proceso'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✅ Actualización de incidencia para ${role}:`, response.data);
        return true;
    } catch (error) {
        if (role === 'usuario' && error.response?.status === 403) {
            console.log(`✅ Correcto: Usuario ${role} no puede actualizar incidencias`);
            return true;
        } else if (role === 'admin' || role === 'soporte') {
            console.log(`⚠️ Error inesperado para ${role}:`, error.response?.data || error.message);
            return false;
        } else {
            console.log(`✅ Error esperado para ${role}:`, error.response?.data?.message);
            return true;
        }
    }
}

async function testAreasAccess(token, role) {
    try {
        const response = await axios.get(`${BASE_URL}/api/areas`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✅ Acceso a áreas para ${role}:`, response.data.length, 'áreas');
        return true;
    } catch (error) {
        console.error(`❌ Error en acceso a áreas para ${role}:`, error.response?.data || error.message);
        return false;
    }
}

async function testAuditAccess(token, role) {
    try {
        const response = await axios.get(`${BASE_URL}/api/audit`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (role === 'admin') {
            console.log(`✅ Acceso a auditoría para ${role}:`, response.data.logs?.length || 0, 'registros');
            return true;
        } else {
            console.log(`❌ Usuario ${role} no debería tener acceso a auditoría`);
            return false;
        }
    } catch (error) {
        if (role !== 'admin' && error.response?.status === 403) {
            console.log(`✅ Correcto: Usuario ${role} no puede acceder a auditoría`);
            return true;
        } else {
            console.error(`❌ Error inesperado en auditoría para ${role}:`, error.response?.data || error.message);
            return false;
        }
    }
}

async function testStatsAccess(token, role) {
    try {
        const response = await axios.get(`${BASE_URL}/api/incidents/stats`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✅ Stats para ${role}:`, response.data);
        return true;
    } catch (error) {
        console.error(`❌ Error en stats para ${role}:`, error.response?.data || error.message);
        return false;
    }
}

async function runTests() {
    console.log('🧪 Iniciando pruebas de permisos por rol...\n');

    for (const [role, userData] of Object.entries(testUsers)) {
        console.log(`👤 Probando con usuario ${role}...`);
        const token = await login(userData);

        if (token) {
            await testIncidentsAccess(token, role);
            await testIncidentUpdate(token, role);
            await testAreasAccess(token, role);
            await testAuditAccess(token, role);
            await testStatsAccess(token, role);
        }

        console.log('');
    }

    console.log('✅ Pruebas completadas');
}

runTests().catch(console.error); 