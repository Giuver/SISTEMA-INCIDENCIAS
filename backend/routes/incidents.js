const express = require('express');
const router = express.Router();
const Incident = require('../models/Incident');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const { auth } = require('../middleware/auth');
const { ROLES, requirePermission, requireAnyPermission } = require('../config/roles');
const NotificationService = require('../utils/notificationService');
const { logAudit, logMinorAction, logCriticalAction, AUDIT_ACTIONS } = require('../utils/auditLogger');
const fs = require('fs');

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Asegurarse de que el directorio uploads existe
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generar un nombre de archivo seguro y validado
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const safeExtension = path.extname(file.originalname).toLowerCase();
        cb(null, `incident-${uniqueSuffix}${safeExtension}`);
    }
});

// Validación estricta de archivos
const fileFilter = (req, file, cb) => {
    // Validar tipos de archivo permitidos con MIME types específicos
    const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/vnd.ms-excel', // .xls
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'text/plain',
        'text/csv'
    ];

    // Validar extensión de archivo
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv'];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    // Validar nombre de archivo (evitar caracteres peligrosos)
    const fileName = file.originalname;
    const dangerousChars = /[<>:"/\\|?*]/;

    if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}. Tipos permitidos: ${allowedMimeTypes.join(', ')}`), false);
    }

    if (!allowedExtensions.includes(fileExtension)) {
        return cb(new Error(`Extensión de archivo no permitida: ${fileExtension}. Extensiones permitidas: ${allowedExtensions.join(', ')}`), false);
    }

    if (dangerousChars.test(fileName)) {
        return cb(new Error('El nombre del archivo contiene caracteres no permitidos'), false);
    }

    if (fileName.length > 100) {
        return cb(new Error('El nombre del archivo es demasiado largo (máximo 100 caracteres)'), false);
    }

    // Validar tamaño del archivo (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
        return cb(new Error('El archivo es demasiado grande (máximo 5MB)'), false);
    }

    cb(null, true);
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB límite
        files: 1 // Solo un archivo por incidencia
    }
});

// Middleware para manejar errores de multer
const handleMulterError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                message: 'El archivo es demasiado grande (máximo 5MB)',
                error: 'FILE_TOO_LARGE'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                message: 'Demasiados archivos (máximo 1 archivo por incidencia)',
                error: 'TOO_MANY_FILES'
            });
        }
        return res.status(400).json({
            message: 'Error al subir el archivo',
            error: error.message
        });
    }

    if (error) {
        return res.status(400).json({
            message: error.message,
            error: 'FILE_VALIDATION_ERROR'
        });
    }

    next();
};

// Helper para agregar alias 'estado' a cada incidencia
function addEstadoAlias(incident) {
    if (!incident) return incident;
    const obj = incident.toObject ? incident.toObject() : { ...incident };
    obj.estado = obj.status;
    return obj;
}

// Middleware para filtrar incidencias según el rol del usuario
const filterIncidentsByRole = (req, res, next) => {
    const userRole = req.user.role;

    // Construir filtro según el rol
    let filter = {};

    switch (userRole) {
        case ROLES.ADMIN:
            // Los administradores ven todas las incidencias
            break;
        case ROLES.SOPORTE:
            // Los técnicos ven incidencias asignadas a ellos o sin asignar
            filter = {
                $or: [
                    { assignedTo: req.user.id },
                    { assignedTo: null }
                ]
            };
            break;
        case ROLES.USUARIO:
            // Los usuarios ven todas las incidencias (solo lectura)
            break;
        default:
            return res.status(403).json({
                message: 'Rol no válido',
                error: 'INVALID_ROLE'
            });
    }

    req.incidentFilter = filter;
    next();
};

// Obtener una incidencia específica
router.get('/:id', [auth, requireAnyPermission(['incidents:read:all', 'incidents:read:assigned', 'incidents:read:own'])], async (req, res) => {
    try {
        const incident = await Incident.findById(req.params.id)
            .populate('createdBy', 'name email')
            .populate('assignedTo', 'name email')
            .populate('area', 'name');

        if (!incident) {
            return res.status(404).json({ message: 'Incidencia no encontrada' });
        }

        // Verificar permisos específicos para esta incidencia
        const userRole = req.user.role;
        let canAccess = false;

        switch (userRole) {
            case ROLES.ADMIN:
                canAccess = true; // Los administradores pueden ver todas
                break;
            case ROLES.SOPORTE:
                canAccess = !incident.assignedTo || incident.assignedTo._id.toString() === req.user.id;
                break;
            case ROLES.USUARIO:
                canAccess = incident.createdBy._id.toString() === req.user.id;
                break;
        }

        if (!canAccess) {
            return res.status(403).json({
                message: 'No tienes permiso para ver esta incidencia',
                error: 'INCIDENT_ACCESS_DENIED'
            });
        }

        // Auditoría de visualización
        if (req.user && req.user.id) {
            logMinorAction({
                user: req.user.id,
                action: AUDIT_ACTIONS.INCIDENT_VIEW,
                details: {
                    incidentId: req.params.id,
                    incidentSubject: incident.subject,
                    incidentStatus: incident.status
                },
                ipAddress: req.ip
            });
        }

        res.json(incident);
    } catch (error) {
        console.error('Error obteniendo incidencia:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Obtener todas las incidencias (filtradas por rol)
router.get('/', [auth, filterIncidentsByRole], async (req, res) => {
    try {
        const incidents = await Incident.find(req.incidentFilter)
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        // Asegurarse de que todos los campos necesarios estén presentes
        const safeIncidents = incidents.map(incident => {
            const obj = incident.toObject();
            return {
                ...obj,
                estado: obj.status || 'pendiente',
                assignedTo: obj.assignedTo || null,
                createdBy: obj.createdBy || null,
                category: obj.category || 'Sin categoría',
                priority: obj.priority || 'Media'
            };
        });

        res.json(safeIncidents);
    } catch (error) {
        console.error('Error al obtener incidencias:', error);
        res.status(500).json({
            message: 'Error al obtener las incidencias',
            error: error.message
        });
    }
});

// Obtener estadísticas de incidencias
router.get('/stats', [auth], async (req, res) => {
    try {
        const userRole = req.user.role;
        let filter = {};

        // Filtrar según el rol del usuario
        switch (userRole) {
            case ROLES.ADMIN:
                // Los administradores ven todas las incidencias
                break;
            case ROLES.SOPORTE:
                // Los técnicos ven incidencias asignadas a ellos o sin asignar
                filter = {
                    $or: [
                        { assignedTo: req.user.id },
                        { assignedTo: null }
                    ]
                };
                break;
            case ROLES.USUARIO:
                // Los usuarios solo ven sus propias incidencias
                filter = { createdBy: req.user.id };
                break;
            default:
                return res.status(403).json({
                    message: 'Rol no válido',
                    error: 'INVALID_ROLE'
                });
        }

        const total = await Incident.countDocuments(filter);
        const pendientes = await Incident.countDocuments({ ...filter, status: 'pendiente' });
        const enProceso = await Incident.countDocuments({ ...filter, status: 'en_proceso' });
        const resueltas = await Incident.countDocuments({ ...filter, status: 'resuelto' });

        res.json({
            total,
            pendientes,
            enProceso,
            resueltas
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtener incidencias recientes
router.get('/recent', async (req, res) => {
    try {
        const incidents = await Incident.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('assignedTo', 'name');
        res.json(incidents);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Crear una nueva incidencia
router.post('/', auth, upload.single('attachment'), handleMulterError, async (req, res) => {
    try {
        const { subject, description, area, priority, assignedTo, tags } = req.body;

        // Validar campos requeridos
        if (!subject || !description || !area || !priority) {
            return res.status(400).json({
                message: 'Todos los campos son obligatorios',
                error: 'MISSING_FIELDS'
            });
        }

        const incident = new Incident({
            subject,
            description,
            area,
            priority,
            status: 'pendiente',
            createdBy: req.user.id,
            assignedTo: Array.isArray(assignedTo) ? assignedTo : assignedTo ? [assignedTo] : [],
            tags: Array.isArray(tags) ? tags : tags ? [tags] : [],
            attachment: req.file ? `/uploads/${req.file.filename}` : null,
            history: [{
                user: req.user.id,
                action: 'Creación',
                comment: 'Incidencia registrada',
                date: new Date()
            }]
        });

        const newIncident = await incident.save();

        // Crear notificación automática
        const creator = await User.findById(req.user.id);
        await NotificationService.createIncidentCreatedNotification(newIncident, creator);

        // Notificar a todos los asignados
        if (incident.assignedTo.length > 0) {
            const assignedUsers = await User.find({ _id: { $in: incident.assignedTo } });
            const assignedBy = await User.findById(req.user.id);
            await NotificationService.createIncidentAssignedNotification(incident, assignedUsers, assignedBy);
        }

        // Auditoría
        if (req.user && req.user.id) {
            logAudit({
                user: req.user.id,
                action: AUDIT_ACTIONS.INCIDENT_CREATE,
                entity: 'Incident',
                entityId: newIncident._id,
                changes: { subject, description, area, priority },
                details: {
                    assignedTo: incident.assignedTo.length,
                    hasAttachment: !!req.file,
                    attachmentType: req.file ? req.file.mimetype : null,
                    tagsCount: incident.tags.length
                },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                priority: 'high'
            });
        }

        res.status(201).json(newIncident);
    } catch (error) {
        console.error('Error al crear incidencia:', error);

        // Si hubo un error y se subió un archivo, eliminarlo
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
                console.error('Error al eliminar archivo:', unlinkError);
            }
        }

        res.status(500).json({
            message: 'Error al crear la incidencia',
            error: error.message
        });
    }
});

// Actualizar una incidencia
router.patch('/:id', [auth, requireAnyPermission(['incidents:update:all', 'incidents:update:assigned'])], upload.single('attachment'), handleMulterError, async (req, res) => {
    try {
        const incident = await Incident.findById(req.params.id);
        if (!incident) {
            return res.status(404).json({ message: 'Incidencia no encontrada' });
        }

        const before = {
            status: incident.status,
            assignedTo: incident.assignedTo,
            solution: incident.solution
        };

        // Si la incidencia se marca como resuelta, se cierra automáticamente después de 24 horas
        if (req.body.status === 'resuelto' && incident.status !== 'resuelto') {
            incident.status = 'resuelto';
            incident.resolvedAt = new Date();

            // Programar el cierre automático después de 24 horas
            setTimeout(async () => {
                try {
                    const resolvedIncident = await Incident.findById(req.params.id);
                    if (resolvedIncident && resolvedIncident.status === 'resuelto') {
                        resolvedIncident.status = 'cerrado';
                        await resolvedIncident.save();

                        // Registrar en el historial
                        resolvedIncident.history.push({
                            user: req.user ? req.user.id : 'system',
                            action: 'Cierre Automático',
                            comment: 'Incidencia cerrada automáticamente después de 24 horas de ser resuelta',
                            date: new Date()
                        });

                        // Auditoría del cierre automático
                        logAudit({
                            user: 'system',
                            action: 'cerrar_automatico',
                            entity: 'Incident',
                            entityId: resolvedIncident._id,
                            changes: { status: 'cerrado' }
                        });
                    }
                } catch (error) {
                    console.error('Error en cierre automático:', error);
                }
            }, 24 * 60 * 60 * 1000); // 24 horas
        }

        // Actualizar otros campos
        if (req.body.status && req.body.status !== 'resuelto') incident.status = req.body.status;
        if (req.body.area) incident.area = req.body.area;
        if (req.body.assignedTo) incident.assignedTo = Array.isArray(req.body.assignedTo) ? req.body.assignedTo : req.body.assignedTo ? [req.body.assignedTo] : [];
        if (req.body.solution) incident.solution = req.body.solution;
        if (req.body.tags !== undefined) {
            let tags = req.body.tags;
            if (typeof tags === 'string') tags = [tags];
            incident.tags = Array.isArray(tags) ? tags : tags ? [tags] : [];
        }

        // En el endpoint PATCH /:id, reemplazar el push al historial:
        if (req.user && req.user.id) {
            incident.history.push({
                user: req.user.id,
                action: 'Actualización',
                comment: `Estado actualizado a: ${incident.status}`,
                date: new Date()
            });
        }

        const updatedIncident = await incident.save();

        // Auditoría
        if (req.user && req.user.id) {
            logAudit({
                user: req.user.id,
                action: AUDIT_ACTIONS.INCIDENT_UPDATE,
                entity: 'Incident',
                entityId: updatedIncident._id,
                changes: { before, after: req.body },
                details: {
                    statusChanged: before.status !== updatedIncident.status,
                    assignedChanged: JSON.stringify(before.assignedTo) !== JSON.stringify(updatedIncident.assignedTo),
                    hasAttachment: !!req.file,
                    attachmentType: req.file ? req.file.mimetype : null
                },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                priority: 'normal'
            });
        }

        res.json(addEstadoAlias(updatedIncident));
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Eliminar una incidencia
router.delete('/:id', [auth, requirePermission('incidents:delete')], async (req, res) => {
    try {
        const incident = await Incident.findById(req.params.id);
        if (!incident) {
            return res.status(404).json({ message: 'Incidencia no encontrada' });
        }
        await incident.remove();

        // Auditoría
        if (req.user && req.user.id) {
            logCriticalAction({
                user: req.user.id,
                action: AUDIT_ACTIONS.INCIDENT_DELETE,
                entity: 'Incident',
                entityId: req.params.id,
                changes: { deleted: true },
                details: {
                    incidentSubject: incident.subject,
                    incidentStatus: incident.status,
                    hasAttachment: !!incident.attachment
                }
            });
        }
        res.json({ message: 'Incidencia eliminada' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Asignar incidencia a un usuario de soporte
router.patch('/:id/asignar', [auth, requirePermission('incidents:assign')], async (req, res) => {
    try {
        const incident = await Incident.findById(req.params.id);
        if (!incident) return res.status(404).json({ message: 'Incidencia no encontrada' });
        const previousAssigned = incident.assignedTo;
        incident.assignedTo = Array.isArray(req.body.assignedTo) ? req.body.assignedTo : req.body.assignedTo ? [req.body.assignedTo] : [];
        incident.history.push({
            user: req.user.id,
            action: 'Asignación',
            comment: `Asignada a usuarios ${incident.assignedTo.join(', ')}`,
            date: new Date()
        });
        const updatedIncident = await incident.save();

        // Notificar a todos los asignados
        if (incident.assignedTo.length > 0) {
            const assignedUsers = await User.find({ _id: { $in: incident.assignedTo } });
            const assignedBy = await User.findById(req.user.id);
            await NotificationService.createIncidentAssignedNotification(incident, assignedUsers, assignedBy);
        }

        // Auditoría
        if (req.user && req.user.id) {
            logAudit({
                user: req.user.id,
                action: AUDIT_ACTIONS.INCIDENT_ASSIGN,
                entity: 'Incident',
                entityId: updatedIncident._id,
                changes: { from: previousAssigned, to: req.body.assignedTo },
                details: {
                    assignedCount: incident.assignedTo.length,
                    previousCount: previousAssigned.length
                },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                priority: 'normal'
            });
        }
        res.json(updatedIncident);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Cambiar estado de la incidencia (en_proceso, resuelto, cerrado)
router.patch('/:id/estado', [auth, requireAnyPermission(['incidents:update:all', 'incidents:update:assigned'])], async (req, res) => {
    try {
        const incident = await Incident.findById(req.params.id);
        if (!incident) return res.status(404).json({ message: 'Incidencia no encontrada' });
        const previousStatus = incident.status;
        const { status, comment } = req.body;

        // Control de permisos granulares
        const userRole = req.user?.role;
        if ((status === 'resuelto' || status === 'cerrado') && !(userRole === 'admin' || userRole === 'soporte')) {
            return res.status(403).json({ message: 'Solo soporte o admin pueden cerrar o resolver incidencias.' });
        }

        if (status) incident.status = status;
        if (req.body.solution) incident.solution = req.body.solution;
        const updatedIncident = await incident.save();

        // Crear notificación automática si cambió el estado
        if (status && status !== previousStatus) {
            const changedBy = await User.findById(req.user.id);
            await NotificationService.createStatusChangedNotification(updatedIncident, status, changedBy);

            // Notificación especial si se resolvió
            if (status === 'resuelto') {
                await NotificationService.createIncidentResolvedNotification(updatedIncident, changedBy);
            }
        }

        // Auditoría
        logAudit({
            user: req.user.id,
            action: 'cambiar_estado',
            entity: 'Incident',
            entityId: incident._id,
            changes: { from: previousStatus, to: status }
        });
        res.json(addEstadoAlias(updatedIncident));
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Obtener comentarios de una incidencia
router.get('/:id/comentarios', auth, async (req, res) => {
    try {
        const incident = await Incident.findById(req.params.id).populate('comments.user', 'name email');
        if (!incident) return res.status(404).json({ message: 'Incidencia no encontrada' });
        res.json(incident.comments || []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Agregar comentario a una incidencia
router.post('/:id/comentarios', auth, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || text.trim().length < 2) {
            return res.status(400).json({ message: 'El comentario no puede estar vacío.' });
        }
        const incident = await Incident.findById(req.params.id);
        if (!incident) return res.status(404).json({ message: 'Incidencia no encontrada' });
        const comment = {
            user: req.user.id,
            text,
            date: new Date()
        };
        incident.comments.push(comment);
        await incident.save();
        await incident.populate('comments.user', 'name email');
        res.status(201).json(incident.comments[incident.comments.length - 1]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Descargar archivo adjunto
router.get('/:id/attachment', auth, async (req, res) => {
    try {
        const incident = await Incident.findById(req.params.id);

        if (!incident) {
            return res.status(404).json({ message: 'Incidencia no encontrada' });
        }

        if (!incident.attachment) {
            return res.status(404).json({ message: 'No hay archivo adjunto' });
        }

        // Auditoría de descarga de archivo
        if (req.user && req.user.id) {
            logMinorAction({
                user: req.user.id,
                action: AUDIT_ACTIONS.INCIDENT_ATTACHMENT_DOWNLOAD,
                details: {
                    incidentId: req.params.id,
                    incidentSubject: incident.subject,
                    fileName: incident.attachment.split('/').pop()
                },
                ipAddress: req.ip
            });
        }

        const filePath = path.join(__dirname, '..', incident.attachment);
        res.download(filePath);
    } catch (error) {
        console.error('Error descargando archivo:', error);
        res.status(500).json({ message: 'Error al descargar el archivo' });
    }
});

module.exports = router; 