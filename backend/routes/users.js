const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { auth } = require('../middleware/auth');
const { requirePermission, requireAnyPermission } = require('../config/roles');
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

// RUTA TEMPORAL: Crear usuarios sin autenticación (solo para desarrollo)
router.post('/create-initial-users', async (req, res) => {
    try {
        console.log('🚀 Creando usuarios iniciales...');

        // Verificar si ya existen usuarios
        const existingUsers = await User.find();
        if (existingUsers.length > 0) {
            return res.status(400).json({
                message: 'Ya existen usuarios en el sistema',
                users: existingUsers.map(u => ({ email: u.email, role: u.role }))
            });
        }

        // Usuarios a crear
        const users = [
            {
                name: 'Administrador',
                email: 'admin@example.com',
                password: 'admin123',
                role: 'admin'
            },
            {
                name: 'Soporte Técnico',
                email: 'soporte@example.com',
                password: 'soporte123',
                role: 'soporte'
            },
            {
                name: 'Usuario Normal',
                email: 'usuario@example.com',
                password: 'usuario123',
                role: 'usuario'
            }
        ];

        const createdUsers = [];

        for (const userData of users) {
            // Encriptar contraseña
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(userData.password, salt);

            // Crear usuario
            const user = new User({
                name: userData.name,
                email: userData.email,
                password: hashedPassword,
                role: userData.role
            });

            await user.save();
            createdUsers.push({ email: user.email, role: user.role });
            console.log(`✅ Usuario creado: ${userData.email} (${userData.role})`);
        }

        console.log('🎉 Usuarios iniciales creados exitosamente!');

        res.json({
            message: 'Usuarios iniciales creados exitosamente',
            users: createdUsers,
            credentials: {
                admin: 'admin@example.com / admin123',
                soporte: 'soporte@example.com / soporte123',
                usuario: 'usuario@example.com / usuario123'
            }
        });

    } catch (error) {
        console.error('Error creando usuarios iniciales:', error);
        res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
});

// Registro de usuario (solo admin)
router.post('/register', [auth, requirePermission('users:manage')], async (req, res) => {
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

        // --- SOLO PARA PRUEBAS: Aceptar cualquier contraseña ---
        // const isMatch = await bcrypt.compare(password, user.password);
        // if (!isMatch) {
        //     return res.status(400).json({ message: 'Credenciales inválidas' });
        // }
        // --- FIN MODIFICACIÓN ---

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
router.get('/', [auth, requirePermission('users:manage')], async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtener un usuario específico (solo admin o el propio usuario)
router.get('/:id', auth, async (req, res) => {
    try {
        // Verificar permisos
        const isAdmin = req.user.role === 'admin';
        const isOwnUser = req.user.id === req.params.id;

        if (!isAdmin && !isOwnUser) {
            return res.status(403).json({
                message: 'No tienes permisos para ver este usuario',
                error: 'INSUFFICIENT_PERMISSIONS'
            });
        }

        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Actualizar un usuario (solo admin o el propio usuario)
router.patch('/:id', auth, async (req, res) => {
    try {
        // Verificar permisos
        const isAdmin = req.user.role === 'admin';
        const isOwnUser = req.user.id === req.params.id;

        if (!isAdmin && !isOwnUser) {
            return res.status(403).json({
                message: 'No tienes permisos para actualizar este usuario',
                error: 'INSUFFICIENT_PERMISSIONS'
            });
        }

        // Los usuarios no admin solo pueden actualizar su propio nombre y email
        if (!isAdmin && (req.body.role || req.body.password)) {
            return res.status(403).json({
                message: 'No puedes cambiar tu rol o contraseña',
                error: 'INSUFFICIENT_PERMISSIONS'
            });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const before = { name: user.name, email: user.email, role: user.role };

        if (req.body.name) user.name = req.body.name;
        if (req.body.email) user.email = req.body.email;
        if (req.body.role && isAdmin) user.role = req.body.role;
        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
        }

        const updatedUser = await user.save();

        // Auditoría
        logAudit({
            user: req.user.id,
            action: 'editar',
            entity: 'User',
            entityId: updatedUser._id,
            changes: { before, after: req.body }
        });

        res.json(updatedUser);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Eliminar un usuario (solo admin)
router.delete('/:id', [auth, requirePermission('users:manage')], async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Crear notificación automática antes de eliminar
        const deletedBy = await User.findById(req.user.id);
        await NotificationService.createUserDeletedNotification(user, deletedBy);

        await user.deleteOne(); // Usando deleteOne en lugar de remove que está deprecado

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