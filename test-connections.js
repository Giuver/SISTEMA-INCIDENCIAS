// Script para probar las conexiones del sistema
const axios = require('axios');

const API_URL = process.env.VITE_API_URL || 'https://sistema-incidencias-production.up.railway.app';

async function testConnections() {
    console.log('🔍 Probando conexiones del sistema...');
    console.log('URL base:', API_URL);
    console.log('');

    try {
        // Test 1: Ruta de prueba
        console.log('1️⃣ Probando ruta de prueba...');
        const testResponse = await axios.get(`${API_URL}/api/test`);
        console.log('✅ Ruta de prueba:', testResponse.data);
        console.log('');

        // Test 2: Verificar usuarios
        console.log('2️⃣ Probando endpoint de usuarios...');
        const usersResponse = await axios.get(`${API_URL}/api/users`);
        console.log('✅ Usuarios encontrados:', usersResponse.data.length);
        console.log('');

        // Test 3: Verificar áreas
        console.log('3️⃣ Probando endpoint de áreas...');
        const areasResponse = await axios.get(`${API_URL}/api/areas`);
        console.log('✅ Áreas encontradas:', areasResponse.data.length);
        console.log('');

        // Test 4: Verificar incidencias
        console.log('4️⃣ Probando endpoint de incidencias...');
        const incidentsResponse = await axios.get(`${API_URL}/api/incidents`);
        console.log('✅ Incidencias encontradas:', incidentsResponse.data.length);
        console.log('');

        console.log('🎉 Todas las pruebas pasaron correctamente!');
        console.log('El sistema está funcionando correctamente.');

    } catch (error) {
        console.error('❌ Error en las pruebas:');
        console.error('Status:', error.response?.status);
        console.error('Message:', error.response?.data?.message || error.message);
        console.error('URL:', error.config?.url);
        console.log('');
        console.log('🔧 Posibles soluciones:');
        console.log('1. Verificar que el backend esté corriendo en Railway');
        console.log('2. Verificar la URL en frontend.env');
        console.log('3. Verificar las variables de entorno en Railway');
    }
}

// Ejecutar las pruebas
testConnections(); 