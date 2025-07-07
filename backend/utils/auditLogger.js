const Audit = require('../models/Audit');
const path = require('path'); // Added for file logging
const mongoose = require('mongoose'); // Added for ObjectId generation

// Tipos de acciones extendidas para auditoría
const AUDIT_ACTIONS = {
    // Acciones de incidencias
    INCIDENT_CREATE: 'crear_incidencia',
    INCIDENT_UPDATE: 'actualizar_incidencia',
    INCIDENT_DELETE: 'eliminar_incidencia',
    INCIDENT_ASSIGN: 'asignar_incidencia',
    INCIDENT_STATUS_CHANGE: 'cambiar_estado_incidencia',
    INCIDENT_COMMENT: 'comentar_incidencia',
    INCIDENT_ATTACHMENT_UPLOAD: 'subir_adjunto',
    INCIDENT_ATTACHMENT_DELETE: 'eliminar_adjunto',
    INCIDENT_ATTACHMENT_DOWNLOAD: 'descargar_adjunto',
    INCIDENT_VIEW: 'ver_incidencia',
    INCIDENT_EXPORT: 'exportar_incidencias',

    // Acciones de usuarios
    USER_CREATE: 'crear_usuario',
    USER_UPDATE: 'actualizar_usuario',
    USER_DELETE: 'eliminar_usuario',
    USER_LOGIN: 'iniciar_sesion',
    USER_LOGOUT: 'cerrar_sesion',
    USER_PASSWORD_CHANGE: 'cambiar_contraseña',

    // Acciones de áreas
    AREA_CREATE: 'crear_area',
    AREA_UPDATE: 'actualizar_area',
    AREA_DELETE: 'eliminar_area',

    // Acciones de notificaciones
    NOTIFICATION_CREATE: 'crear_notificacion',
    NOTIFICATION_READ: 'leer_notificacion',
    NOTIFICATION_DELETE: 'eliminar_notificacion',

    // Acciones de sistema
    SYSTEM_BACKUP: 'respaldo_sistema',
    SYSTEM_MAINTENANCE: 'mantenimiento_sistema',
    SYSTEM_ERROR: 'error_sistema',

    // Acciones de auditoría
    AUDIT_VIEW: 'ver_auditoria',
    AUDIT_EXPORT: 'exportar_auditoria'
};

async function logAudit({
    user,
    action,
    entity,
    entityId,
    changes,
    details = null,
    ipAddress = null,
    userAgent = null,
    sessionId = null,
    priority = 'normal' // normal, high, critical
}) {
    try {
        // Validar campos requeridos
        if (!action) {
            console.error('Error de auditoría: acción requerida');
            return;
        }

        if (!entity) {
            console.error('Error de auditoría: entidad requerida');
            return;
        }

        // Manejar casos especiales para user
        let validUser = user;
        if (!user || user === 'system' || user === 'null') {
            // Para acciones del sistema, usar un ObjectId por defecto
            validUser = new mongoose.Types.ObjectId('000000000000000000000000');
        } else if (typeof user === 'string') {
            // Si es un string válido de ObjectId, convertirlo
            if (mongoose.Types.ObjectId.isValid(user)) {
                validUser = new mongoose.Types.ObjectId(user);
            } else {
                console.warn('Error de auditoría: user no es un ObjectId válido:', user);
                return;
            }
        }

        // Manejar casos especiales para entityId
        let validEntityId = entityId;
        if (!entityId || entityId === 'null') {
            // Para acciones sin entidad específica, usar un ObjectId por defecto
            validEntityId = new mongoose.Types.ObjectId('000000000000000000000000');
        } else if (typeof entityId === 'string') {
            // Si es un string válido de ObjectId, convertirlo
            if (mongoose.Types.ObjectId.isValid(entityId)) {
                validEntityId = new mongoose.Types.ObjectId(entityId);
            } else {
                console.warn('Error de auditoría: entityId no es un ObjectId válido:', entityId);
                return;
            }
        }

        const auditEntry = {
            user: validUser,
            action,
            entity,
            entityId: validEntityId,
            changes: changes || {},
            details: details || {},
            ipAddress,
            userAgent,
            sessionId,
            priority,
            timestamp: new Date(),
            // Añadir metadatos adicionales
            metadata: {
                actionType: AUDIT_ACTIONS[action] || action,
                severity: priority === 'critical' ? 'high' : priority === 'high' ? 'medium' : 'low',
                source: 'api'
            }
        };

        await Audit.create(auditEntry);

        // Log adicional para acciones críticas
        if (priority === 'critical') {
            console.warn(`🔴 AUDITORÍA CRÍTICA: ${action} en ${entity} por usuario ${user}`);
        }

    } catch (err) {
        // No lanzar error para no afectar la funcionalidad principal
        console.error('Error registrando auditoría:', err);

        // Intentar registrar en un archivo de log si es posible
        try {
            const fs = require('fs');
            const logEntry = {
                timestamp: new Date().toISOString(),
                error: err.message,
                auditData: { user, action, entity, entityId }
            };

            fs.appendFileSync(
                path.join(__dirname, '../logs/audit-errors.log'),
                JSON.stringify(logEntry) + '\n'
            );
        } catch (logError) {
            console.error('Error escribiendo log de auditoría:', logError);
        }
    }
}

// Función helper para auditoría de acciones menores
async function logMinorAction({ user, action, details = null, ipAddress = null }) {
    try {
        // Para acciones menores, no requerimos entityId
        const auditEntry = {
            user: user && user !== 'system' ? new mongoose.Types.ObjectId(user) : new mongoose.Types.ObjectId('000000000000000000000000'),
            action,
            entity: 'System',
            entityId: new mongoose.Types.ObjectId('000000000000000000000000'), // Generar un ID único
            changes: {},
            details: details || {},
            ipAddress,
            priority: 'normal',
            timestamp: new Date(),
            metadata: {
                actionType: AUDIT_ACTIONS[action] || action,
                severity: 'low',
                source: 'api'
            }
        };

        await Audit.create(auditEntry);
    } catch (err) {
        console.error('Error registrando auditoría menor:', err);
    }
}

// Función helper para auditoría crítica
async function logCriticalAction({ user, action, entity, entityId, changes, details = null }) {
    return logAudit({
        user,
        action,
        entity,
        entityId,
        changes,
        details,
        priority: 'critical'
    });
}

module.exports = {
    logAudit,
    logMinorAction,
    logCriticalAction,
    AUDIT_ACTIONS
}; 