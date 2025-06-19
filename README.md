# Sistema de Gestión de Incidencias

Este es un sistema completo para la gestión de incidencias que permite a las organizaciones realizar un seguimiento y gestionar eficientemente los problemas y solicitudes.

## Características

- Gestión completa de incidencias
- Panel de control con métricas y KPIs
- Sistema de notificaciones en tiempo real
- Gestión de usuarios y roles
- Registro de auditoría
- Categorización de incidencias
- Interfaz de usuario moderna y responsive

## Tecnologías Utilizadas

### Backend
- Node.js
- Express
- MongoDB
- Socket.IO
- JWT para autenticación

### Frontend
- React
- Vite
- Material-UI
- Socket.IO Client
- React Router

## Requisitos Previos

- Node.js (v14 o superior)
- MongoDB
- npm o yarn

## Instalación

1. Clonar el repositorio:
```bash
git clone [URL_DEL_REPOSITORIO]
```

2. Instalar dependencias del backend:
```bash
cd backend
npm install
```

3. Instalar dependencias del frontend:
```bash
cd ..
npm install
```

4. Configurar variables de entorno:
- Crear archivo `.env` en la carpeta backend
- Definir las variables necesarias (MongoDB URI, JWT Secret, etc.)

5. Iniciar el servidor de desarrollo:

Backend:
```bash
cd backend
node server.js
```

Frontend:
```bash
npm run dev
```

## Estructura del Proyecto

- `/backend`: Servidor Node.js/Express
  - `/config`: Configuraciones
  - `/models`: Modelos de MongoDB
  - `/routes`: Rutas de la API
  - `/middleware`: Middlewares
  - `/utils`: Utilidades

- `/src`: Frontend React
  - `/components`: Componentes React
  - `/pages`: Páginas de la aplicación
  - `/utils`: Utilidades
  - `/config`: Configuraciones

## Licencia

MIT 