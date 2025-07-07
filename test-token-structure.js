// ===== PRUEBA DE ESTRUCTURA DEL TOKEN JWT =====

console.log('🧪 === PRUEBA DE ESTRUCTURA DEL TOKEN ===');

// 1. Obtener el token actual
const token = localStorage.getItem('token');
console.log('📋 Token actual:', token ? 'Presente' : 'Ausente');

if (token) {
    // 2. Decodificar el token (sin verificar la firma)
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const decoded = JSON.parse(jsonPayload);
        console.log('🔍 Token decodificado:', decoded);

        // 3. Verificar la estructura
        if (decoded.user) {
            console.log('✅ Token tiene estructura user correcta');
            console.log('  - User ID:', decoded.user.id);
            console.log('  - User Role:', decoded.user.role);
        } else {
            console.log('❌ Token NO tiene estructura user');
            console.log('  - Estructura encontrada:', Object.keys(decoded));
        }

        // 4. Verificar expiración
        if (decoded.exp) {
            const expirationDate = new Date(decoded.exp * 1000);
            const now = new Date();
            console.log('⏰ Expiración del token:', expirationDate.toLocaleString());
            console.log('⏰ Hora actual:', now.toLocaleString());
            console.log('⏰ ¿Token expirado?', now > expirationDate ? 'SÍ' : 'NO');
        }

    } catch (error) {
        console.error('❌ Error al decodificar token:', error);
    }
}

// 5. Verificar datos en localStorage
const role = localStorage.getItem('role');
const userId = localStorage.getItem('userId');
console.log('\n📋 Datos en localStorage:');
console.log('  - Role:', role || 'No encontrado');
console.log('  - UserId:', userId || 'No encontrado');

// 6. Instrucciones para probar
console.log('\n📝 INSTRUCCIONES PARA PROBAR:');
console.log('1. Ve a la pestaña "Auditoría"');
console.log('2. Revisa los logs del backend para ver si hay errores');
console.log('3. Si ves "Token con estructura inválida", el problema está en el token');
console.log('4. Si ves "req.user no está definido", el problema está en el middleware');

console.log('\n✅ === FIN DE PRUEBA ==='); 