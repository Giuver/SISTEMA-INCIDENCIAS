const mongoose = require('mongoose');
const Audit = require('../models/Audit');
const User = require('../models/User');
const Incident = require('../models/Incident');

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/incident-management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function createTestAudit() {
    try {
        console.log('🔍 Creando datos de prueba de auditoría...\n');

        // Obtener usuarios existentes
        const users = await User.find();
        if (users.length === 0) {
            console.log('❌ No hay usuarios en el sistema. Crea usuarios primero.');
            return;
        }

        // Obtener incidencias existentes
        const incidents = await Incident.find();
        if (incidents.length === 0) {
            console.log('❌ No hay incidencias en el sistema. Crea incidencias primero.');
            return;
        }

        // Limpiar auditoría existente
        await Audit.deleteMany({});
        console.log('🧹 Auditoría existente limpiada');

        // Crear registros de auditoría de prueba
        const auditRecords = [];

        // Auditoría de login
        users.forEach(user => {
            auditRecords.push({
                userId: user._id,
                action: 'login',
                resource: 'auth',
                details: `Usuario ${user.name} inició sesión`,
                ipAddress: '192.168.1.100',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Últimos 7 días
            });
        });

        // Auditoría de creación de incidencias
        incidents.forEach(incident => {
            auditRecords.push({
                userId: incident.createdBy,
                action: 'crear',
                resource: 'incident',
                resourceId: incident._id,
                details: `Incidencia "${incident.title}" creada`,
                ipAddress: '192.168.1.101',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                timestamp: incident.createdAt
            });
        });

        // Auditoría de cambios de estado
        incidents.forEach(incident => {
            if (incident.status !== 'pendiente') {
                auditRecords.push({
                    userId: incident.assignedTo || incident.createdBy,
                    action: 'cambiar_estado',
                    resource: 'incident',
                    resourceId: incident._id,
                    details: `Estado cambiado a "${incident.status}"`,
                    ipAddress: '192.168.1.102',
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    timestamp: new Date(incident.createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000)
                });
            }
        });

        // Auditoría de asignaciones
        incidents.filter(incident => incident.assignedTo).forEach(incident => {
            auditRecords.push({
                userId: incident.createdBy,
                action: 'asignar',
                resource: 'incident',
                resourceId: incident._id,
                details: `Incidencia asignada a usuario ${incident.assignedTo}`,
                ipAddress: '192.168.1.103',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                timestamp: new Date(incident.createdAt.getTime() + Math.random() * 12 * 60 * 60 * 1000)
            });
        });

        // Auditoría de ediciones
        incidents.forEach(incident => {
            if (incident.updatedAt > incident.createdAt) {
                auditRecords.push({
                    userId: incident.assignedTo || incident.createdBy,
                    action: 'editar',
                    resource: 'incident',
                    resourceId: incident._id,
                    details: `Incidencia "${incident.title}" editada`,
                    ipAddress: '192.168.1.104',
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    timestamp: incident.updatedAt
                });
            }
        });

        // Insertar registros de auditoría
        await Audit.insertMany(auditRecords);

        console.log(`✅ ${auditRecords.length} registros de auditoría creados`);
        console.log('\n📊 Tipos de acciones creadas:');

        const actionStats = {};
        auditRecords.forEach(record => {
            actionStats[record.action] = (actionStats[record.action] || 0) + 1;
        });

        Object.keys(actionStats).forEach(action => {
            console.log(`  - ${action}: ${actionStats[action]}`);
        });

        console.log('\n✅ Datos de prueba de auditoría creados exitosamente');

    } catch (error) {
        console.error('❌ Error creando datos de prueba:', error);
    } finally {
        mongoose.connection.close();
    }
}

createTestAudit(); 