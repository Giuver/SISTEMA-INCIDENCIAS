const express = require('express');
const router = express.Router();
const Audit = require('../models/Audit');
const { auth } = require('../middleware/auth');
const { requirePermission } = require('../config/roles');

// Obtener registros de auditoría (solo admin)
router.get('/', auth, async (req, res) => {
    try {
        let { page = 1, limit = 10 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(limit) || limit < 1) limit = 10;

        // Filtros (puedes expandirlos si lo deseas)
        const query = {};

        // Total real de registros
        const total = await Audit.countDocuments(query);
        // Paginación real
        const logs = await Audit.find(query)
            .populate('user', 'name email')
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            logs,
            total,
            page,
            limit
        });
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener logs de auditoría', error: err.message });
    }
});

module.exports = router; 