// Definición de roles y permisos
const ROLES = {
    ADMIN: 'admin',
    SOPORTE: 'soporte',
    USUARIO: 'usuario'
};

// Permisos por rol
const PERMISSIONS = {
    [ROLES.ADMIN]: {
        name: 'Administrador',
        description: 'Acceso completo al sistema',
        permissions: [
            'incidents:read:all',
            'incidents:create',
            'incidents:update:all',
            'incidents:delete',
            'incidents:assign',
            'users:manage',
            'areas:manage',
            'audit:read',
            'notifications:read:all',
            'reports:view',
            'dashboard:admin'
        ]
    },
    [ROLES.SOPORTE]: {
        name: 'Técnico de Soporte',
        description: 'Gestiona incidencias asignadas y sin asignar',
        permissions: [
            'incidents:read:assigned',
            'incidents:read:unassigned',
            'incidents:create',
            'incidents:update:assigned',
            'incidents:comment',
            'notifications:read:own',
            'dashboard:support'
        ]
    },
    [ROLES.USUARIO]: {
        name: 'Usuario',
        description: 'Usuario final del sistema',
        permissions: [
            'incidents:read:all',
            'incidents:create',
            'notifications:read:own',
            'dashboard:user'
        ]
    }
};

// Funciones de verificación de permisos
const hasPermission = (userRole, permission) => {
    const rolePermissions = PERMISSIONS[userRole];
    return rolePermissions && rolePermissions.permissions.includes(permission);
};

const hasAnyPermission = (userRole, permissions) => {
    return permissions.some(permission => hasPermission(userRole, permission));
};

const hasAllPermissions = (userRole, permissions) => {
    return permissions.every(permission => hasPermission(userRole, permission));
};

// Middleware para verificar permisos específicos
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: 'Usuario no autenticado',
                error: 'AUTH_NO_USER'
            });
        }

        if (!hasPermission(req.user.role, permission)) {
            return res.status(403).json({
                message: 'No tienes permiso para realizar esta acción',
                error: 'AUTH_INSUFFICIENT_PERMISSIONS',
                requiredPermission: permission,
                userRole: req.user.role
            });
        }

        next();
    };
};

// Middleware para verificar múltiples permisos (cualquiera)
const requireAnyPermission = (permissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: 'Usuario no autenticado',
                error: 'AUTH_NO_USER'
            });
        }

        if (!hasAnyPermission(req.user.role, permissions)) {
            return res.status(403).json({
                message: 'No tienes permiso para realizar esta acción',
                error: 'AUTH_INSUFFICIENT_PERMISSIONS',
                requiredPermissions: permissions,
                userRole: req.user.role
            });
        }

        next();
    };
};

// Middleware para verificar múltiples permisos (todos)
const requireAllPermissions = (permissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: 'Usuario no autenticado',
                error: 'AUTH_NO_USER'
            });
        }

        if (!hasAllPermissions(req.user.role, permissions)) {
            return res.status(403).json({
                message: 'No tienes permiso para realizar esta acción',
                error: 'AUTH_INSUFFICIENT_PERMISSIONS',
                requiredPermissions: permissions,
                userRole: req.user.role
            });
        }

        next();
    };
};

module.exports = {
    ROLES,
    PERMISSIONS,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    requirePermission,
    requireAnyPermission,
    requireAllPermissions
}; 