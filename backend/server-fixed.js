const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const { auth } = require('./middleware/auth');

const app = express();

// Configuración de CORS más permisiva para desarrollo
app.use(cors({
    origin: true, // Permite todos los orígenes en desarrollo
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware para manejar preflight requests
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conectar a MongoDB
mongoose.connect('mongodb://localhost/incidencias', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB conectado: localhost'))
    .catch(err => console.error('Error de conexión a MongoDB:', err));

// Ruta de prueba
app.get('/test', (req, res) => {
    res.json({ message: 'Servidor funcionando correctamente' });
});

// Ruta de verificación de token
app.get('/api/users/verify', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(401).json({
                message: 'Usuario no encontrado',
                error: 'USER_NOT_FOUND'
            });
        }
        res.json({ user });
    } catch (error) {
        console.error('Error al verificar token:', error);
        res.status(500).json({
            message: 'Error al verificar token',
            error: 'TOKEN_VERIFICATION_ERROR'
        });
    }
});

// Ruta de login
app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Verificar si el usuario existe
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        // Verificar contraseña (asumiendo que está hasheada)
        const bcrypt = require('bcryptjs');
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        // Crear token
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    role: user.role,
                    userId: user.id,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    }
                });
            }
        );
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Middleware para manejar rutas no encontradas
app.use((req, res) => {
    res.status(404).json({
        message: 'Ruta no encontrada',
        error: 'NOT_FOUND'
    });
});

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
    console.log(`CORS configurado para permitir todos los orígenes`);
}); 