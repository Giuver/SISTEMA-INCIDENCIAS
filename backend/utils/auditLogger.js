const Audit = require('../models/Audit');

async function logAudit({ user, action, entity, entityId, changes }) {
    try {
        await Audit.create({
            user,
            action,
            entity,
            entityId,
            changes: changes || {},
        });
    } catch (err) {
        // No lanzar error para no afectar la funcionalidad principal
        // Se puede loguear en consola o archivo si se desea
        console.error('Error registrando auditoría:', err);
    }
}

module.exports = { logAudit }; 