const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { config } = require('../config/env');

const createTestUsers = async () => {
    try {
        // Conectar a MongoDB
        await mongoose.connect(config.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Conectado a MongoDB');

        // Verificar si ya existen usuarios
        const existingUsers = await User.find();
        if (existingUsers.length > 0) {
            console.log('ℹ️  Ya existen usuarios en la base de datos');
            return;
        }

        // Crear usuario administrador
        const adminPassword = await bcrypt.hash('admin123', 12);
        const admin = new User({
            name: 'Administrador',
            email: 'admin@example.com',
            password: adminPassword,
            role: 'admin'
        });
        await admin.save();
        console.log('✅ Usuario administrador creado');

        // Crear usuario de soporte
        const supportPassword = await bcrypt.hash('soporte123', 12);
        const support = new User({
            name: 'Soporte Técnico',
            email: 'soporte@example.com',
            password: supportPassword,
            role: 'soporte'
        });
        await support.save();
        console.log('✅ Usuario de soporte creado');

        // Crear usuario normal
        const userPassword = await bcrypt.hash('usuario123', 12);
        const user = new User({
            name: 'Usuario Normal',
            email: 'usuario@example.com',
            password: userPassword,
            role: 'usuario'
        });
        await user.save();
        console.log('✅ Usuario normal creado');

        console.log('\n📋 Credenciales de prueba:');
        console.log('👨‍💼 Admin: admin@example.com / admin123');
        console.log('🔧 Soporte: soporte@example.com / soporte123');
        console.log('👤 Usuario: usuario@example.com / usuario123');

    } catch (error) {
        console.error('❌ Error al crear usuarios de prueba:', error);
    } finally {
        await mongoose.connection.close();
        console.log('✅ Conexión cerrada');
    }
};

// Ejecutar si se llama directamente
if (require.main === module) {
    createTestUsers();
}

module.exports = { createTestUsers }; 