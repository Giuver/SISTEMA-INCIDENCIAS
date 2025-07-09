const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/incident-management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function createTestUsers() {
    try {
        console.log('👥 Creando usuarios de prueba...\n');

        // Verificar si ya existen usuarios
        const existingUsers = await User.find();
        if (existingUsers.length > 0) {
            console.log(`ℹ️  Ya existen ${existingUsers.length} usuarios en el sistema`);
            console.log('¿Deseas continuar y agregar usuarios adicionales? (s/n)');
            return;
        }

        // Datos de usuarios de prueba
        const testUsers = [
            {
                name: 'Administrador Principal',
                email: 'admin@test.com',
                password: 'admin123',
                role: 'admin',
                isActive: true
            },
            {
                name: 'Técnico Senior',
                email: 'tecnico1@test.com',
                password: 'tecnico123',
                role: 'technician',
                isActive: true
            },
            {
                name: 'Técnico Junior',
                email: 'tecnico2@test.com',
                password: 'tecnico123',
                role: 'technician',
                isActive: true
            },
            {
                name: 'Usuario Regular',
                email: 'user1@test.com',
                password: 'user123',
                role: 'user',
                isActive: true
            },
            {
                name: 'Usuario de Soporte',
                email: 'soporte@test.com',
                password: 'soporte123',
                role: 'user',
                isActive: true
            },
            {
                name: 'Analista de Sistemas',
                email: 'analista@test.com',
                password: 'analista123',
                role: 'technician',
                isActive: true
            },
            {
                name: 'Coordinador IT',
                email: 'coordinador@test.com',
                password: 'coord123',
                role: 'admin',
                isActive: true
            },
            {
                name: 'Usuario Inactivo',
                email: 'inactivo@test.com',
                password: 'inactivo123',
                role: 'user',
                isActive: false
            }
        ];

        // Crear usuarios
        const createdUsers = [];
        for (const userData of testUsers) {
            // Verificar si el usuario ya existe
            const existingUser = await User.findOne({ email: userData.email });
            if (existingUser) {
                console.log(`ℹ️  Usuario ya existe: ${userData.email}`);
                continue;
            }

            // Encriptar contraseña
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

            // Crear usuario
            const user = new User({
                name: userData.name,
                email: userData.email,
                password: hashedPassword,
                role: userData.role,
                isActive: userData.isActive
            });

            await user.save();
            createdUsers.push(user);
            console.log(`✅ Usuario creado: ${userData.name} (${userData.email}) - Rol: ${userData.role}`);
        }

        console.log(`\n✅ Usuarios de prueba creados exitosamente`);
        console.log(`📊 Total usuarios creados: ${createdUsers.length}`);

        // Mostrar estadísticas por rol
        const usersByRole = {};
        createdUsers.forEach(user => {
            if (!usersByRole[user.role]) {
                usersByRole[user.role] = 0;
            }
            usersByRole[user.role]++;
        });

        console.log('\n📊 Usuarios por rol:');
        Object.keys(usersByRole).forEach(role => {
            console.log(`  - ${role}: ${usersByRole[role]}`);
        });

        // Mostrar credenciales de acceso
        console.log('\n🔑 Credenciales de acceso:');
        console.log('  Administrador: admin@test.com / admin123');
        console.log('  Técnico: tecnico1@test.com / tecnico123');
        console.log('  Usuario: user1@test.com / user123');

        console.log('\n✅ Script de creación de usuarios completado');

    } catch (error) {
        console.error('❌ Error creando usuarios de prueba:', error);
    } finally {
        mongoose.connection.close();
    }
}

createTestUsers(); 