const mongoose = require('mongoose');
const Incident = require('./models/Incident');
const User = require('./models/User');

mongoose.connect('mongodb://localhost/incidencias', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(async () => {
        console.log('MongoDB conectado');
        try {
            const incidents = await Incident.find()
                .populate('assignedTo', 'name email')
                .populate('createdBy', 'name email');

            console.log('\nTotal de incidencias:', incidents.length);

            if (incidents.length > 0) {
                incidents.forEach(inc => {
                    console.log('\n-------------------');
                    console.log('ID:', inc._id);
                    console.log('Asunto:', inc.subject);
                    console.log('Estado:', inc.status);
                    console.log('Categoría:', inc.category);
                    console.log('Prioridad:', inc.priority);
                    console.log('Creado por:', inc.createdBy?.name || 'No disponible');
                    console.log('Asignado a:', inc.assignedTo?.name || 'No asignado');
                    console.log('Fecha de creación:', inc.createdAt);
                });
            } else {
                console.log('No hay incidencias en la base de datos');
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            mongoose.connection.close();
        }
    })
    .catch(err => {
        console.error('Error de conexión:', err);
        process.exit(1);
    }); 