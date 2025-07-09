const mongoose = require('mongoose');
const Area = require('../models/Area');
const Incident = require('../models/Incident');

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/incident-management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function checkMigration() {
    try {
        console.log('🔍 Verificando migración de categorías a áreas...');

        // Verificar áreas existentes
        const areas = await Area.find();
        console.log(`📊 Áreas encontradas: ${areas.length}`);
        areas.forEach(area => {
            console.log(`  - ${area.name} (${area.description})`);
        });

        // Verificar incidencias con categorías
        const incidentsWithCategories = await Incident.find({ category: { $exists: true, $ne: null } });
        console.log(`📋 Incidencias con categorías: ${incidentsWithCategories.length}`);

        // Verificar incidencias con áreas
        const incidentsWithAreas = await Incident.find({ area: { $exists: true, $ne: null } });
        console.log(`📋 Incidencias con áreas: ${incidentsWithAreas.length}`);

        // Mostrar estadísticas
        console.log('\n📈 Estadísticas de migración:');
        console.log(`  - Total incidencias: ${await Incident.countDocuments()}`);
        console.log(`  - Con categorías: ${incidentsWithCategories.length}`);
        console.log(`  - Con áreas: ${incidentsWithAreas.length}`);
        console.log(`  - Sin categoría ni área: ${await Incident.countDocuments({
            category: { $exists: false },
            area: { $exists: false }
        })}`);

        console.log('\n✅ Verificación completada');

    } catch (error) {
        console.error('❌ Error durante la verificación:', error);
    } finally {
        mongoose.connection.close();
    }
}

checkMigration();
