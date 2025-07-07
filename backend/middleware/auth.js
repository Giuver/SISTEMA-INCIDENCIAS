const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    console.log('🟠 Entrando al middleware auth (inicio absoluto)');
    console.log('🟢 Entrando al middleware auth para la ruta:', req.originalUrl);
    const authHeader = req.header('Authorization');
    console.log('🟡 Header Authorization recibido:', authHeader);
    const token = authHeader?.replace('Bearer ', '');
    console.log('🔑 Token recibido (middleware auth):', token);
    if (!token) {
        return res.status(401).json({
            message: 'No se proporcionó token de autenticación',
            error: 'AUTH_NO_TOKEN'
        });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        console.log('🪪 Token decodificado:', decoded);
        if (!decoded.user || !decoded.user.id || !decoded.user.role) {
            return res.status(401).json({
                message: 'Token inválido: datos de usuario incompletos',
                error: 'AUTH_INVALID_TOKEN_DATA'
            });
        }
        const user = await User.findById(decoded.user.id);
        console.log('👤 Usuario encontrado en BD:', user);
        if (!user) {
            return res.status(401).json({
                message: 'Usuario no encontrado en la base de datos',
                error: 'AUTH_USER_NOT_FOUND'
            });
        }
        req.user = user;
        next();
    } catch (error) {
        console.error('❌ Error al verificar token:', error.message);
        return res.status(401).json({
            message: 'Token inválido o expirado',
            error: 'AUTH_INVALID_TOKEN'
        });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        console.log('🔐 Entrando al middleware authorize');
        console.log('👤 Usuario en req.user:', req.user);
        console.log('🎭 Roles del usuario:', req.user?.role);
        console.log('📋 Roles requeridos:', roles);

        if (!req.user) {
            console.error('❌ req.user no está definido en authorize');
            return res.status(401).json({
                message: 'Usuario no autenticado',
                error: 'AUTH_NO_USER'
            });
        }

        if (!req.user.role) {
            console.error('❌ req.user.role no está definido:', req.user);
            return res.status(401).json({
                message: 'Rol de usuario no definido',
                error: 'AUTH_NO_ROLE'
            });
        }

        // Verificar si el rol del usuario está en la lista de roles permitidos
        const hasPermission = roles.includes(req.user.role);
        console.log('✅ ¿Tiene permiso?', hasPermission);

        if (!hasPermission) {
            console.error('❌ Rol no autorizado:', req.user.role, 'Roles requeridos:', roles);
            return res.status(403).json({
                message: 'No tienes permiso para realizar esta acción',
                error: 'AUTH_INSUFFICIENT_PERMISSIONS',
                userRole: req.user.role,
                requiredRoles: roles
            });
        }

        console.log('✅ Autorización exitosa para rol:', req.user.role);
        next();
    };
};

module.exports = { auth, authorize }; 