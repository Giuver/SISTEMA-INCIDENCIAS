// ===== PRUEBA ESPECÍFICA PARA AUDITORÍA =====

console.log('🧪 === PRUEBA ESPECÍFICA PARA AUDITORÍA ===');

// 1. Verificar datos en localStorage
const token = localStorage.getItem('token');
const role = localStorage.getItem('role');
const userId = localStorage.getItem('userId');

console.log('📋 Datos actuales:');
console.log('  Token:', token ? 'Presente' : 'Ausente');
console.log('  Role:', role || 'No encontrado');
console.log('  UserId:', userId || 'No encontrado');

// 2. Verificar si debería tener acceso a Auditoría
const shouldHaveAccess = token && role === 'admin' && userId;
console.log('🔐 ¿Debería tener acceso a Auditoría?', shouldHaveAccess ? 'SÍ' : 'NO');

// 3. Simular verificación de PrivateRoute
if (token && role && userId) {
    console.log('✅ Datos completos en localStorage');
    console.log('✅ Rol admin detectado');
    console.log('✅ Debería permitir acceso a Auditoría');
} else {
    console.log('❌ Faltan datos en localStorage');
    console.log('❌ No debería permitir acceso');
}

// 4. Verificar token con backend
if (token) {
    console.log('🔍 Verificando token con backend...');
    fetch('http://localhost:5000/api/users/verify', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            console.log('🔍 Respuesta del backend:', response.status);
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Token inválido');
            }
        })
        .then(data => {
            console.log('✅ Token válido en backend:', data);
            console.log('✅ Usuario:', data.user.role);
            console.log('✅ Debería permitir acceso a Auditoría');
        })
        .catch(error => {
            console.log('❌ Error al verificar token:', error.message);
        });
}

console.log('🧪 === FIN DE PRUEBA ===');

// ===== INSTRUCCIONES =====
// 1. Ejecuta este script en la consola
// 2. Luego intenta acceder a Auditoría
// 3. Revisa los logs en la consola 