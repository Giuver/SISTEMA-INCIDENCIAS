const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const createAdmin = async () => {
    try {
        // Conectar a MongoDB Atlas usando la variable de entorno
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        // Verificar si el admin ya existe
        const adminExists = await User.findOne({ email: 'admin@example.com' });

        if (adminExists) {
            console.log('El usuario admin ya existe');
            process.exit(0);
        }

        // Crear el usuario admin
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        const admin = new User({
            name: 'Administrador',
            email: 'admin@example.com',
            password: hashedPassword,
            role: 'admin'
        });

        await admin.save();
        console.log('Usuario admin creado exitosamente');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

createAdmin(); 