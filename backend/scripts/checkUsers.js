const mongoose = require('mongoose');
const User = require('../models/User');

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/incident-management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function checkUsers() {
    try {
        console.log('🔍 Verificando usuarios del sistema...\n');

        // Obtener todos los usuarios
        const users = await User.find().select('-password');

        console.log(`👥 Total de usuarios: ${users.length}\n`);

        // Mostrar usuarios por rol
        const usersByRole = {};
        users.forEach(user => {
            if (!usersByRole[user.role]) {
                usersByRole[user.role] = [];
            }
            usersByRole[user.role].push(user);
        });

        Object.keys(usersByRole).forEach(role => {
            console.log(`📊 Rol: ${role} (${usersByRole[role].length} usuarios)`);
            usersByRole[role].forEach(user => {
                console.log(`  - ${user.name} (${user.email}) - Creado: ${user.createdAt.toLocaleDateString()}`);
            });
            console.log('');
        });

        // Verificar usuarios activos
        const activeUsers = users.filter(user => user.isActive !== false);
        console.log(`✅ Usuarios activos: ${activeUsers.length}`);

        // Verificar usuarios inactivos
        const inactiveUsers = users.filter(user => user.isActive === false);
        if (inactiveUsers.length > 0) {
            console.log(`⚠️  Usuarios inactivos: ${inactiveUsers.length}`);
            inactiveUsers.forEach(user => {
                console.log(`  - ${user.name} (${user.email})`);
            });
        }

        // Verificar usuarios sin email
        const usersWithoutEmail = users.filter(user => !user.email);
        if (usersWithoutEmail.length > 0) {
            console.log(`\n❌ Usuarios sin email: ${usersWithoutEmail.length}`);
            usersWithoutEmail.forEach(user => {
                console.log(`  - ${user.name} (ID: ${user._id})`);
            });
        }

        // Verificar usuarios sin nombre
        const usersWithoutName = users.filter(user => !user.name);
        if (usersWithoutName.length > 0) {
            console.log(`\n❌ Usuarios sin nombre: ${usersWithoutName.length}`);
            usersWithoutName.forEach(user => {
                console.log(`  - ${user.email} (ID: ${user._id})`);
            });
        }

        console.log('\n✅ Verificación de usuarios completada');

    } catch (error) {
        console.error('❌ Error durante la verificación:', error);
    } finally {
        mongoose.connection.close();
    }
}

checkUsers(); 