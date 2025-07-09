# 🚀 Guía de Despliegue para Producción

## 📋 Requisitos Previos

- Node.js 16+ 
- MongoDB Atlas (recomendado) o MongoDB local
- Servidor con al menos 1GB RAM
- Dominio configurado (opcional pero recomendado)

## 🔧 Configuración de Variables de Entorno

### 1. Backend (.env)

```bash
# Copiar el archivo de ejemplo
cp backend/env.example backend/.env

# Editar con tus valores reales
NODE_ENV=production
PORT=5000

# MongoDB Atlas (recomendado)
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# JWT Secret (GENERAR UNO FUERTE)
JWT_SECRET=tu_secreto_super_fuerte_de_al_menos_32_caracteres_aleatorios

# URLs de tu aplicación
FRONTEND_URL=https://tu-dominio-frontend.com
VITE_API_URL=https://tu-backend.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs
```

### 2. Frontend (.env)

```bash
# Crear archivo .env en la raíz del proyecto
NODE_ENV=production
VITE_API_URL=https://tu-backend.com
```

## 🛠️ Instalación y Build

### Backend

```bash
cd backend
npm install
npm run build
```

### Frontend

```bash
npm install
npm run build
```

## 🚀 Opciones de Despliegue

### Opción 1: Despliegue Manual (VPS/Server)

#### Backend
```bash
# Instalar PM2 para gestión de procesos
npm install -g pm2

# Crear archivo ecosystem.config.js
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'incident-backend',
    script: 'server-fixed.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
}
EOF

# Iniciar con PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Frontend (con Nginx)
```bash
# Instalar Nginx
sudo apt update
sudo apt install nginx

# Configurar Nginx
sudo nano /etc/nginx/sites-available/incident-app

# Contenido de la configuración:
server {
    listen 80;
    server_name tu-dominio.com;
    root /var/www/incident-app/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/incident-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Opción 2: Despliegue en la Nube

#### Heroku
```bash
# Crear Procfile
echo "web: node backend/server-fixed.js" > Procfile

# Crear app.json
cat > app.json << EOF
{
  "name": "incident-management",
  "description": "Sistema de gestión de incidencias",
  "repository": "https://github.com/tu-usuario/incident-management",
  "keywords": ["node", "express", "react", "mongodb"],
  "env": {
    "NODE_ENV": "production",
    "MONGODB_URI": {
      "description": "URI de MongoDB Atlas",
      "required": true
    },
    "JWT_SECRET": {
      "description": "Secreto JWT fuerte",
      "required": true
    }
  }
}
EOF
```

#### Vercel (Frontend)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel --prod
```

#### Railway
```bash
# Conectar repositorio a Railway
# Configurar variables de entorno en el dashboard
```

## 🔒 Configuraciones de Seguridad

### 1. Generar JWT Secret Fuerte
```bash
# En Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Configurar HTTPS
```bash
# Obtener certificado SSL con Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

### 3. Firewall
```bash
# Configurar UFW
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 📊 Monitoreo

### 1. Logs
```bash
# Ver logs de PM2
pm2 logs

# Ver logs de Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 2. Métricas
```bash
# Instalar PM2 Plus para monitoreo
pm2 install pm2-server-monit
```

## 🔄 Actualizaciones

### Backend
```bash
cd backend
git pull
npm install
pm2 restart incident-backend
```

### Frontend
```bash
npm run build
# Copiar archivos a /var/www/incident-app/dist/
```

## 🚨 Troubleshooting

### Problemas Comunes

1. **Error de CORS**
   - Verificar FRONTEND_URL en .env
   - Revisar configuración de proxy en Nginx

2. **Error de MongoDB**
   - Verificar MONGODB_URI
   - Comprobar IP whitelist en MongoDB Atlas

3. **Error de JWT**
   - Verificar JWT_SECRET
   - Comprobar expiración de tokens

4. **Error de Rate Limiting**
   - Ajustar RATE_LIMIT_MAX_REQUESTS
   - Verificar configuración de rate limiting

## 📞 Soporte

Para problemas específicos:
1. Revisar logs: `pm2 logs`
2. Verificar variables de entorno
3. Comprobar conectividad de red
4. Revisar configuración de firewall

---

**¡Tu aplicación está lista para producción! 🎉** 