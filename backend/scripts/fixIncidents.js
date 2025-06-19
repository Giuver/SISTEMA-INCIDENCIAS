const mongoose = require('mongoose');
const Incident = require('../models/Incident');

const estadosValidos = ['pendiente', 'en_proceso', 'resuelto', 'cerrado'];
const prioridadesValidas = ['Baja', 'Media', 'Alta', 'Crítica'];

async function fixIncidents() {
    await mongoose.connect('mongodb://localhost:27017/incident-management', {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    const incidents = await Incident.find();
    let count = 0;

    for (const inc of incidents) {
        let modificado = false;
        // Estado
        if (!inc.estado || !estadosValidos.includes(inc.estado)) {
            inc.estado = 'pendiente';
            modificado = true;
        }
        // Prioridad
        if (!inc.prioridad || !prioridadesValidas.includes(inc.prioridad)) {
            inc.prioridad = 'Media';
            modificado = true;
        }
        // Categoría
        if (!inc.categoria) {
            inc.categoria = 'Sin dato';
            modificado = true;
        }
        if (modificado) {
            await inc.save();
            count++;
        }
    }
    console.log(`Incidencias actualizadas: ${count}`);
    mongoose.disconnect();
}

fixIncidents(); 