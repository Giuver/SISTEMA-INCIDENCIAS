// ===== COMANDOS DE DEBUG PARA EJECUTAR EN LA CONSOLA DEL NAVEGADOR =====

console.log('🧪 === INICIANDO PRUEBAS DE AUTENTICACIÓN ===');

// 1. Probar el estado de autenticación
console.log('\n🔍 1. PROBANDO ESTADO DE AUTENTICACIÓN:');
window.debugAuth.test();

// 2. Ver todos los datos actuales
console.log('\n📋 2. VER TODOS LOS DATOS ACTUALES:');
console.log(window.debugAuth.getAll());

// 3. Ver solo el token
console.log('\n🔑 3. VER SOLO EL TOKEN:');
console.log(window.debugAuth.getToken());

// 4. Ver solo el rol
console.log('\n🎭 4. VER SOLO EL ROL:');
console.log(window.debugAuth.getRole());

// 5. Verificar si está autenticado
console.log('\n✅ 5. ¿ESTÁ AUTENTICADO?:');
console.log('Usuario autenticado:', window.debugAuth.test ? 'SÍ' : 'NO');

// 6. Verificar localStorage directamente
console.log('\n💾 6. DATOS EN LOCALSTORAGE:');
console.log('Token:', localStorage.getItem('token') ? 'Presente' : 'Ausente');
console.log('Role:', localStorage.getItem('role') || 'No encontrado');
console.log('UserId:', localStorage.getItem('userId') || 'No encontrado');

console.log('\n🧪 === FIN DE PRUEBAS ===');

// ===== INSTRUCCIONES =====
// 1. Abre la consola del navegador (F12)
// 2. Copia y pega todo este código
// 3. Presiona Enter
// 4. Revisa los resultados en la consola 