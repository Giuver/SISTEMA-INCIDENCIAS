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
        return response.data;
    } catch (error) {
        console.error('Error en login:', error.response?.data || error.message);
        return null;
    }
}

async function testMultipleSessions() {
    console.log('🧪 Probando múltiples sesiones simultáneas...\n');

    // Simular múltiples sesiones
    const sessions = [];

    // Crear 3 sesiones simultáneas
    for (const [role, userData] of Object.entries(testUsers)) {
        console.log(`🔐 Iniciando sesión como ${role}...`);
        const authData = await login(userData);

        if (authData) {
            sessions.push({
                role,
                token: authData.token,
                userId: authData.userId
            });
            console.log(`✅ Sesión ${role} iniciada correctamente`);
        } else {
            console.log(`❌ Error iniciando sesión ${role}`);
        }
    }

    console.log('\n📊 Resumen de sesiones:');
    sessions.forEach((session, index) => {
        console.log(`   ${index + 1}. ${session.role} - Token: ${session.token.substring(0, 20)}...`);
    });

    // Probar acceso a recursos con diferentes sesiones
    console.log('\n🔍 Probando acceso a recursos...');

    for (const session of sessions) {
        console.log(`\n👤 Probando acceso como ${session.role}:`);

        try {
            // Probar acceso a incidencias
            const incidentsResponse = await axios.get(`${BASE_URL}/api/incidents`, {
                headers: { Authorization: `Bearer ${session.token}` }
            });
            console.log(`   ✅ Incidencias: ${incidentsResponse.data.length} encontradas`);

            // Probar acceso a estadísticas
            const statsResponse = await axios.get(`${BASE_URL}/api/incidents/stats`, {
                headers: { Authorization: `Bearer ${session.token}` }
            });
            console.log(`   ✅ Estadísticas: ${JSON.stringify(statsResponse.data)}`);

            // Probar acceso a áreas (solo admin)
            if (session.role === 'admin') {
                const areasResponse = await axios.get(`${BASE_URL}/api/areas`, {
                    headers: { Authorization: `Bearer ${session.token}` }
                });
                console.log(`   ✅ Áreas: ${areasResponse.data.length} encontradas`);
            } else {
                try {
                    await axios.get(`${BASE_URL}/api/areas`, {
                        headers: { Authorization: `Bearer ${session.token}` }
                    });
                    console.log(`   ❌ Áreas: Debería estar bloqueado para ${session.role}`);
                } catch (error) {
                    if (error.response?.status === 403) {
                        console.log(`   ✅ Áreas: Correctamente bloqueado para ${session.role}`);
                    } else {
                        console.log(`   ❌ Áreas: Error inesperado para ${session.role}`);
                    }
                }
            }

        } catch (error) {
            console.log(`   ❌ Error: ${error.response?.data?.message || error.message}`);
        }
    }

    console.log('\n✅ Prueba de múltiples sesiones completada');
    console.log('💡 Cada sesión mantiene su propio contexto y permisos');
}

// Ejecutar prueba
testMultipleSessions().catch(console.error); 