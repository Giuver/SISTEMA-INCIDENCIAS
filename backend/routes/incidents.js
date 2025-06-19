const express = require('express');
const router = express.Router();
const Incident = require('../models/Incident');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const { auth } = require('../middleware/auth');
const NotificationService = require('../utils/notificationService');
const { logAudit } = require('../utils/auditLogger');
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
        // Generar un nombre de archivo seguro
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Validar tipos de archivo permitidos
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no permitido'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB límite
    }
});

// Helper para agregar alias 'estado' a cada incidencia
function addEstadoAlias(incident) {
    if (!incident) return incident;
    const obj = incident.toObject ? incident.toObject() : { ...incident };
    obj.estado = obj.status;
    return obj;
}

// Obtener todas las incidencias
router.get('/', auth, async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({
                message: 'No hay token de autenticación',
                error: 'AUTH_NO_TOKEN'
            });
        }

        const incidents = await Incident.find()
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
router.get('/stats', async (req, res) => {
    try {
        const total = await Incident.countDocuments();
        const pendientes = await Incident.countDocuments({ status: 'pendiente' });
        const enProceso = await Incident.countDocuments({ status: 'en_proceso' });
        const resueltas = await Incident.countDocuments({ status: 'resuelto' });

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
router.post('/', auth, upload.single('attachment'), async (req, res) => {
    try {
        const { subject, description, category, priority } = req.body;

        // Validar campos requeridos
        if (!subject || !description || !category || !priority) {
            return res.status(400).json({
                message: 'Todos los campos son obligatorios',
                error: 'MISSING_FIELDS'
            });
        }

        const incident = new Incident({
            subject,
            description,
            category,
            priority,
            status: 'pendiente',
            createdBy: req.user.id,
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

        // Auditoría
        logAudit({
            user: req.user.id,
            action: 'crear',
            entity: 'Incident',
            entityId: newIncident._id,
            changes: { subject, description, category, priority }
        });

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

// Obtener una incidencia específica
router.get('/:id', async (req, res) => {
    try {
        const incident = await Incident.findById(req.params.id)
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email');
        if (incident) {
            res.json(addEstadoAlias(incident));
        } else {
            res.status(404).json({ message: 'Incidencia no encontrada' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Actualizar una incidencia
router.patch('/:id', async (req, res) => {
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
        if (req.body.assignedTo) incident.assignedTo = req.body.assignedTo;
        if (req.body.solution) incident.solution = req.body.solution;

        // Registrar en el historial
        incident.history.push({
            user: req.user ? req.user.id : 'system',
            action: 'Actualización',
            comment: `Estado actualizado a: ${incident.status}`,
            date: new Date()
        });

        const updatedIncident = await incident.save();

        // Auditoría
        logAudit({
            user: req.user ? req.user.id : null,
            action: 'actualizar',
            entity: 'Incident',
            entityId: updatedIncident._id,
            changes: { before, after: req.body }
        });

        res.json(addEstadoAlias(updatedIncident));
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Eliminar una incidencia
router.delete('/:id', async (req, res) => {
    try {
        const incident = await Incident.findById(req.params.id);
        if (!incident) {
            return res.status(404).json({ message: 'Incidencia no encontrada' });
        }
        await incident.remove();

        // Auditoría
        logAudit({
            user: req.user ? req.user.id : null,
            action: 'eliminar',
            entity: 'Incident',
            entityId: req.params.id,
            changes: { deleted: true }
        });
        res.json({ message: 'Incidencia eliminada' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Asignar incidencia a un usuario de soporte
router.patch('/:id/asignar', auth, async (req, res) => {
    try {
        const incident = await Incident.findById(req.params.id);
        if (!incident) return res.status(404).json({ message: 'Incidencia no encontrada' });
        const previousAssigned = incident.assignedTo;
        incident.assignedTo = req.body.assignedTo;
        incident.history.push({
            user: req.user.id,
            action: 'Asignación',
            comment: `Asignada a usuario ${req.body.assignedTo}`,
            date: new Date()
        });
        const updatedIncident = await incident.save();

        // Crear notificación automática si se asignó a alguien
        if (req.body.assignedTo && req.body.assignedTo !== previousAssigned) {
            const assignedUser = await User.findById(req.body.assignedTo);
            const assignedBy = await User.findById(req.user.id);
            await NotificationService.createIncidentAssignedNotification(updatedIncident, assignedUser, assignedBy);
        }

        // Auditoría
        logAudit({
            user: req.user.id,
            action: 'asignar',
            entity: 'Incident',
            entityId: updatedIncident._id,
            changes: { from: previousAssigned, to: req.body.assignedTo }
        });
        res.json(updatedIncident);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Cambiar estado de la incidencia (en_proceso, resuelto, cerrado)
router.patch('/:id/estado', auth, async (req, res) => {
    try {
        const incident = await Incident.findById(req.params.id);
        if (!incident) return res.status(404).json({ message: 'Incidencia no encontrada' });
        const previousStatus = incident.status;
        const { status, comment } = req.body;
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

module.exports = router; 