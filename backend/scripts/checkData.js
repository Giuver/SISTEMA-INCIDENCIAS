const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const Incident = require('../models/Incident');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect('mongodb://localhost:27017/incident-management', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`MongoDB conectado: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const checkAndCreateData = async () => {
    try {
        await connectDB();

        // Verificar usuarios
        const userCount = await User.countDocuments();
        console.log(`Usuarios en la base de datos: ${userCount}`);

        if (userCount === 0) {
            console.log('Creando usuario administrador...');
            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);

            const adminUser = new User({
                name: 'Administrador',
                email: 'admin@example.com',
                password: hashedPassword,
                role: 'admin'
            });
            await adminUser.save();
            console.log('Usuario administrador creado: admin@example.com / admin123');
        }

        // Verificar categorías
        const categoryCount = await Category.countDocuments();
        console.log(`Categorías en la base de datos: ${categoryCount}`);

        if (categoryCount === 0) {
            console.log('Creando categorías de ejemplo...');
            const categories = [
                { name: 'Hardware', description: 'Problemas con equipos físicos', color: '#FF5722' },
                { name: 'Software', description: 'Problemas con aplicaciones', color: '#2196F3' },
                { name: 'Red', description: 'Problemas de conectividad', color: '#4CAF50' },
                { name: 'Usuario', description: 'Solicitudes de usuario', color: '#FF9800' }
            ];

            for (const cat of categories) {
                const category = new Category(cat);
                await category.save();
            }
            console.log('Categorías creadas');
        }

        // Verificar incidencias
        const incidentCount = await Incident.countDocuments();
        console.log(`Incidencias en la base de datos: ${incidentCount}`);

        if (incidentCount === 0) {
            console.log('Creando incidencias de ejemplo...');
            const users = await User.find();
            const categories = await Category.find();

            if (users.length > 0 && categories.length > 0) {
                const incidents = [
                    {
                        subject: 'Problema con impresora',
                        description: 'La impresora no imprime correctamente',
                        category: categories[0].name,
                        priority: 'Media',
                        status: 'pendiente',
                        createdBy: users[0]._id
                    },
                    {
                        subject: 'Error en aplicación',
                        description: 'La aplicación se cierra inesperadamente',
                        category: categories[1].name,
                        priority: 'Alta',
                        status: 'en_proceso',
                        createdBy: users[0]._id
                    }
                ];

                for (const inc of incidents) {
                    const incident = new Incident(inc);
                    await incident.save();
                }
                console.log('Incidencias de ejemplo creadas');
            }
        }

        console.log('Verificación completada');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkAndCreateData();

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/incidencias', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(async () => {
        console.log('MongoDB conectado');

        try {
            // Contar incidencias
            const totalIncidents = await Incident.countDocuments();
            console.log(`Total de incidencias: ${totalIncidents}`);

            // Obtener todas las incidencias
            const incidents = await Incident.find()
                .populate('assignedTo', 'name email')
                .populate('createdBy', 'name email');

            console.log('\nDetalles de las incidencias:');
            incidents.forEach(incident => {
                console.log(`\nID: ${incident._id}`);
                console.log(`Asunto: ${incident.subject}`);
                console.log(`Estado: ${incident.status}`);
                console.log(`Categoría: ${incident.category}`);
                console.log(`Prioridad: ${incident.priority}`);
                console.log(`Creado por: ${incident.createdBy?.name || 'No disponible'}`);
                console.log(`Asignado a: ${incident.assignedTo?.name || 'No asignado'}`);
                console.log('------------------------');
            });

            // Estadísticas por estado
            const stats = await Incident.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]);

            console.log('\nEstadísticas por estado:');
            stats.forEach(stat => {
                console.log(`${stat._id || 'Sin estado'}: ${stat.count}`);
            });

        } catch (error) {
            console.error('Error al verificar datos:', error);
        } finally {
            mongoose.connection.close();
        }
    })
    .catch(err => {
        console.error('Error de conexión:', err);
        process.exit(1);
    }); 