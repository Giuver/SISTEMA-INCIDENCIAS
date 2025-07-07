const mongoose = require('mongoose');
const User = require('../models/User');

const checkUsers = async () => {
    try {
        // Conectar a MongoDB
        await mongoose.connect('mongodb://localhost:27017/incident-management', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('Conectado a MongoDB');

        // Buscar todos los usuarios
        const users = await User.find({}).select('-password');

        console.log('Usuarios encontrados:', users.length);
        users.forEach(user => {
            console.log(`- ${user.name} (${user.email}) - Rol: ${user.role}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkUsers(); 