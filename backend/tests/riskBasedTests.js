const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const RiskAssessment = require('../utils/riskAssessment');
const User = require('../models/User');
const Incident = require('../models/Incident');
const Category = require('../models/Category');

let mongoServer;
let authToken;
let testUser;
let riskAssessment;

describe('Risk-Based Testing Suite', () => {
    beforeAll(async () => {
        // Configurar base de datos en memoria
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);

        // Inicializar evaluación de riesgos
        riskAssessment = new RiskAssessment();

        // Crear usuario de prueba
        testUser = new User({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
            role: 'admin'
        });
        await testUser.save();

        // Obtener token de autenticación
        const loginResponse = await request(app)
            .post('/api/users/login')
            .send({
                email: 'test@example.com',
                password: 'password123'
            });

        authToken = loginResponse.body.token;
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        await Incident.deleteMany({});
    });

    describe('CRITICAL RISK - Authentication & Authorization', () => {
        test('IMMEDIATE: Login validation with valid credentials', async () => {
            const response = await request(app)
                .post('/api/users/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
        });

        test('IMMEDIATE: Login validation with invalid credentials', async () => {
            const response = await request(app)
                .post('/api/users/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
        });

        test('IMMEDIATE: Token verification for protected routes', async () => {
            const response = await request(app)
                .get('/api/auth/verify')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('user');
        });

        test('IMMEDIATE: Access denied without token', async () => {
            const response = await request(app)
                .get('/api/incidents');

            expect(response.status).toBe(401);
        });
    });

    describe('HIGH RISK - Incident Management', () => {
        test('HIGH: Incident creation with valid data', async () => {
            const incidentData = {
                subject: 'Critical System Failure',
                description: 'System is down affecting all users',
                priority: 'alta',
                assignedTo: testUser._id
            };

            const response = await request(app)
                .post('/api/incidents')
                .set('Authorization', `Bearer ${authToken}`)
                .send(incidentData);

            expect(response.status).toBe(201);
            expect(response.body.subject).toBe(incidentData.subject);
            expect(response.body.priority).toBe(incidentData.priority);
        });

        test('HIGH: Incident update with status transition', async () => {
            // Crear incidencia
            const incident = new Incident({
                subject: 'Test Incident',
                description: 'Test description',
                priority: 'alta',
                assignedTo: testUser._id,
                createdBy: testUser._id,
                status: 'pendiente'
            });
            await incident.save();

            // Actualizar estado
            const response = await request(app)
                .put(`/api/incidents/${incident._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    status: 'en_proceso',
                    description: 'Updated description'
                });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('en_proceso');
        });

        test('HIGH: File upload with incident creation', async () => {
            const incidentData = {
                subject: 'Incident with Attachment',
                description: 'Testing file upload',
                priority: 'media'
            };

            const response = await request(app)
                .post('/api/incidents')
                .set('Authorization', `Bearer ${authToken}`)
                .field('subject', incidentData.subject)
                .field('description', incidentData.description)
                .field('priority', incidentData.priority)
                .attach('attachments', Buffer.from('test file content'), 'test.txt');

            expect(response.status).toBe(201);
            expect(response.body.subject).toBe(incidentData.subject);
        });
    });

    describe('HIGH RISK - User Management', () => {
        test('HIGH: User creation with validation', async () => {
            const userData = {
                name: 'New User',
                email: 'newuser@example.com',
                password: 'password123',
                role: 'user'
            };

            const response = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${authToken}`)
                .send(userData);

            expect(response.status).toBe(201);
            expect(response.body.name).toBe(userData.name);
            expect(response.body).not.toHaveProperty('password');
        });

        test('HIGH: User update with role change', async () => {
            const newUser = new User({
                name: 'Update Test User',
                email: 'updatetest@example.com',
                password: 'password123',
                role: 'user'
            });
            await newUser.save();

            const response = await request(app)
                .put(`/api/users/${newUser._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    role: 'admin',
                    name: 'Updated User Name'
                });

            expect(response.status).toBe(200);
            expect(response.body.role).toBe('admin');
        });
    });

    describe('MEDIUM RISK - Real-time Notifications', () => {
        test('MEDIUM: Notification delivery system', async () => {
            // Crear una notificación de prueba
            const notificationData = {
                title: 'Test Notification',
                message: 'This is a test notification',
                type: 'incident_created',
                priority: 'medium'
            };

            const response = await request(app)
                .post('/api/notifications')
                .set('Authorization', `Bearer ${authToken}`)
                .send(notificationData);

            expect(response.status).toBe(201);
            expect(response.body.title).toBe(notificationData.title);
        });
    });

    describe('MEDIUM RISK - Dashboard & Reports', () => {
        test('MEDIUM: Dashboard data visualization', async () => {
            // Crear datos de prueba
            const incident1 = new Incident({
                subject: 'Dashboard Test 1',
                description: 'Test incident 1',
                priority: 'alta',
                status: 'pendiente',
                createdBy: testUser._id
            });
            await incident1.save();

            const incident2 = new Incident({
                subject: 'Dashboard Test 2',
                description: 'Test incident 2',
                priority: 'media',
                status: 'resuelto',
                createdBy: testUser._id
            });
            await incident2.save();

            // Obtener estadísticas del dashboard
            const response = await request(app)
                .get('/api/incidents/stats')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('total');
            expect(response.body).toHaveProperty('byStatus');
            expect(response.body).toHaveProperty('byPriority');
        });
    });

    describe('LOW RISK - Categories', () => {
        test('LOW: Category creation', async () => {
            const categoryData = {
                name: 'Test Category',
                description: 'Test category description'
            };

            const response = await request(app)
                .post('/api/categories')
                .set('Authorization', `Bearer ${authToken}`)
                .send(categoryData);

            expect(response.status).toBe(201);
            expect(response.body.name).toBe(categoryData.name);
        });

        test('LOW: Category update', async () => {
            const category = new Category({
                name: 'Update Test Category',
                description: 'Original description'
            });
            await category.save();

            const response = await request(app)
                .put(`/api/categories/${category._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Updated Category Name',
                    description: 'Updated description'
                });

            expect(response.status).toBe(200);
            expect(response.body.name).toBe('Updated Category Name');
        });
    });

    describe('Risk Assessment Integration', () => {
        test('Should generate risk report', () => {
            const report = riskAssessment.generateRiskReport();

            expect(report).toHaveProperty('summary');
            expect(report).toHaveProperty('recommendations');
            expect(report).toHaveProperty('testPlan');
            expect(report.summary).toHaveProperty('totalFunctionalities');
            expect(report.summary).toHaveProperty('criticalFunctions');
        });

        test('Should prioritize tests by risk', () => {
            const prioritized = riskAssessment.getPrioritizedFunctionalities();

            expect(prioritized.length).toBeGreaterThan(0);
            expect(prioritized[0].riskScore).toBeGreaterThanOrEqual(prioritized[1].riskScore);
        });

        test('Should evaluate new functionality risk', () => {
            const newRisk = riskAssessment.evaluateNewFunctionality(
                'new_feature',
                'HIGH',
                'MEDIUM',
                'New critical feature'
            );

            expect(newRisk).toHaveProperty('riskScore');
            expect(newRisk).toHaveProperty('testPriority');
            expect(newRisk.impact).toBe('HIGH');
        });
    });
}); 