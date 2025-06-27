# 🚀 Configuración Rápida del Sistema de Incidencias

## ⚡ Instalación Express (5 minutos)

### 1. Configurar Variables de Entorno

**Backend:**
```bash
# Copiar archivo de ejemplo
cp backend/env.example backend/.env

# Editar el archivo backend/.env con tus configuraciones
```

**Frontend:**
```bash
# Copiar archivo de ejemplo
cp env.example .env

# Editar el archivo .env con la URL del backend
```

### 2. Instalar Dependencias

```bash
# Backend
cd backend
npm install

# Frontend
cd ..
npm install
```

### 3. Iniciar la Aplicación

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### 4. Acceder a la Aplicación

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000

## 🔧 Configuración Avanzada

### Variables de Entorno Importantes

#### Backend (.env)
```env
# Cambiar en producción
JWT_SECRET=tu_jwt_secret_super_seguro_aqui_cambiar_en_produccion

# URL del frontend para CORS
FRONTEND_URL=http://localhost:5173

# Base de datos
MONGODB_URI=mongodb://localhost:27017/incident-management
```

#### Frontend (.env)
```env
# URL del backend
VITE_API_URL=http://localhost:5000
```

## 🐛 Problemas Comunes

### Error: "MongoDB no conectado"
```bash
# Verificar que MongoDB esté ejecutándose
mongod --version
# Si no está corriendo, iniciar MongoDB
mongod
```

### Error: "Puerto en uso"
```bash
# Cambiar puerto en backend/.env
PORT=5001

# Cambiar en frontend/.env
VITE_API_URL=http://localhost:5001
```

### Error: "CORS"
- Verificar que `FRONTEND_URL` en backend/.env coincida con la URL del frontend
- Asegurar que ambos servidores estén corriendo

## 📋 Checklist de Configuración

- [ ] MongoDB instalado y ejecutándose
- [ ] Archivos `.env` creados y configurados
- [ ] Dependencias instaladas (backend y frontend)
- [ ] Servidor backend iniciado en puerto 5000
- [ ] Servidor frontend iniciado en puerto 5173
- [ ] Aplicación accesible en http://localhost:5173

## 🚀 Scripts Útiles

### Backend
```bash
npm run dev      # Desarrollo con nodemon
npm start        # Producción
npm test         # Tests
npm run lint     # Linting
```

### Frontend
```bash
npm run dev      # Desarrollo
npm run build    # Construir para producción
npm run preview  # Previsualizar build
npm run lint     # Linting
```

## 📞 Soporte

Si tienes problemas:
1. Revisar la documentación completa en `README.md`
2. Verificar el `CHANGELOG.md` para cambios recientes
3. Comprobar que todas las variables de entorno estén configuradas
4. Verificar que MongoDB esté ejecutándose

¡Listo! Tu sistema de incidencias debería estar funcionando correctamente. 🎉 