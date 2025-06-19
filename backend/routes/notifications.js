const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

// Obtener notificaciones del usuario autenticado
router.get('/', auth, async (req, res) => {
    try {
        const { page = 1, limit = 20, unreadOnly = false } = req.query;

        if (!req.user || !req.user.id) {
            return res.status(401).json({
                message: 'Usuario no autenticado',
                error: 'AUTH_NO_USER'
            });
        }

        const skip = (page - 1) * limit;
        let query = { recipient: req.user.id };

        if (unreadOnly === 'true') {
            query.read = false;
        }

        try {
            const [notifications, total, unreadCount] = await Promise.all([
                Notification.find(query)
                    .populate('sender', 'name email')
                    .populate('relatedIncident', 'subject status')
                    .populate('relatedUser', 'name email')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(limit))
                    .lean(),
                Notification.countDocuments(query),
                Notification.countDocuments({
                    recipient: req.user.id,
                    read: false
                })
            ]);

            res.json({
                notifications: notifications || [],
                total,
                unreadCount,
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit)
            });
        } catch (dbError) {
            console.error('Error en la consulta a la base de datos:', dbError);
            return res.status(500).json({
                message: 'Error al obtener notificaciones de la base de datos',
                error: dbError.message
            });
        }
    } catch (error) {
        console.error('Error al procesar la solicitud de notificaciones:', error);
        res.status(500).json({
            message: 'Error al procesar la solicitud de notificaciones',
            error: error.message
        });
    }
});

// Marcar notificación como leída
router.patch('/:id/read', auth, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user.id },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notificación no encontrada' });
        }

        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: 'Error al marcar notificación como leída' });
    }
});

// Marcar todas las notificaciones como leídas
router.patch('/read-all', auth, async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user.id, read: false },
            { read: true }
        );

        res.json({ message: 'Todas las notificaciones marcadas como leídas' });
    } catch (error) {
        res.status(500).json({ message: 'Error al marcar notificaciones como leídas' });
    }
});

// Eliminar notificación
router.delete('/:id', auth, async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            recipient: req.user.id
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notificación no encontrada' });
        }

        res.json({ message: 'Notificación eliminada' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar notificación' });
    }
});

// Obtener contador de notificaciones no leídas
router.get('/unread-count', auth, async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            recipient: req.user.id,
            read: false
        });

        res.json({ unreadCount: count });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener contador de notificaciones' });
    }
});

module.exports = router; 