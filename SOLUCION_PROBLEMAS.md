# Solución de Problemas - Sistema de Gestión de Incidencias

## Problemas Identificados y Soluciones

### 1. Error 401 en `/api/users/verify`
**Problema**: El frontend recibía errores 401 al verificar tokens.

**Solución implementada**:
- Mejorado el manejo de errores en `PrivateRoute.jsx`
- Agregada verificación específica para tokens expirados
- Limpieza automática del localStorage cuando el token es inválido

### 2. WebSocket connection failed
**Problema**: Las conexiones de Socket.IO fallaban.

**Solución implementada**:
- Configuración mejorada de Socket.IO en el frontend
- Agregados parámetros de reconexión y timeout
- Manejo de errores de conexión
- Configuración de autenticación con token

### 3. Puerto 5000 en uso
**Problema**: El servidor no podía iniciarse porque el puerto estaba ocupado.

**Solución implementada**:
- Modificado el servidor para intentar puertos alternativos automáticamente
- Mejorado el manejo de errores de puerto en uso
- Agregados logs informativos sobre el puerto utilizado

## Configuración del Entorno

### 1. Configurar variables de entorno
```bash
# En el directorio backend
cp env.example .env
```

### 2. Crear usuarios de prueba
```bash
# En el directorio backend
npm run setup
```

### 3. Iniciar el servidor
```bash
# En el directorio backend
npm run dev
```

### 4. Iniciar el frontend
```bash
# En el directorio raíz
npm run dev
```

## Credenciales de Prueba

Después de ejecutar `npm run setup` en el backend:

- **Administrador**: admin@example.com / admin123
- **Soporte**: soporte@example.com / soporte123
- **Usuario**: usuario@example.com / usuario123

## Mejoras Implementadas

### Frontend
1. **Manejo de errores mejorado**: Mejor gestión de errores de red y autenticación
2. **Configuración de Socket.IO**: Reconexión automática y manejo de errores
3. **Timeout aumentado**: De 10s a 15s para peticiones API
4. **Función de reintento**: Reintentos automáticos para peticiones fallidas

### Backend
1. **Manejo de puertos**: Intento automático de puertos alternativos
2. **Logs mejorados**: Información más detallada sobre el estado del servidor
3. **Script de configuración**: Creación automática de usuarios de prueba
4. **Validación de configuración**: Verificación de variables de entorno críticas

## Verificación de la Solución

1. **Verificar que el servidor inicie correctamente**:
   ```bash
   cd backend
   npm run dev
   ```
   Deberías ver: `🚀 Servidor iniciado en puerto 5000` (o 5001 si 5000 está ocupado)

2. **Verificar la conexión del frontend**:
   - Abrir http://localhost:5173
   - Intentar iniciar sesión con las credenciales de prueba
   - Verificar que no aparezcan errores 401 en la consola

3. **Verificar Socket.IO**:
   - Abrir las herramientas de desarrollador
   - Verificar que no haya errores de WebSocket en la consola

## Troubleshooting

### Si el servidor no inicia:
1. Verificar que MongoDB esté ejecutándose
2. Verificar que el archivo `.env` esté configurado correctamente
3. Verificar que no haya otros procesos usando el puerto 5000

### Si el frontend no se conecta:
1. Verificar que el servidor esté ejecutándose
2. Verificar la URL en `vite.config.js`
3. Verificar que no haya problemas de CORS

### Si Socket.IO no funciona:
1. Verificar que el token esté presente en localStorage
2. Verificar la configuración de CORS en el servidor
3. Verificar que el puerto del servidor coincida con la configuración del frontend

## Archivos Modificados

- `src/components/PrivateRoute.jsx`: Mejorado manejo de errores de autenticación
- `src/components/NotificationCenter.jsx`: Configuración mejorada de Socket.IO
- `src/config/api.js`: Agregadas funciones de manejo de errores y reintentos
- `backend/server.js`: Mejorado manejo de puertos y logs
- `backend/package.json`: Agregado script de configuración
- `backend/scripts/setup.js`: Script para crear usuarios de prueba 