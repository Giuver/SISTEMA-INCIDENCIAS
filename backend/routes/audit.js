const express = require('express');
const router = express.Router();
const Audit = require('../models/Audit');
const { auth } = require('../middleware/auth');
const { requirePermission } = require('../config/roles');

// Obtener registros de auditoría (solo admin)
router.get('/', [auth, requirePermission('audit:read')], async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            user = '',
            action = '',
            entity = '',
            from = '',
            to = ''
        } = req.query;

        const query = {};
        if (user) query.user = user;
        if (action) query.action = action;
        if (entity) query.entity = entity;
        if (from || to) {
            query.date = {};
            if (from) query.date.$gte = new Date(from);
            if (to) query.date.$lte = new Date(to);
        }

        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            Audit.find(query)
                .populate('user', 'name email')
                .sort({ date: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Audit.countDocuments(query)
        ]);

        res.json({
            logs,
            total,
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Error al obtener registros de auditoría:', error);
        res.status(500).json({
            message: 'Error al obtener registros de auditoría',
            error: error.message
        });
    }
});

module.exports = router; 