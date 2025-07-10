const mongoose = require('mongoose');
const Incident = require('../models/Incident');
const Area = require('../models/Area');

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/incident-management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function migrateCategoriesToAreas() {
    try {
        console.log('🔄 Migrando categorías a áreas...\n');

        // Obtener todas las incidencias con categorías
        const incidentsWithCategories = await Incident.find({
            category: { $exists: true, $ne: null }
        });

        if (incidentsWithCategories.length === 0) {
            console.log('✅ No hay incidencias con categorías para migrar');
            return;
        }

        console.log(`📋 Encontradas ${incidentsWithCategories.length} incidencias con categorías`);

        // Obtener categorías únicas
        const uniqueCategories = [...new Set(incidentsWithCategories.map(incident => incident.category))];
        console.log(`📊 Categorías únicas encontradas: ${uniqueCategories.length}`);
        uniqueCategories.forEach(category => console.log(`  - ${category}`));

        // Crear áreas basadas en categorías
        const areaMapping = {};
        for (const category of uniqueCategories) {
            // Verificar si ya existe un área con ese nombre
            let area = await Area.findOne({ name: category });

            if (!area) {
                // Crear nueva área
                area = new Area({
                    name: category,
                    description: `Área migrada desde categoría: ${category}`,
                    isActive: true
                });
                await area.save();
                console.log(`✅ Área creada: ${category}`);
            } else {
                console.log(`ℹ️  Área ya existe: ${category}`);
            }

            areaMapping[category] = area._id;
        }

        // Migrar incidencias
        let migratedCount = 0;
        for (const incident of incidentsWithCategories) {
            if (incident.category && areaMapping[incident.category]) {
                await Incident.findByIdAndUpdate(incident._id, {
                    $set: {
                        area: areaMapping[incident.category],
                        category: undefined // Remover categoría
                    }
                });
                migratedCount++;
            }
        }

        console.log(`\n✅ Migración completada:`);
        console.log(`  - Incidencias migradas: ${migratedCount}`);
        console.log(`  - Áreas creadas: ${Object.keys(areaMapping).length}`);

        // Verificar resultado
        const incidentsWithAreas = await Incident.find({ area: { $exists: true, $ne: null } });
        const remainingIncidentsWithCategories = await Incident.find({ category: { $exists: true, $ne: null } });

        console.log(`\n📊 Resultado de la migración:`);
        console.log(`  - Incidencias con áreas: ${incidentsWithAreas.length}`);
        console.log(`  - Incidencias con categorías: ${remainingIncidentsWithCategories.length}`);

        // Mostrar áreas creadas
        const allAreas = await Area.find();
        console.log(`\n📊 Áreas en el sistema:`);
        allAreas.forEach(area => {
            console.log(`  - ${area.name} (${area.description})`);
        });

        console.log('\n✅ Migración de categorías a áreas completada exitosamente');

    } catch (error) {
        console.error('❌ Error durante la migración:', error);
    } finally {
        mongoose.connection.close();
    }
}

migrateCategoriesToAreas();