const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Incident = require('../models/Incident');
const User = require('../models/User');

let mongoServer;
let testUser;

describe('Tests Básicos del Sistema', () => {
    beforeAll(async () => {
        try {
            // Crear servidor de MongoDB en memoria
            mongoServer = await MongoMemoryServer.create();
            const mongoUri = mongoServer.getUri();

            // Conectar a la base de datos de prueba
            await mongoose.connect(mongoUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });

            // Crear usuario de prueba
            testUser = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'Test123!',
                role: 'admin'
            });
            await testUser.save();

            console.log('✅ Base de datos de prueba configurada');
        } catch (error) {
            console.error('❌ Error configurando base de datos:', error);
            throw error;
        }
    }, 60000);

    afterEach(async () => {
        // Limpiar incidencias después de cada test
        await Incident.deleteMany({});
    });

    afterAll(async () => {
        try {
            // Limpiar usuarios
            await User.deleteMany({});

            // Desconectar de MongoDB
            await mongoose.disconnect();

            // Detener servidor de MongoDB
            if (mongoServer) {
                await mongoServer.stop();
            }

            console.log('✅ Base de datos de prueba cerrada');
        } catch (error) {
            console.error('❌ Error cerrando base de datos:', error);
        }
    });

    describe('Modelo User', () => {
        test('debe crear un usuario válido', async () => {
            const userData = {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'Password123!',
                role: 'usuario'
            };

            const user = new User(userData);
            const savedUser = await user.save();

            expect(savedUser.name).toBe(userData.name);
            expect(savedUser.email).toBe(userData.email);
            expect(savedUser.role).toBe(userData.role);
            expect(savedUser.password).toBeDefined(); // Debe estar hasheado
        });

        test('debe validar email único', async () => {
            const user1 = new User({
                name: 'User 1',
                email: 'duplicate@example.com',
                password: 'Password123!',
                role: 'usuario'
            });
            await user1.save();

            const user2 = new User({
                name: 'User 2',
                email: 'duplicate@example.com',
                password: 'Password123!',
                role: 'usuario'
            });

            try {
                await user2.save();
                fail('Debería haber fallado por email duplicado');
            } catch (error) {
                expect(error.code).toBe(11000);
            }
        });
    });

    describe('Modelo Incident', () => {
        test('debe crear una incidencia válida', async () => {
            const incidentData = {
                subject: 'Test Incident',
                description: 'This is a test incident description with enough characters to meet the minimum requirement',
                category: 'Software',
                priority: 'Media',
                createdBy: testUser._id
            };

            const incident = new Incident(incidentData);
            const savedIncident = await incident.save();

            expect(savedIncident.subject).toBe(incidentData.subject);
            expect(savedIncident.description).toBe(incidentData.description);
            expect(savedIncident.category).toBe(incidentData.category);
            expect(savedIncident.priority).toBe(incidentData.priority);
            expect(savedIncident.status).toBe('pendiente'); // Valor por defecto
            expect(savedIncident.createdBy.toString()).toBe(testUser._id.toString());
            expect(savedIncident.history).toHaveLength(1); // Entrada inicial
        });

        test('debe validar campos requeridos', async () => {
            const incident = new Incident({});

            try {
                await incident.save();
                fail('Debería haber fallado por campos requeridos');
            } catch (error) {
                expect(error.errors.subject).toBeDefined();
                expect(error.errors.description).toBeDefined();
                expect(error.errors.category).toBeDefined();
                expect(error.errors.createdBy).toBeDefined();
            }
        });

        test('debe validar prioridades válidas', async () => {
            const incident = new Incident({
                subject: 'Test',
                description: 'Test description with enough characters',
                category: 'Software',
                priority: 'Invalid',
                createdBy: testUser._id
            });

            try {
                await incident.save();
                fail('Debería haber fallado por prioridad inválida');
            } catch (error) {
                expect(error.errors.priority).toBeDefined();
            }
        });

        test('debe validar estados válidos', async () => {
            const incident = new Incident({
                subject: 'Test',
                description: 'Test description with enough characters',
                category: 'Software',
                status: 'invalid_status',
                createdBy: testUser._id
            });

            try {
                await incident.save();
                fail('Debería haber fallado por estado inválido');
            } catch (error) {
                expect(error.errors.status).toBeDefined();
            }
        });

        test('debe agregar entrada al historial', async () => {
            const incident = new Incident({
                subject: 'Test',
                description: 'Test description with enough characters',
                category: 'Software',
                createdBy: testUser._id
            });

            await incident.save();
            await incident.addToHistory('Test Action', 'Test comment', testUser._id);

            expect(incident.history).toHaveLength(2);
            expect(incident.history[1].action).toBe('Test Action');
            expect(incident.history[1].comment).toBe('Test comment');
            expect(incident.history[1].user.toString()).toBe(testUser._id.toString());
        });

        test('debe resolver incidencia correctamente', async () => {
            const incident = new Incident({
                subject: 'Test',
                description: 'Test description with enough characters',
                category: 'Software',
                createdBy: testUser._id
            });

            await incident.save();
            await incident.resolve('Test solution', testUser._id);

            expect(incident.status).toBe('resuelto');
            expect(incident.solution).toBe('Test solution');
            expect(incident.resolvedAt).toBeDefined();
            expect(incident.history).toHaveLength(2);
        });
    });

    describe('Métodos Estáticos', () => {
        beforeEach(async () => {
            // Crear múltiples incidencias para tests
            const incidents = [
                {
                    subject: 'Incident 1',
                    description: 'Description 1 with enough characters',
                    category: 'Software',
                    priority: 'Alta',
                    status: 'pendiente',
                    createdBy: testUser._id
                },
                {
                    subject: 'Incident 2',
                    description: 'Description 2 with enough characters',
                    category: 'Hardware',
                    priority: 'Media',
                    status: 'en_proceso',
                    createdBy: testUser._id
                },
                {
                    subject: 'Incident 3',
                    description: 'Description 3 with enough characters',
                    category: 'Software',
                    priority: 'Baja',
                    status: 'resuelto',
                    createdBy: testUser._id
                }
            ];

            for (const incidentData of incidents) {
                const incident = new Incident(incidentData);
                await incident.save();
            }
        });

        test('debe obtener estadísticas por estado', async () => {
            const stats = await Incident.getStats();

            expect(stats).toBeDefined();
            expect(Array.isArray(stats)).toBe(true);

            const statusCounts = {};
            stats.forEach(stat => {
                statusCounts[stat._id] = stat.count;
            });

            expect(statusCounts.pendiente).toBe(1);
            expect(statusCounts.en_proceso).toBe(1);
            expect(statusCounts.resuelto).toBe(1);
        });

        test('debe obtener estadísticas por prioridad', async () => {
            const stats = await Incident.getPriorityStats();

            expect(stats).toBeDefined();
            expect(Array.isArray(stats)).toBe(true);

            const priorityCounts = {};
            stats.forEach(stat => {
                priorityCounts[stat._id] = stat.count;
            });

            expect(priorityCounts.Alta).toBe(1);
            expect(priorityCounts.Media).toBe(1);
            expect(priorityCounts.Baja).toBe(1);
        });

        test('debe obtener estadísticas por categoría', async () => {
            const stats = await Incident.getCategoryStats();

            expect(stats).toBeDefined();
            expect(Array.isArray(stats)).toBe(true);

            const categoryCounts = {};
            stats.forEach(stat => {
                categoryCounts[stat._id] = stat.count;
            });

            expect(categoryCounts.Software).toBe(2);
            expect(categoryCounts.Hardware).toBe(1);
        });
    });
}); 