const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { config } = require('../config/env');
const { ROLES } = require('../config/roles');

// Importar modelos
const User = require('../models/User');

const createTestUsers = async () => {
    try {
        console.log('🚀 Creando usuarios de prueba...');

        // Conectar a la base de datos
        await mongoose.connect(config.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('✅ Conectado a la base de datos');

        // Usuarios de prueba
        const testUsers = [
            {
                name: 'Administrador',
                email: 'admin@example.com',
                password: 'admin123',
                role: ROLES.ADMIN
            },
            {
                name: 'Técnico de Soporte 1',
                email: 'soporte1@example.com',
                password: 'soporte123',
                role: ROLES.SOPORTE
            },
            {
                name: 'Técnico de Soporte 2',
                email: 'soporte2@example.com',
                password: 'soporte123',
                role: ROLES.SOPORTE
            },
            {
                name: 'Usuario Final 1',
                email: 'usuario1@example.com',
                password: 'usuario123',
                role: ROLES.USUARIO
            },
            {
                name: 'Usuario Final 2',
                email: 'usuario2@example.com',
                password: 'usuario123',
                role: ROLES.USUARIO
            }
        ];

        for (const userData of testUsers) {
            // Verificar si el usuario ya existe
            const existingUser = await User.findOne({ email: userData.email });

            if (existingUser) {
                console.log(`👤 Usuario ${userData.email} ya existe`);
                continue;
            }

            // Encriptar contraseña
            const hashedPassword = await bcrypt.hash(userData.password, 12);

            // Crear usuario
            const user = new User({
                name: userData.name,
                email: userData.email,
                password: hashedPassword,
                role: userData.role
            });

            await user.save();
            console.log(`✅ Usuario creado: ${userData.email} (${userData.role})`);
        }

        console.log('');
        console.log('🎉 Usuarios de prueba creados exitosamente');
        console.log('');
        console.log('🔑 Credenciales de acceso:');
        console.log('');
        console.log('👑 ADMINISTRADOR:');
        console.log('   Email: admin@example.com');
        console.log('   Contraseña: admin123');
        console.log('   Privilegios: Acceso completo al sistema');
        console.log('');
        console.log('🔧 TÉCNICOS DE SOPORTE:');
        console.log('   Email: soporte1@example.com / soporte2@example.com');
        console.log('   Contraseña: soporte123');
        console.log('   Privilegios: Gestionar incidencias asignadas');
        console.log('');
        console.log('👤 USUARIOS FINALES:');
        console.log('   Email: usuario1@example.com / usuario2@example.com');
        console.log('   Contraseña: usuario123');
        console.log('   Privilegios: Crear y ver sus propias incidencias');
        console.log('');
        console.log('🌐 Accede a: http://localhost:5173');

    } catch (error) {
        console.error('❌ Error creando usuarios de prueba:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado de la base de datos');
    }
};

// Ejecutar si se llama directamente
if (require.main === module) {
    createTestUsers();
}

module.exports = createTestUsers; 