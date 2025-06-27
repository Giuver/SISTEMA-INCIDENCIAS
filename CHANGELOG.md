# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

## [1.1.0] - 2024-01-XX

### 🚀 Mejoras Implementadas

#### Configuración de Variables de Entorno
- **ANTES:** Configuración hardcodeada en archivos
- **DESPUÉS:** Uso de variables de entorno para configuración flexible
- **ARCHIVOS MODIFICADOS:**
  - `backend/server.js` - Conexión MongoDB
  - `src/config/api.js` - URL de API
  - `src/components/NotificationCenter.jsx` - Socket.IO
  - `vite.config.js` - Proxy configuration

#### Seguridad Mejorada
- **NUEVO:** Archivo `backend/config/security.js`
- **FUNCIONALIDADES:**
  - Rate limiting general (100 requests/15min)
  - Rate limiting específico para login (5 intentos/15min)
  - Configuración de Helmet para headers de seguridad
  - Límites en tamaño de requests (10MB)

#### Configuración de CORS Mejorada
- **ANTES:** Configuración básica de CORS
- **DESPUÉS:** Configuración específica y segura
- **MEJORAS:**
  - Métodos HTTP específicos permitidos
  - Headers permitidos y expuestos
  - Configuración de credenciales
  - Cache de preflight requests

#### Scripts de Desarrollo Mejorados
- **BACKEND:** Agregados scripts de linting
- **FRONTEND:** Agregados scripts de linting
- **ARCHIVOS MODIFICADOS:**
  - `backend/package.json`
  - `package.json`

#### Archivos de Ejemplo
- **NUEVOS:**
  - `backend/env.example` - Variables de entorno del backend
  - `env.example` - Variables de entorno del frontend

### 🔧 Cambios Técnicos Detallados

#### 1. Variables de Entorno Backend
```javascript
// ANTES
mongoose.connect('mongodb://localhost:27017/incident-management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

// DESPUÉS
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/incident-management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
```

#### 2. Variables de Entorno Frontend
```javascript
// ANTES
const API_BASE_URL = 'http://localhost:5000';

// DESPUÉS
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

#### 3. Configuración de CORS
```javascript
// ANTES
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL || 'http://localhost:5174'
        : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
    // configuración básica
};

// DESPUÉS
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? [process.env.FRONTEND_URL]
        : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Length', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400
};
```

#### 4. Middlewares de Seguridad
```javascript
// NUEVO - backend/config/security.js
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // límite de 100 requests por ventana
    message: {
        message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.',
        error: 'RATE_LIMIT_EXCEEDED'
    }
});

const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "ws:", "wss:"],
        },
    },
    crossOriginEmbedderPolicy: false,
});
```

### 📋 Variables de Entorno Requeridas

#### Backend (.env)
```env
# Configuración del servidor
PORT=5000
NODE_ENV=development

# Base de datos
MONGODB_URI=mongodb://localhost:27017/incident-management

# JWT
JWT_SECRET=tu_jwt_secret_super_seguro_aqui_cambiar_en_produccion

# Frontend URL (para CORS)
FRONTEND_URL=http://localhost:5173

# Configuración de logs
LOG_LEVEL=info
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
```

### 🚀 Instrucciones de Instalación

1. **Copiar archivos de ejemplo:**
   ```bash
   cp backend/env.example backend/.env
   cp env.example .env
   ```

2. **Configurar variables de entorno:**
   - Editar `backend/.env` con valores apropiados
   - Editar `.env` con la URL del backend

3. **Instalar dependencias:**
   ```bash
   cd backend && npm install
   cd .. && npm install
   ```

4. **Iniciar aplicación:**
   ```bash
   # Terminal 1
   cd backend && npm run dev
   
   # Terminal 2
   npm run dev
   ```

### 🔍 Beneficios de los Cambios

1. **Flexibilidad:** Configuración adaptable a diferentes entornos
2. **Seguridad:** Protección contra ataques comunes
3. **Mantenibilidad:** Código más limpio y organizado
4. **Escalabilidad:** Preparado para producción
5. **Desarrollo:** Mejores herramientas de desarrollo

### 🐛 Solución de Problemas

#### Error de variables de entorno
- Verificar que los archivos `.env` existan
- Comprobar que las variables estén correctamente definidas

#### Error de CORS
- Verificar `FRONTEND_URL` en backend/.env
- Comprobar que el frontend esté corriendo en el puerto correcto

#### Error de rate limiting
- Los límites están configurados para desarrollo
- Ajustar según necesidades en producción

### 📝 Notas de Migración

- Los cambios son compatibles hacia atrás
- No se requieren cambios en la base de datos
- Las configuraciones por defecto mantienen la funcionalidad actual
- Se recomienda revisar las variables de entorno antes de desplegar 