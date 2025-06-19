const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    // Si la ruta es pública, permitir el acceso
    if (req.path === '/' && req.method === 'GET') {
        return next();
    }

    try {
        // Obtener el token del header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                message: 'No hay token de autenticación',
                error: 'AUTH_NO_TOKEN'
            });
        }

        try {
            // Verificar el token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            req.user = decoded.user;
            next();
        } catch (error) {
            console.error('Error al verificar token:', error);
            return res.status(401).json({
                message: 'Token no válido o expirado',
                error: 'AUTH_INVALID_TOKEN'
            });
        }
    } catch (error) {
        console.error('Error de autenticación:', error);
        return res.status(500).json({
            message: 'Error en el servidor durante la autenticación',
            error: 'AUTH_SERVER_ERROR'
        });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: 'Usuario no autenticado',
                error: 'AUTH_NO_USER'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: 'No tienes permiso para realizar esta acción',
                error: 'AUTH_INSUFFICIENT_PERMISSIONS'
            });
        }

        next();
    };
};

module.exports = { auth, authorize }; 