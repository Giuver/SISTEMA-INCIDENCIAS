const mongoose = require('mongoose');
const Incident = require('../models/Incident');
const User = require('../models/User');
const Audit = require('../models/Audit');

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/incident-management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function showRiskResults() {
    try {
        console.log('🔍 Analizando riesgos del sistema...\n');

        // Análisis de incidencias por prioridad
        const priorityStats = await Incident.aggregate([
            {
                $group: {
                    _id: '$priority',
                    count: { $sum: 1 },
                    avgResolutionTime: { $avg: { $subtract: ['$updatedAt', '$createdAt'] } }
                }
            }
        ]);

        console.log('📊 Análisis por prioridad:');
        priorityStats.forEach(stat => {
            const avgDays = stat.avgResolutionTime ? Math.round(stat.avgResolutionTime / (1000 * 60 * 60 * 24)) : 0;
            console.log(`  - ${stat._id}: ${stat.count} incidencias (promedio ${avgDays} días)`);
        });

        // Análisis de incidencias por estado
        const statusStats = await Incident.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        console.log('\n📊 Análisis por estado:');
        statusStats.forEach(stat => {
            console.log(`  - ${stat._id}: ${stat.count} incidencias`);
        });

        // Análisis de usuarios más activos
        const userActivity = await Incident.aggregate([
            {
                $group: {
                    _id: '$createdBy',
                    incidentsCreated: { $sum: 1 }
                }
            },
            {
                $sort: { incidentsCreated: -1 }
            },
            {
                $limit: 5
            }
        ]);

        console.log('\n👥 Usuarios más activos (por incidencias creadas):');
        for (const userStat of userActivity) {
            const user = await User.findById(userStat._id);
            if (user) {
                console.log(`  - ${user.name}: ${userStat.incidentsCreated} incidencias`);
            }
        }

        // Análisis de incidencias sin resolver
        const unresolvedIncidents = await Incident.find({
            status: { $in: ['pendiente', 'en_proceso'] }
        });

        console.log(`\n⚠️  Incidencias sin resolver: ${unresolvedIncidents.length}`);

        // Análisis de incidencias críticas
        const criticalIncidents = await Incident.find({
            priority: 'crítica',
            status: { $ne: 'cerrado' }
        });

        console.log(`🚨 Incidencias críticas sin resolver: ${criticalIncidents.length}`);

        // Análisis de auditoría
        const auditStats = await Audit.aggregate([
            {
                $group: {
                    _id: '$action',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        console.log('\n📝 Actividad de auditoría:');
        auditStats.forEach(stat => {
            console.log(`  - ${stat._id}: ${stat.count} acciones`);
        });

        // Análisis de tiempo de respuesta
        const resolvedIncidents = await Incident.find({
            status: 'resuelto',
            updatedAt: { $exists: true },
            createdAt: { $exists: true }
        });

        if (resolvedIncidents.length > 0) {
            const avgResolutionTime = resolvedIncidents.reduce((total, incident) => {
                return total + (incident.updatedAt - incident.createdAt);
            }, 0) / resolvedIncidents.length;

            const avgDays = Math.round(avgResolutionTime / (1000 * 60 * 60 * 24));
            console.log(`\n⏱️  Tiempo promedio de resolución: ${avgDays} días`);
        }

        // Análisis de riesgo general
        console.log('\n🔍 Análisis de riesgo general:');

        const totalIncidents = await Incident.countDocuments();
        const criticalUnresolved = await Incident.countDocuments({
            priority: 'crítica',
            status: { $ne: 'cerrado' }
        });
        const highUnresolved = await Incident.countDocuments({
            priority: 'alta',
            status: { $ne: 'cerrado' }
        });

        const riskScore = (criticalUnresolved * 3 + highUnresolved * 2) / totalIncidents * 100;

        console.log(`  - Riesgo crítico: ${criticalUnresolved} incidencias`);
        console.log(`  - Riesgo alto: ${highUnresolved} incidencias`);
        console.log(`  - Puntuación de riesgo: ${riskScore.toFixed(2)}%`);

        if (riskScore > 50) {
            console.log('  🚨 ALERTA: Riesgo alto detectado');
        } else if (riskScore > 25) {
            console.log('  ⚠️  ADVERTENCIA: Riesgo moderado detectado');
        } else {
            console.log('  ✅ Riesgo bajo - Sistema estable');
        }

        console.log('\n✅ Análisis de riesgo completado');

    } catch (error) {
        console.error('❌ Error durante el análisis:', error);
    } finally {
        mongoose.connection.close();
    }
}

showRiskResults(); 