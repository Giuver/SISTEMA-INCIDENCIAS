const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { auth, authorize } = require('../middleware/auth');
const NotificationService = require('../utils/notificationService');
const { logAudit } = require('../utils/auditLogger');

// Obtener todas las categorías
router.get('/', auth, async (req, res) => {
    try {
        const categories = await Category.find();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Crear una nueva categoría (solo admin)
router.post('/', auth, authorize('admin'), async (req, res) => {
    const { name, description, color } = req.body;
    if (!name || !color) {
        return res.status(400).json({
            message: 'Nombre y color son obligatorios',
            error: 'VALIDATION_ERROR'
        });
    }
    try {
        // Verificar si ya existe una categoría con el mismo nombre
        const existingCategory = await Category.findOne({ name: name });
        if (existingCategory) {
            return res.status(400).json({
                message: 'Ya existe una categoría con este nombre',
                error: 'DUPLICATE_CATEGORY'
            });
        }

        const category = new Category({ name, description, color });
        await category.save();

        // Crear notificación automática
        try {
            const creator = await require('../models/User').findById(req.user.id);
            await NotificationService.createCategoryCreatedNotification(category, creator);
        } catch (notifError) {
            console.error('Error al crear notificación:', notifError);
        }

        // Auditoría
        try {
            await logAudit({
                user: req.user.id,
                action: 'crear',
                entity: 'Category',
                entityId: category._id,
                changes: { name, description, color }
            });
        } catch (auditError) {
            console.error('Error al registrar auditoría:', auditError);
        }

        res.status(201).json(category);
    } catch (error) {
        console.error('Error al crear categoría:', error);
        res.status(400).json({
            message: 'Error al crear la categoría',
            error: error.message
        });
    }
});

// Editar una categoría (solo admin)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({
                message: 'Categoría no encontrada',
                error: 'CATEGORY_NOT_FOUND'
            });
        }

        const before = {
            name: category.name,
            description: category.description,
            color: category.color
        };

        // Verificar si el nuevo nombre ya existe en otra categoría
        if (req.body.name && req.body.name !== category.name) {
            const existingCategory = await Category.findOne({
                name: req.body.name,
                _id: { $ne: category._id }
            });
            if (existingCategory) {
                return res.status(400).json({
                    message: 'Ya existe una categoría con este nombre',
                    error: 'DUPLICATE_CATEGORY'
                });
            }
        }

        category.name = req.body.name || category.name;
        category.description = req.body.description || category.description;
        category.color = req.body.color || category.color;
        await category.save();

        // Crear notificación automática
        try {
            const updatedBy = await require('../models/User').findById(req.user.id);
            await NotificationService.createCategoryUpdatedNotification(category, updatedBy);
        } catch (notifError) {
            console.error('Error al crear notificación:', notifError);
        }

        // Auditoría
        try {
            await logAudit({
                user: req.user.id,
                action: 'actualizar',
                entity: 'Category',
                entityId: category._id,
                changes: { before, after: req.body }
            });
        } catch (auditError) {
            console.error('Error al registrar auditoría:', auditError);
        }

        res.json(category);
    } catch (error) {
        console.error('Error al actualizar categoría:', error);
        res.status(400).json({
            message: 'Error al actualizar la categoría',
            error: error.message
        });
    }
});

// Eliminar una categoría (solo admin)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({
                message: 'Categoría no encontrada',
                error: 'CATEGORY_NOT_FOUND'
            });
        }

        const categoryName = category.name;
        await category.deleteOne(); // Usando deleteOne en lugar de remove que está deprecado

        // Crear notificación automática
        try {
            const deletedBy = await require('../models/User').findById(req.user.id);
            await NotificationService.createCategoryDeletedNotification(categoryName, deletedBy);
        } catch (notifError) {
            console.error('Error al crear notificación:', notifError);
        }

        // Auditoría
        try {
            await logAudit({
                user: req.user.id,
                action: 'eliminar',
                entity: 'Category',
                entityId: req.params.id,
                changes: { deleted: true, name: categoryName }
            });
        } catch (auditError) {
            console.error('Error al registrar auditoría:', auditError);
        }

        res.json({ message: 'Categoría eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar categoría:', error);
        res.status(500).json({
            message: 'Error al eliminar la categoría',
            error: error.message
        });
    }
});

module.exports = router; 