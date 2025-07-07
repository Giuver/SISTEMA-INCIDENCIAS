const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Incident = require('../models/Incident');

describe('🔒 Pruebas de Seguridad - Control de Permisos por Rol', () => {
    let adminToken, soporteToken, usuarioToken;
    let adminUser, soporteUser, usuarioUser;
    let testIncident;

    beforeAll(async () => {
        // Crear usuarios de prueba con diferentes roles
        adminUser = await User.create({
            name: 'Admin Test',
            email: 'admin@test.com',
            password: 'password123',
            role: 'admin'
        });

        soporteUser = await User.create({
            name: 'Soporte Test',
            email: 'soporte@test.com',
            password: 'password123',
            role: 'soporte'
        });

        usuarioUser = await User.create({
            name: 'Usuario Test',
            email: 'usuario@test.com',
            password: 'password123',
            role: 'usuario'
        });

        // Crear incidencia de prueba
        testIncident = await Incident.create({
            subject: 'Incidencia de prueba',
            description: 'Descripción de prueba',
            area: 'Sistema',
            priority: 'Media',
            status: 'pendiente',
            createdBy: usuarioUser._id
        });

        // Obtener tokens de autenticación
        const adminResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@test.com',
                password: 'password123'
            });
        adminToken = adminResponse.body.token;

        const soporteResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'soporte@test.com',
                password: 'password123'
            });
        soporteToken = soporteResponse.body.token;

        const usuarioResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'usuario@test.com',
                password: 'password123'
            });
        usuarioToken = usuarioResponse.body.token;
    });

    afterAll(async () => {
        // Limpiar datos de prueba
        await User.deleteMany({ email: { $in: ['admin@test.com', 'soporte@test.com', 'usuario@test.com'] } });
        await Incident.deleteMany({ subject: 'Incidencia de prueba' });
        await mongoose.connection.close();
    });

    describe('📋 Gestión de Incidencias por Rol', () => {
        test('✅ Admin puede cambiar estado de incidencia', async () => {
            const response = await request(app)
                .patch(`/api/incidents/${testIncident._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'en_proceso' });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('en_proceso');
        });

        test('✅ Soporte puede cambiar estado de incidencia', async () => {
            const response = await request(app)
                .patch(`/api/incidents/${testIncident._id}`)
                .set('Authorization', `Bearer ${soporteToken}`)
                .send({ status: 'resuelto' });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('resuelto');
        });

        test('❌ Usuario no puede cambiar estado de incidencia', async () => {
            const response = await request(app)
                .patch(`/api/incidents/${testIncident._id}`)
                .set('Authorization', `Bearer ${usuarioToken}`)
                .send({ status: 'cerrado' });

            expect(response.status).toBe(403);
            expect(response.body.message).toContain('No tienes permisos');
        });

        test('✅ Admin puede asignar incidencia', async () => {
            const response = await request(app)
                .patch(`/api/incidents/${testIncident._id}/assign`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ assignedTo: [soporteUser._id] });

            expect(response.status).toBe(200);
        });

        test('✅ Soporte puede asignar incidencia', async () => {
            const response = await request(app)
                .patch(`/api/incidents/${testIncident._id}/assign`)
                .set('Authorization', `Bearer ${soporteToken}`)
                .send({ assignedTo: [usuarioUser._id] });

            expect(response.status).toBe(200);
        });

        test('❌ Usuario no puede asignar incidencia', async () => {
            const response = await request(app)
                .patch(`/api/incidents/${testIncident._id}/assign`)
                .set('Authorization', `Bearer ${usuarioToken}`)
                .send({ assignedTo: [adminUser._id] });

            expect(response.status).toBe(403);
        });
    });

    describe('👥 Gestión de Usuarios por Rol', () => {
        test('✅ Admin puede ver lista de usuarios', async () => {
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        test('❌ Soporte no puede ver lista de usuarios', async () => {
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${soporteToken}`);

            expect(response.status).toBe(403);
        });

        test('❌ Usuario no puede ver lista de usuarios', async () => {
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${usuarioToken}`);

            expect(response.status).toBe(403);
        });
    });

    describe('📊 Auditoría por Rol', () => {
        test('✅ Admin puede ver historial de auditoría', async () => {
            const response = await request(app)
                .get('/api/audit')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
        });

        test('❌ Soporte no puede ver auditoría', async () => {
            const response = await request(app)
                .get('/api/audit')
                .set('Authorization', `Bearer ${soporteToken}`);

            expect(response.status).toBe(403);
        });

        test('❌ Usuario no puede ver auditoría', async () => {
            const response = await request(app)
                .get('/api/audit')
                .set('Authorization', `Bearer ${usuarioToken}`);

            expect(response.status).toBe(403);
        });
    });

    describe('🔐 Validación de Archivos', () => {
        test('❌ Rechaza archivo demasiado grande', async () => {
            // Crear un archivo simulado de 6MB
            const largeBuffer = Buffer.alloc(6 * 1024 * 1024);

            const response = await request(app)
                .post('/api/incidents')
                .set('Authorization', `Bearer ${adminToken}`)
                .field('subject', 'Test')
                .field('description', 'Test')
                .field('area', 'Sistema')
                .field('priority', 'Media')
                .attach('attachment', largeBuffer, 'large-file.txt');

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('FILE_TOO_LARGE');
        });

        test('❌ Rechaza tipo de archivo no permitido', async () => {
            const response = await request(app)
                .post('/api/incidents')
                .set('Authorization', `Bearer ${adminToken}`)
                .field('subject', 'Test')
                .field('description', 'Test')
                .field('area', 'Sistema')
                .field('priority', 'Media')
                .attach('attachment', Buffer.from('test'), 'test.exe');

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('INVALID_FILE_TYPE');
        });
    });

    describe('📝 Auditoría de Acciones', () => {
        test('✅ Registra creación de incidencia', async () => {
            const response = await request(app)
                .post('/api/incidents')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    subject: 'Test Auditoría',
                    description: 'Test',
                    area: 'Sistema',
                    priority: 'Media'
                });

            expect(response.status).toBe(201);

            // Verificar que se registró en auditoría
            const auditResponse = await request(app)
                .get('/api/audit')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(auditResponse.status).toBe(200);
            const auditEntry = auditResponse.body.find(entry =>
                entry.action === 'crear_incidencia' &&
                entry.entityId === response.body._id
            );
            expect(auditEntry).toBeDefined();
        });
    });
}); 