const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { auth, authorize } = require('../middleware/auth');
const NotificationService = require('../utils/notificationService');
const { logAudit } = require('../utils/auditLogger');

// Verificar token y obtener usuario (debe ir antes de las rutas con parámetros)
router.get('/verify', auth, async (req, res) => {
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

// Registro de usuario (solo admin)
router.post('/register', auth, authorize('admin'), async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Verificar si el usuario ya existe
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'El usuario ya existe' });
        }

        // Crear nuevo usuario
        user = new User({
            name,
            email,
            password,
            role: role || 'usuario'
        });

        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        // Crear notificación automática
        const creator = await User.findById(req.user.id);
        await NotificationService.createUserCreatedNotification(user, creator);

        // Auditoría
        logAudit({
            user: req.user.id,
            action: 'crear',
            entity: 'User',
            entityId: user._id,
            changes: { name, email, role }
        });
        res.json({ message: 'Usuario creado exitosamente', user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        console.error('Error en /register:', error);
        res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
});

// Login de usuario
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Verificar si el usuario existe
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        // Verificar contraseña
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        // Crear y devolver el token
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
                res.json({ token, role: user.role, userId: user.id });
            }
        );
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Obtener todos los usuarios (solo para administradores)
router.get('/', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtener un usuario específico
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Actualizar un usuario
router.patch('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        const before = { name: user.name, email: user.email, role: user.role };
        if (req.body.name) user.name = req.body.name;
        if (req.body.email) user.email = req.body.email;
        if (req.body.role) user.role = req.body.role;
        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
        }
        const updatedUser = await user.save();
        // Auditoría
        logAudit({
            user: req.user ? req.user.id : null,
            action: 'actualizar',
            entity: 'User',
            entityId: updatedUser._id,
            changes: { before, after: req.body }
        });
        res.json(updatedUser);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Eliminar un usuario
router.delete('/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Crear notificación automática antes de eliminar
        const deletedBy = await User.findById(req.user.id);
        await NotificationService.createUserDeletedNotification(user, deletedBy);

        await user.remove();
        // Auditoría
        logAudit({
            user: req.user.id,
            action: 'eliminar',
            entity: 'User',
            entityId: req.params.id,
            changes: { deleted: true }
        });
        res.json({ message: 'Usuario eliminado' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 