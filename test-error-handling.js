// ===== PRUEBA DE MANEJO DE ERRORES EN AUDITORÍA =====

console.log('🧪 === PRUEBA DE MANEJO DE ERRORES ===');

// 1. Verificar estado actual
const token = localStorage.getItem('token');
const role = localStorage.getItem('role');
const userId = localStorage.getItem('userId');

console.log('📋 Estado actual:');
console.log('  Token:', token ? 'Presente' : 'Ausente');
console.log('  Role:', role || 'No encontrado');
console.log('  UserId:', userId || 'No encontrado');

// 2. Probar acceso a auditoría
console.log('\n🔍 Probando acceso a auditoría...');

// 3. Verificar si debería tener acceso
const shouldHaveAccess = token && role === 'admin' && userId;
console.log('✅ ¿Debería tener acceso?', shouldHaveAccess ? 'SÍ' : 'NO');

// 4. Simular error de token inválido
console.log('\n🧪 Simulando error de token inválido...');
console.log('⚠️ Si ves un error en pantalla, significa que el manejo funciona correctamente');

// 5. Instrucciones para probar
console.log('\n📝 INSTRUCCIONES PARA PROBAR:');
console.log('1. Ve a la pestaña "Auditoría"');
console.log('2. Si ves un error en pantalla, el manejo funciona');
console.log('3. Si te redirige inmediatamente, hay un problema');
console.log('4. Revisa la consola para ver los logs detallados');

console.log('\n✅ === FIN DE PRUEBA ==='); 