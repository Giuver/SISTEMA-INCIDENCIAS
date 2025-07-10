const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const { auth } = require('./middleware/auth');
const auditRoutes = require('./routes/audit');

// Cargar variables de entorno
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: function (origin, callback) {
            // Permitir peticiones sin origen (como Postman)
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            if (origin && origin.includes('.vercel.app')) {
                return callback(null, true);
            }
            if (origin && (origin.includes('vercel.app') || origin.includes('vercel.com'))) {
                return callback(null, true);
            }
            if (origin && origin.includes('.railway.app')) {
                return callback(null, true);
            }
            console.log('Origen bloqueado por CORS (Socket.IO):', origin);
            return callback(new Error('No permitido por CORS (Socket.IO)'));
        },
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"]
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true
});

// Configuración de CORS que acepta cualquier subdominio de Vercel y Railway
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://sistema-incidencias-tres.vercel.app',
    'https://sistema-incidencias-production.up.railway.app'
];

const corsOptions = {
    origin: function (origin, callback) {
        // Permitir peticiones sin origen (como Postman)
        if (!origin) return callback(null, true);

        // Permitir localhost para desarrollo
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // Permitir cualquier subdominio de vercel.app
        if (origin && origin.includes('.vercel.app')) {
            return callback(null, true);
        }

        // Permitir dominios personalizados de Vercel (si los tienes)
        if (origin && (origin.includes('vercel.app') || origin.includes('vercel.com'))) {
            return callback(null, true);
        }

        // Permitir dominios de Railway
        if (origin && origin.includes('.railway.app')) {
            return callback(null, true);
        }

        console.log('Origen bloqueado por CORS:', origin);
        return callback(new Error('No permitido por CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    credentials: true,
    maxAge: 86400
};
app.use(cors(corsOptions));

// Headers manuales para máxima compatibilidad
app.use((req, res, next) => {
    const origin = req.headers.origin;

    // Aplicar la misma lógica de CORS que en corsOptions
    let allowOrigin = '';
    if (!origin) {
        allowOrigin = '*';
    } else if (allowedOrigins.includes(origin)) {
        allowOrigin = origin;
    } else if (origin && origin.includes('.vercel.app')) {
        allowOrigin = origin;
    } else if (origin && (origin.includes('vercel.app') || origin.includes('vercel.com'))) {
        allowOrigin = origin;
    } else if (origin && origin.includes('.railway.app')) {
        allowOrigin = origin;
    }

    res.header('Access-Control-Allow-Origin', allowOrigin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE, PATCH');
    next();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware para manejar errores de JSON malformado
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            message: 'JSON malformado',
            error: 'INVALID_JSON'
        });
    }
    next();
});

// Almacenar conexiones de usuarios
const userSockets = new Map();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/incident-management';
mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB conectado:', mongoUri))
    .catch(err => console.error('Error de conexión a MongoDB:', err));

// Ruta de prueba para verificar que el servidor funciona
app.get('/api/test', (req, res) => {
    res.json({
        message: 'Servidor funcionando correctamente',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Rutas
app.use('/api/incidents', require('./routes/incidents'));
app.use('/api/users', require('./routes/users'));
app.use('/api/areas', require('./routes/areas'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/audit', auditRoutes);

// La ruta de verificación está en routes/users.js

// Configuración de Socket.IO
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        socket.userId = decoded.user.id;
        next();
    } catch (err) {
        next(new Error('Authentication error'));
    }
});

io.on('connection', (socket) => {
    console.log('Usuario conectado:', socket.id);

    socket.on('authenticate', async (userId) => {
        try {
            const user = await User.findById(userId);
            if (user) {
                socket.userId = userId;
                console.log(`Usuario ${userId} autenticado en socket ${socket.id}`);
            }
        } catch (error) {
            console.error('Error de autenticación:', error);
        }
    });

    socket.on('disconnect', () => {
        if (socket.userId) {
            console.log(`Usuario ${socket.userId} desconectado`);
        }
    });
});

global.sendNotification = (userId, notification) => {
    for (const [id, socket] of io.of('/').sockets) {
        if (socket.userId === userId) {
            socket.emit('newNotification', notification);
        }
    }
};

// Middleware para verificar la conexión a MongoDB
app.use((req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
            message: 'Base de datos no disponible',
            error: 'DB_UNAVAILABLE'
        });
    }
    next();
});

// Middleware para manejar rutas no encontradas
app.use((req, res) => {
    res.status(404).json({
        message: 'Ruta no encontrada',
        error: 'NOT_FOUND'
    });
});

// Servir archivos estáticos en producción (ESTO DEBE IR AL FINAL)
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../dist')));

    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../dist', 'index.html'));
    });
}

const PORT = process.env.PORT || 5001;

// Función para iniciar el servidor
const startServer = async () => {
    try {
        // Iniciar el servidor
        httpServer.listen(PORT, () => {
            console.log(`Servidor corriendo en el puerto ${PORT}`);
        });

        // Manejar errores del servidor HTTP
        httpServer.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`Puerto ${PORT} está en uso`);
                process.exit(1);
            } else {
                console.error('Error en el servidor:', error);
            }
        });

    } catch (error) {
        console.error('Error al iniciar el servidor:', error);
        process.exit(1);
    }
};

// Manejar el cierre del servidor
const gracefulShutdown = async () => {
    console.log('Iniciando cierre controlado...');

    try {
        // Cerrar el servidor HTTP
        await new Promise((resolve) => {
            httpServer.close(resolve);
        });
        console.log('Servidor HTTP cerrado');

        // Cerrar conexión a MongoDB
        await mongoose.connection.close();
        console.log('Conexión a MongoDB cerrada');

        process.exit(0);
    } catch (error) {
        console.error('Error durante el cierre:', error);
        process.exit(1);
    }
};

// Manejar señales de terminación
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
    console.error('Error no capturado:', error);
    gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Promesa rechazada no manejada:', reason);
    gracefulShutdown();
});

// Iniciar el servidor
startServer(); 