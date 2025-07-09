const mongoose = require('mongoose');
const User = require('../models/User');
const Incident = require('../models/Incident');
const Area = require('../models/Area');
const Audit = require('../models/Audit');
const Notification = require('../models/Notification');

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/incident-management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function checkData() {
    try {
        console.log('🔍 Verificando datos del sistema...\n');

        // Verificar usuarios
        const users = await User.find();
        console.log(`👥 Usuarios: ${users.length}`);
        users.forEach(user => {
            console.log(`  - ${user.name} (${user.email}) - Rol: ${user.role}`);
        });

        // Verificar áreas
        const areas = await Area.find();
        console.log(`\n📊 Áreas: ${areas.length}`);
        areas.forEach(area => {
            console.log(`  - ${area.name} (${area.description})`);
        });

        // Verificar incidencias
        const incidents = await Incident.find();
        console.log(`\n📋 Incidencias: ${incidents.length}`);

        // Estadísticas de incidencias por estado
        const stats = await Incident.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        console.log('  Estados de incidencias:');
        stats.forEach(stat => {
            console.log(`    - ${stat._id}: ${stat.count}`);
        });

        // Verificar auditoría
        const audits = await Audit.find();
        console.log(`\n📝 Registros de auditoría: ${audits.length}`);

        // Verificar notificaciones
        const notifications = await Notification.find();
        console.log(`\n🔔 Notificaciones: ${notifications.length}`);

        // Verificar integridad de datos
        console.log('\n🔍 Verificando integridad de datos...');

        // Usuarios sin email
        const usersWithoutEmail = await User.find({ email: { $exists: false } });
        if (usersWithoutEmail.length > 0) {
            console.log(`⚠️  Usuarios sin email: ${usersWithoutEmail.length}`);
        }

        // Incidencias sin asignar
        const unassignedIncidents = await Incident.find({ assignedTo: { $exists: false } });
        console.log(`📋 Incidencias sin asignar: ${unassignedIncidents.length}`);

        // Incidencias sin área
        const incidentsWithoutArea = await Incident.find({ area: { $exists: false } });
        console.log(`📋 Incidencias sin área: ${incidentsWithoutArea.length}`);

        console.log('\n✅ Verificación de datos completada');

    } catch (error) {
        console.error('❌ Error durante la verificación:', error);
    } finally {
        mongoose.connection.close();
    }
}

checkData(); 