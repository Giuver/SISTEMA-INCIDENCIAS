#!/usr/bin/env node

/**
 * Script para crear registros de auditoría de prueba
 */

const mongoose = require('mongoose');
const Audit = require('../models/Audit');
const User = require('../models/User');

async function createTestAuditData() {
    try {
        // Conectar a MongoDB
        await mongoose.connect('mongodb://localhost:27017/incident-management', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('🔗 Conectado a MongoDB');

        // Obtener un usuario existente para usar como referencia
        const testUser = await User.findOne();
        if (!testUser) {
            console.error('❌ No se encontró ningún usuario en la base de datos');
            return;
        }

        console.log(`👤 Usando usuario de prueba: ${testUser.name} (${testUser._id})`);

        // Crear registros de auditoría de prueba
        const testAuditRecords = [
            {
                user: testUser._id,
                action: 'crear_incidencia',
                entity: 'Incident',
                entityId: new mongoose.Types.ObjectId(),
                changes: { subject: 'Incidencia de prueba 1', status: 'abierto' },
                details: { priority: 'alta', area: 'Soporte Técnico' },
                ipAddress: '192.168.1.100',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                priority: 'high',
                timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 día atrás
            },
            {
                user: testUser._id,
                action: 'actualizar_incidencia',
                entity: 'Incident',
                entityId: new mongoose.Types.ObjectId(),
                changes: { status: 'en_proceso', assignedTo: [testUser._id] },
                details: { previousStatus: 'abierto', newStatus: 'en_proceso' },
                ipAddress: '192.168.1.101',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                priority: 'normal',
                timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 horas atrás
            },
            {
                user: testUser._id,
                action: 'asignar_incidencia',
                entity: 'Incident',
                entityId: new mongoose.Types.ObjectId(),
                changes: { assignedTo: [testUser._id] },
                details: { assignedBy: testUser.name, assignedTo: testUser.name },
                ipAddress: '192.168.1.102',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                priority: 'normal',
                timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 horas atrás
            },
            {
                user: testUser._id,
                action: 'cambiar_estado_incidencia',
                entity: 'Incident',
                entityId: new mongoose.Types.ObjectId(),
                changes: { status: 'resuelto', solution: 'Problema solucionado' },
                details: { previousStatus: 'en_proceso', resolutionTime: '2 horas' },
                ipAddress: '192.168.1.103',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                priority: 'high',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 horas atrás
            },
            {
                user: testUser._id,
                action: 'subir_adjunto',
                entity: 'Incident',
                entityId: new mongoose.Types.ObjectId(),
                changes: { attachment: 'documento.pdf' },
                details: { fileName: 'documento.pdf', fileSize: '1.2MB', fileType: 'application/pdf' },
                ipAddress: '192.168.1.104',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                priority: 'normal',
                timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hora atrás
            },
            {
                user: testUser._id,
                action: 'iniciar_sesion',
                entity: 'User',
                entityId: testUser._id,
                changes: { lastLogin: new Date() },
                details: { loginMethod: 'email', sessionDuration: '2 horas' },
                ipAddress: '192.168.1.105',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                priority: 'normal',
                timestamp: new Date(Date.now() - 30 * 60 * 1000) // 30 minutos atrás
            },
            {
                user: testUser._id,
                action: 'ver_auditoria',
                entity: 'Audit',
                entityId: new mongoose.Types.ObjectId(),
                changes: { viewed: true },
                details: { filters: 'user=test,action=crear_incidencia', resultsCount: 5 },
                ipAddress: '192.168.1.106',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                priority: 'normal',
                timestamp: new Date(Date.now() - 15 * 60 * 1000) // 15 minutos atrás
            },
            {
                user: testUser._id,
                action: 'crear_area',
                entity: 'Area',
                entityId: new mongoose.Types.ObjectId(),
                changes: { name: 'Nueva Área de Prueba', description: 'Área creada para pruebas' },
                details: { createdBy: testUser.name, areaType: 'departamento' },
                ipAddress: '192.168.1.107',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                priority: 'high',
                timestamp: new Date(Date.now() - 10 * 60 * 1000) // 10 minutos atrás
            }
        ];

        // Insertar registros de auditoría
        const createdAudits = await Audit.insertMany(testAuditRecords);

        console.log(`✅ Se crearon ${createdAudits.length} registros de auditoría de prueba`);
        console.log('📊 Registros creados:');

        createdAudits.forEach((audit, index) => {
            console.log(`   ${index + 1}. ${audit.action} - ${audit.entity} - ${audit.timestamp.toLocaleString()}`);
        });

        console.log('\n🎯 Ahora puedes ver estos registros en el módulo de auditoría del frontend');
        console.log('🔍 Los registros incluyen diferentes tipos de acciones y prioridades');

    } catch (error) {
        console.error('❌ Error creando datos de auditoría de prueba:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado de MongoDB');
    }
}

// Ejecutar el script
if (require.main === module) {
    createTestAuditData();
}

module.exports = { createTestAuditData }; 