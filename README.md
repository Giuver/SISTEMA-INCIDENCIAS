# Sistema de Gestión de Incidencias

Un sistema completo para la gestión de incidencias que permite a las organizaciones realizar un seguimiento y gestionar eficientemente los problemas y solicitudes.

## 🚀 Características

- ✅ Gestión completa de incidencias con estados y prioridades
- 📊 Panel de control con métricas y KPIs en tiempo real
- 🔔 Sistema de notificaciones en tiempo real con Socket.IO
- 👥 Gestión de usuarios y roles (Admin, Usuario, Técnico)
- 📝 Registro de auditoría completo
- 🏷️ Categorización de incidencias
- 📱 Interfaz de usuario moderna y responsive
- 🔐 Autenticación JWT segura
- 📈 Gráficos y reportes interactivos
- 📤 Exportación de datos a Excel

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **MongoDB** - Base de datos NoSQL
- **Socket.IO** - Comunicación en tiempo real
- **JWT** - Autenticación segura
- **Mongoose** - ODM para MongoDB
- **Winston** - Logging
- **Multer** - Manejo de archivos
- **Helmet** - Seguridad

### Frontend
- **React 18** - Biblioteca de UI
- **Vite** - Build tool y dev server
- **Material-UI (MUI)** - Componentes de UI
- **Socket.IO Client** - Cliente para tiempo real
- **React Router** - Navegación
- **Recharts** - Gráficos
- **Axios** - Cliente HTTP
- **Notistack** - Notificaciones

## 📋 Requisitos Previos

- Node.js (v16 o superior)
- MongoDB (v5 o superior)
- npm o yarn

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone [URL_DEL_REPOSITORIO]
cd SISTEMA-INCIDENCIAS
```

### 2. Configurar variables de entorno

**Crear archivo `.env` en la carpeta `backend/`:**
```env
# Configuración del servidor
PORT=5000
NODE_ENV=development

# Base de datos
MONGODB_URI=mongodb://localhost:27017/incident-management

# JWT
JWT_SECRET=tu_jwt_secret_super_seguro_aqui

# Frontend URL (para CORS)
FRONTEND_URL=http://localhost:5173

# Configuración de logs
LOG_LEVEL=info
```

### 3. Instalar dependencias

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd ..
npm install
```

### 4. Iniciar la aplicación

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## 📁 Estructura del Proyecto

```
SISTEMA-INCIDENCIAS/
├── backend/                 # Servidor Node.js/Express
│   ├── config/             # Configuraciones
│   │   └── db.js          # Configuración de MongoDB
│   ├── models/             # Modelos de MongoDB
│   │   ├── User.js        # Modelo de usuario
│   │   ├── Incident.js    # Modelo de incidencia
│   │   ├── Category.js    # Modelo de categoría
│   │   ├── Notification.js # Modelo de notificación
│   │   └── Audit.js       # Modelo de auditoría
│   ├── routes/             # Rutas de la API
│   │   ├── users.js       # Rutas de usuarios
│   │   ├── incidents.js   # Rutas de incidencias
│   │   ├── categories.js  # Rutas de categorías
│   │   ├── notifications.js # Rutas de notificaciones
│   │   └── audit.js       # Rutas de auditoría
│   ├── middleware/         # Middlewares
│   │   ├── auth.js        # Autenticación JWT
│   │   └── error.js       # Manejo de errores
│   ├── utils/             # Utilidades
│   │   ├── logger.js      # Sistema de logging
│   │   ├── cache.js       # Sistema de caché
│   │   ├── auditLogger.js # Logger de auditoría
│   │   └── notificationService.js # Servicio de notificaciones
│   └── server.js          # Servidor principal
├── src/                   # Frontend React
│   ├── components/        # Componentes React
│   │   ├── dashboard/     # Componentes del dashboard
│   │   ├── Navbar.jsx     # Barra de navegación
│   │   ├── NotificationCenter.jsx # Centro de notificaciones
│   │   └── PrivateRoute.jsx # Ruta privada
│   ├── pages/            # Páginas de la aplicación
│   │   ├── Dashboard.jsx # Panel principal
│   │   ├── Login.jsx     # Página de login
│   │   ├── Register.jsx  # Página de registro
│   │   ├── IncidentList.jsx # Lista de incidencias
│   │   ├── IncidentForm.jsx # Formulario de incidencias
│   │   ├── IncidentDetail.jsx # Detalle de incidencia
│   │   ├── UserManagement.jsx # Gestión de usuarios
│   │   ├── CategoryAdmin.jsx # Administración de categorías
│   │   ├── Assignments.jsx # Asignaciones
│   │   └── AuditLog.jsx  # Registro de auditoría
│   ├── config/           # Configuraciones
│   │   └── api.js        # Configuración de API
│   ├── utils/            # Utilidades
│   │   ├── validation.js # Validaciones
│   │   ├── notification.js # Utilidades de notificaciones
│   │   └── dashboardUtils.js # Utilidades del dashboard
│   ├── theme.js          # Tema de Material-UI
│   ├── App.jsx           # Componente principal
│   └── main.jsx          # Punto de entrada
├── package.json          # Dependencias del frontend
├── vite.config.js        # Configuración de Vite
└── README.md             # Este archivo
```

## 🔧 Cambios Implementados

### 1. Configuración de Variables de Entorno

**ANTES:**
```javascript
// server.js - Línea 58
mongoose.connect('mongodb://localhost:27017/incident-management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
```

**DESPUÉS:**
```javascript
// server.js - Línea 58
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/incident-management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
```

**CAMBIO:** Uso de variables de entorno para la configuración de MongoDB.

### 2. Configuración de CORS Mejorada

**ANTES:**
```javascript
// server.js - Líneas 25-35
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL || 'http://localhost:5174'
        : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
    // ... resto de configuración
};
```

**DESPUÉS:**
```javascript
// server.js - Líneas 25-35
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

**CAMBIO:** Configuración más segura y específica de CORS.

### 3. Configuración de API Centralizada

**ANTES:**
```javascript
// src/config/api.js - Línea 2
const API_BASE_URL = 'http://localhost:5000';
```

**DESPUÉS:**
```javascript
// src/config/api.js - Línea 2
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

**CAMBIO:** Uso de variables de entorno de Vite para la URL de la API.

### 4. Configuración de Socket.IO Mejorada

**ANTES:**
```javascript
// src/components/NotificationCenter.jsx - Línea 173
socketRef.current = io('http://localhost:5000');
```

**DESPUÉS:**
```javascript
// src/components/NotificationCenter.jsx - Línea 173
socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
```

**CAMBIO:** Uso de variables de entorno para la conexión de Socket.IO.

### 5. Configuración de Vite Mejorada

**ANTES:**
```javascript
// vite.config.js - Líneas 8-12
proxy: {
    '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
    }
}
```

**DESPUÉS:**
```javascript
// vite.config.js - Líneas 8-12
proxy: {
    '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
        secure: false
    }
}
```

**CAMBIO:** Proxy configurado con variables de entorno.

## 🔐 Configuración de Seguridad

### Variables de Entorno Requeridas

**Backend (.env):**
```env
# Configuración del servidor
PORT=5000
NODE_ENV=development

# Base de datos
MONGODB_URI=mongodb://localhost:27017/incident-management

# JWT
JWT_SECRET=tu_jwt_secret_super_seguro_aqui

# Frontend URL (para CORS)
FRONTEND_URL=http://localhost:5173

# Configuración de logs
LOG_LEVEL=info
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:5000
```

## 🚀 Scripts Disponibles

### Backend
```bash
npm start          # Iniciar en producción
npm run dev        # Iniciar en desarrollo con nodemon
npm test           # Ejecutar tests
```

### Frontend
```bash
npm run dev        # Iniciar servidor de desarrollo
npm run build      # Construir para producción
npm run preview    # Previsualizar build de producción
```

## 📊 Funcionalidades del Sistema

### Gestión de Incidencias
- Crear, editar y eliminar incidencias
- Asignar prioridades (Baja, Media, Alta, Crítica)
- Estados de incidencia (Nueva, En Proceso, Resuelta, Cerrada)
- Categorización automática
- Adjuntar archivos
- Comentarios y seguimiento

### Dashboard
- KPIs en tiempo real
- Gráficos de tendencias
- Métricas de rendimiento
- Alertas del sistema
- Acciones rápidas

### Sistema de Usuarios
- Roles: Admin, Usuario, Técnico
- Gestión de permisos
- Perfiles de usuario
- Historial de actividades

### Notificaciones
- Notificaciones en tiempo real
- Diferentes tipos de notificación
- Prioridades configurables
- Centro de notificaciones

### Auditoría
- Registro completo de actividades
- Trazabilidad de cambios
- Reportes de auditoría
- Exportación de logs

## 🐛 Solución de Problemas

### Error de conexión a MongoDB
```bash
# Verificar que MongoDB esté ejecutándose
mongod --version
# Iniciar MongoDB si no está corriendo
mongod
```

### Error de puerto en uso
```bash
# Cambiar puerto en .env
PORT=5001
```

### Error de CORS
- Verificar que FRONTEND_URL esté configurado correctamente
- Asegurar que el frontend esté corriendo en el puerto correcto

### Error de JWT
- Verificar que JWT_SECRET esté configurado
- Limpiar localStorage del navegador

## 📝 Licencia

MIT License - Ver archivo LICENSE para más detalles.

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Para soporte técnico o preguntas:
- Crear un issue en el repositorio
- Contactar al equipo de desarrollo
- Revisar la documentación técnica 