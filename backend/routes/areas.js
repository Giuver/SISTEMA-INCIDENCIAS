const express = require('express');
const router = express.Router();
const Area = require('../models/Area');
const { auth } = require('../middleware/auth');
const { requirePermission, requireAnyPermission } = require('../config/roles');
const NotificationService = require('../utils/notificationService');
const { logAudit } = require('../utils/auditLogger');

// Obtener todas las áreas (todos los usuarios pueden ver las áreas)
router.get('/', auth, async (req, res) => {
    try {
        const areas = await Area.find();
        res.json(areas);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Crear una nueva área (solo admin)
router.post('/', [auth, requirePermission('areas:manage')], async (req, res) => {
    const { name, description, color } = req.body;
    if (!name || !color) {
        return res.status(400).json({
            message: 'Nombre y color son obligatorios',
            error: 'VALIDATION_ERROR'
        });
    }
    try {
        // Verificar si ya existe un área con el mismo nombre
        const existingArea = await Area.findOne({ name: name });
        if (existingArea) {
            return res.status(400).json({
                message: 'Ya existe un área con este nombre',
                error: 'DUPLICATE_AREA'
            });
        }

        const area = new Area({ name, description, color });
        await area.save();

        // Crear notificación automática
        try {
            const creator = await require('../models/User').findById(req.user.id);
            await NotificationService.createAreaCreatedNotification(area, creator);
        } catch (notifError) {
            console.error('Error al crear notificación:', notifError);
        }

        // Auditoría
        try {
            await logAudit({
                user: req.user.id,
                action: 'crear',
                entity: 'Area',
                entityId: area._id,
                changes: { name, description, color }
            });
        } catch (auditError) {
            console.error('Error al registrar auditoría:', auditError);
        }

        res.status(201).json(area);
    } catch (error) {
        console.error('Error al crear área:', error);
        res.status(400).json({
            message: 'Error al crear el área',
            error: error.message
        });
    }
});

// Editar un área (solo admin)
router.put('/:id', [auth, requirePermission('areas:manage')], async (req, res) => {
    try {
        const area = await Area.findById(req.params.id);
        if (!area) {
            return res.status(404).json({
                message: 'Área no encontrada',
                error: 'AREA_NOT_FOUND'
            });
        }

        const before = {
            name: area.name,
            description: area.description,
            color: area.color
        };

        // Verificar si el nuevo nombre ya existe en otra área
        if (req.body.name && req.body.name !== area.name) {
            const existingArea = await Area.findOne({
                name: req.body.name,
                _id: { $ne: area._id }
            });
            if (existingArea) {
                return res.status(400).json({
                    message: 'Ya existe un área con este nombre',
                    error: 'DUPLICATE_AREA'
                });
            }
        }

        area.name = req.body.name || area.name;
        area.description = req.body.description || area.description;
        area.color = req.body.color || area.color;
        await area.save();

        // Crear notificación automática
        try {
            const updatedBy = await require('../models/User').findById(req.user.id);
            await NotificationService.createAreaUpdatedNotification(area, updatedBy);
        } catch (notifError) {
            console.error('Error al crear notificación:', notifError);
        }

        // Auditoría
        try {
            await logAudit({
                user: req.user.id,
                action: 'actualizar',
                entity: 'Area',
                entityId: area._id,
                changes: { before, after: req.body }
            });
        } catch (auditError) {
            console.error('Error al registrar auditoría:', auditError);
        }

        res.json(area);
    } catch (error) {
        console.error('Error al actualizar área:', error);
        res.status(400).json({
            message: 'Error al actualizar el área',
            error: error.message
        });
    }
});

// Eliminar un área (solo admin)
router.delete('/:id', [auth, requirePermission('areas:manage')], async (req, res) => {
    try {
        const area = await Area.findById(req.params.id);
        if (!area) {
            return res.status(404).json({
                message: 'Área no encontrada',
                error: 'AREA_NOT_FOUND'
            });
        }

        const areaName = area.name;
        await area.deleteOne(); // Usando deleteOne en lugar de remove que está deprecado

        // Crear notificación automática
        try {
            const deletedBy = await require('../models/User').findById(req.user.id);
            await NotificationService.createAreaDeletedNotification(areaName, deletedBy);
        } catch (notifError) {
            console.error('Error al crear notificación:', notifError);
        }

        // Auditoría
        try {
            await logAudit({
                user: req.user.id,
                action: 'eliminar',
                entity: 'Area',
                entityId: req.params.id,
                changes: { deleted: true, name: areaName }
            });
        } catch (auditError) {
            console.error('Error al registrar auditoría:', auditError);
        }

        res.json({ message: 'Área eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar área:', error);
        res.status(500).json({
            message: 'Error al eliminar el área',
            error: error.message
        });
    }
});

module.exports = router; 