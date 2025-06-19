const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Conectar a MongoDB
mongoose.connect('mongodb://localhost/incidencias', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB conectado'))
    .catch(err => console.error('Error de conexión a MongoDB:', err));

const createTestUser = async () => {
    try {
        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ email: 'admin@test.com' });

        if (existingUser) {
            console.log('Usuario de prueba ya existe');
            console.log('Email: admin@test.com');
            console.log('Contraseña: admin123');
            process.exit(0);
        }

        // Crear hash de la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        // Crear usuario de prueba
        const testUser = new User({
            name: 'Administrador',
            email: 'admin@test.com',
            password: hashedPassword,
            role: 'admin'
        });

        await testUser.save();

        console.log('Usuario de prueba creado exitosamente');
        console.log('Email: admin@test.com');
        console.log('Contraseña: admin123');
        console.log('Rol: admin');

    } catch (error) {
        console.error('Error creando usuario de prueba:', error);
    } finally {
        mongoose.connection.close();
    }
};

createTestUser(); 