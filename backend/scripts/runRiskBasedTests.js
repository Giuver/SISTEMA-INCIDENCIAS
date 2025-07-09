const mongoose = require('mongoose');
const Incident = require('../models/Incident');
const User = require('../models/User');
const Audit = require('../models/Audit');

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/incident-management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function runRiskBasedTests() {
    try {
        console.log('🧪 Ejecutando pruebas basadas en riesgo...\n');

        const testResults = [];

        // Test 1: Verificar incidencias críticas sin asignar
        console.log('🔍 Test 1: Incidencias críticas sin asignar');
        const criticalUnassigned = await Incident.find({
            priority: 'crítica',
            status: { $ne: 'cerrado' },
            assignedTo: { $exists: false }
        });

        if (criticalUnassigned.length > 0) {
            testResults.push({
                test: 'CRITICAL RISK - Incidencias críticas sin asignar',
                status: 'FAILED',
                details: `${criticalUnassigned.length} incidencias críticas sin asignar`,
                severity: 'CRITICAL'
            });
            console.log(`❌ FALLÓ: ${criticalUnassigned.length} incidencias críticas sin asignar`);
        } else {
            testResults.push({
                test: 'CRITICAL RISK - Incidencias críticas sin asignar',
                status: 'PASSED',
                details: 'No hay incidencias críticas sin asignar',
                severity: 'CRITICAL'
            });
            console.log('✅ PASÓ: No hay incidencias críticas sin asignar');
        }

        // Test 2: Verificar incidencias críticas sin resolver por más de 24 horas
        console.log('\n🔍 Test 2: Incidencias críticas sin resolver por más de 24 horas');
        const criticalOld = await Incident.find({
            priority: 'crítica',
            status: { $ne: 'cerrado' },
            createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        if (criticalOld.length > 0) {
            testResults.push({
                test: 'HIGH RISK - Incidencias críticas sin resolver por más de 24h',
                status: 'FAILED',
                details: `${criticalOld.length} incidencias críticas sin resolver por más de 24h`,
                severity: 'HIGH'
            });
            console.log(`❌ FALLÓ: ${criticalOld.length} incidencias críticas sin resolver por más de 24h`);
        } else {
            testResults.push({
                test: 'HIGH RISK - Incidencias críticas sin resolver por más de 24h',
                status: 'PASSED',
                details: 'No hay incidencias críticas sin resolver por más de 24h',
                severity: 'HIGH'
            });
            console.log('✅ PASÓ: No hay incidencias críticas sin resolver por más de 24h');
        }

        // Test 3: Verificar usuarios inactivos con incidencias asignadas
        console.log('\n🔍 Test 3: Usuarios inactivos con incidencias asignadas');
        const inactiveUsers = await User.find({ isActive: false });
        let inactiveWithIncidents = 0;

        for (const user of inactiveUsers) {
            const assignedIncidents = await Incident.find({
                assignedTo: user._id,
                status: { $ne: 'cerrado' }
            });
            if (assignedIncidents.length > 0) {
                inactiveWithIncidents += assignedIncidents.length;
            }
        }

        if (inactiveWithIncidents > 0) {
            testResults.push({
                test: 'MEDIUM RISK - Usuarios inactivos con incidencias asignadas',
                status: 'FAILED',
                details: `${inactiveWithIncidents} incidencias asignadas a usuarios inactivos`,
                severity: 'MEDIUM'
            });
            console.log(`❌ FALLÓ: ${inactiveWithIncidents} incidencias asignadas a usuarios inactivos`);
        } else {
            testResults.push({
                test: 'MEDIUM RISK - Usuarios inactivos con incidencias asignadas',
                status: 'PASSED',
                details: 'No hay incidencias asignadas a usuarios inactivos',
                severity: 'MEDIUM'
            });
            console.log('✅ PASÓ: No hay incidencias asignadas a usuarios inactivos');
        }

        // Test 4: Verificar incidencias sin área asignada
        console.log('\n🔍 Test 4: Incidencias sin área asignada');
        const incidentsWithoutArea = await Incident.find({
            area: { $exists: false },
            status: { $ne: 'cerrado' }
        });

        if (incidentsWithoutArea.length > 0) {
            testResults.push({
                test: 'LOW RISK - Incidencias sin área asignada',
                status: 'FAILED',
                details: `${incidentsWithoutArea.length} incidencias sin área asignada`,
                severity: 'LOW'
            });
            console.log(`❌ FALLÓ: ${incidentsWithoutArea.length} incidencias sin área asignada`);
        } else {
            testResults.push({
                test: 'LOW RISK - Incidencias sin área asignada',
                status: 'PASSED',
                details: 'Todas las incidencias tienen área asignada',
                severity: 'LOW'
            });
            console.log('✅ PASÓ: Todas las incidencias tienen área asignada');
        }

        // Test 5: Verificar actividad de auditoría reciente
        console.log('\n🔍 Test 5: Actividad de auditoría reciente');
        const recentAudits = await Audit.find({
            timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });

        if (recentAudits.length === 0) {
            testResults.push({
                test: 'MEDIUM RISK - Sin actividad de auditoría reciente',
                status: 'FAILED',
                details: 'No hay actividad de auditoría en los últimos 7 días',
                severity: 'MEDIUM'
            });
            console.log('❌ FALLÓ: No hay actividad de auditoría en los últimos 7 días');
        } else {
            testResults.push({
                test: 'MEDIUM RISK - Sin actividad de auditoría reciente',
                status: 'PASSED',
                details: `${recentAudits.length} registros de auditoría en los últimos 7 días`,
                severity: 'MEDIUM'
            });
            console.log(`✅ PASÓ: ${recentAudits.length} registros de auditoría en los últimos 7 días`);
        }

        // Resumen de resultados
        console.log('\n📊 Resumen de pruebas:');
        console.log('='.repeat(50));

        const passedTests = testResults.filter(result => result.status === 'PASSED').length;
        const failedTests = testResults.filter(result => result.status === 'FAILED').length;

        console.log(`✅ Pruebas pasadas: ${passedTests}`);
        console.log(`❌ Pruebas fallidas: ${failedTests}`);
        console.log(`📊 Total: ${testResults.length}`);

        // Mostrar detalles de pruebas fallidas
        const failedTestsList = testResults.filter(result => result.status === 'FAILED');
        if (failedTestsList.length > 0) {
            console.log('\n🚨 Pruebas fallidas:');
            failedTestsList.forEach(test => {
                console.log(`  - ${test.severity}: ${test.test}`);
                console.log(`    ${test.details}`);
            });
        }

        // Calcular puntuación de riesgo
        const riskScore = (failedTests / testResults.length) * 100;
        console.log(`\n🔍 Puntuación de riesgo: ${riskScore.toFixed(2)}%`);

        if (riskScore > 50) {
            console.log('🚨 ALERTA: Riesgo alto detectado');
        } else if (riskScore > 25) {
            console.log('⚠️  ADVERTENCIA: Riesgo moderado detectado');
        } else {
            console.log('✅ Riesgo bajo - Sistema estable');
        }

        console.log('\n✅ Pruebas basadas en riesgo completadas');

    } catch (error) {
        console.error('❌ Error durante las pruebas:', error);
    } finally {
        mongoose.connection.close();
    }
}

runRiskBasedTests(); 