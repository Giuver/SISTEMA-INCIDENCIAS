const mongoose = require('mongoose');
const Incident = require('../models/Incident');
const User = require('../models/User');

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/incident-management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function fixIncidents() {
    try {
        console.log('🔧 Corrigiendo problemas en incidencias...\n');

        // Obtener usuarios para asignaciones
        const users = await User.find({ role: { $in: ['admin', 'technician'] } });
        if (users.length === 0) {
            console.log('❌ No hay usuarios técnicos o administradores para asignar');
            return;
        }

        // Corregir incidencias sin estado
        const incidentsWithoutStatus = await Incident.find({ status: { $exists: false } });
        if (incidentsWithoutStatus.length > 0) {
            console.log(`📋 Corrigiendo ${incidentsWithoutStatus.length} incidencias sin estado...`);
            await Incident.updateMany(
                { status: { $exists: false } },
                { $set: { status: 'pendiente' } }
            );
            console.log('✅ Estados corregidos');
        }

        // Corregir incidencias sin prioridad
        const incidentsWithoutPriority = await Incident.find({ priority: { $exists: false } });
        if (incidentsWithoutPriority.length > 0) {
            console.log(`📋 Corrigiendo ${incidentsWithoutPriority.length} incidencias sin prioridad...`);
            await Incident.updateMany(
                { priority: { $exists: false } },
                { $set: { priority: 'media' } }
            );
            console.log('✅ Prioridades corregidas');
        }

        // Corregir incidencias sin fecha de creación
        const incidentsWithoutCreatedAt = await Incident.find({ createdAt: { $exists: false } });
        if (incidentsWithoutCreatedAt.length > 0) {
            console.log(`📋 Corrigiendo ${incidentsWithoutCreatedAt.length} incidencias sin fecha de creación...`);
            await Incident.updateMany(
                { createdAt: { $exists: false } },
                { $set: { createdAt: new Date() } }
            );
            console.log('✅ Fechas de creación corregidas');
        }

        // Corregir incidencias sin fecha de actualización
        const incidentsWithoutUpdatedAt = await Incident.find({ updatedAt: { $exists: false } });
        if (incidentsWithoutUpdatedAt.length > 0) {
            console.log(`📋 Corrigiendo ${incidentsWithoutUpdatedAt.length} incidencias sin fecha de actualización...`);
            await Incident.updateMany(
                { updatedAt: { $exists: false } },
                { $set: { updatedAt: new Date() } }
            );
            console.log('✅ Fechas de actualización corregidas');
        }

        // Asignar incidencias pendientes sin asignar
        const unassignedIncidents = await Incident.find({
            status: 'pendiente',
            assignedTo: { $exists: false }
        });

        if (unassignedIncidents.length > 0) {
            console.log(`📋 Asignando ${unassignedIncidents.length} incidencias pendientes...`);

            for (const incident of unassignedIncidents) {
                const randomUser = users[Math.floor(Math.random() * users.length)];
                await Incident.findByIdAndUpdate(incident._id, {
                    $set: { assignedTo: randomUser._id }
                });
            }
            console.log('✅ Incidencias asignadas');
        }

        // Corregir incidencias con estados inválidos
        const invalidStatusIncidents = await Incident.find({
            status: { $nin: ['pendiente', 'en_proceso', 'resuelto', 'cerrado'] }
        });

        if (invalidStatusIncidents.length > 0) {
            console.log(`📋 Corrigiendo ${invalidStatusIncidents.length} incidencias con estados inválidos...`);
            await Incident.updateMany(
                { status: { $nin: ['pendiente', 'en_proceso', 'resuelto', 'cerrado'] } },
                { $set: { status: 'pendiente' } }
            );
            console.log('✅ Estados inválidos corregidos');
        }

        // Corregir incidencias con prioridades inválidas
        const invalidPriorityIncidents = await Incident.find({
            priority: { $nin: ['baja', 'media', 'alta', 'crítica'] }
        });

        if (invalidPriorityIncidents.length > 0) {
            console.log(`📋 Corrigiendo ${invalidPriorityIncidents.length} incidencias con prioridades inválidas...`);
            await Incident.updateMany(
                { priority: { $nin: ['baja', 'media', 'alta', 'crítica'] } },
                { $set: { priority: 'media' } }
            );
            console.log('✅ Prioridades inválidas corregidas');
        }

        console.log('\n✅ Corrección de incidencias completada');

        // Mostrar estadísticas finales
        const totalIncidents = await Incident.countDocuments();
        const pendingIncidents = await Incident.countDocuments({ status: 'pendiente' });
        const inProgressIncidents = await Incident.countDocuments({ status: 'en_proceso' });
        const resolvedIncidents = await Incident.countDocuments({ status: 'resuelto' });
        const closedIncidents = await Incident.countDocuments({ status: 'cerrado' });

        console.log('\n📊 Estadísticas finales:');
        console.log(`  - Total incidencias: ${totalIncidents}`);
        console.log(`  - Pendientes: ${pendingIncidents}`);
        console.log(`  - En proceso: ${inProgressIncidents}`);
        console.log(`  - Resueltas: ${resolvedIncidents}`);
        console.log(`  - Cerradas: ${closedIncidents}`);

    } catch (error) {
        console.error('❌ Error corrigiendo incidencias:', error);
    } finally {
        mongoose.connection.close();
    }
}

fixIncidents(); 