#!/usr/bin/env node

/**
 * Script para migrar categorías existentes a áreas
 */

const mongoose = require('mongoose');
const Area = require('../models/Area');
const Incident = require('../models/Incident');
require('dotenv').config();

async function migrateCategoriesToAreas() {
    try {
        // Conectar a MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/incident-management');
        console.log('✅ Conectado a MongoDB');

        // Verificar si ya existen áreas
        const existingAreas = await Area.find();
        if (existingAreas.length > 0) {
            console.log('⚠️  Ya existen áreas en la base de datos. Saltando migración.');
            console.log(`Áreas existentes: ${existingAreas.map(a => a.name).join(', ')}`);
            return;
        }

        // Crear áreas por defecto
        const defaultAreas = [
            { name: 'Soporte Técnico', description: 'Problemas técnicos y de hardware', color: '#2196F3' },
            { name: 'Software', description: 'Problemas con aplicaciones y software', color: '#4CAF50' },
            { name: 'Redes', description: 'Problemas de conectividad y red', color: '#FF9800' },
            { name: 'Seguridad', description: 'Problemas de seguridad y acceso', color: '#F44336' },
            { name: 'Administrativo', description: 'Problemas administrativos y de procesos', color: '#9C27B0' },
            { name: 'Otros', description: 'Otros tipos de problemas', color: '#607D8B' }
        ];

        console.log('🔄 Creando áreas por defecto...');
        const createdAreas = await Area.insertMany(defaultAreas);
        console.log(`✅ Creadas ${createdAreas.length} áreas por defecto`);

        // Migrar incidencias existentes
        console.log('🔄 Migrando incidencias existentes...');
        const incidents = await Incident.find({});

        let updatedCount = 0;
        for (const incident of incidents) {
            // Si la incidencia tiene category, migrarla a area
            if (incident.category && !incident.area) {
                // Buscar un área que coincida con la categoría
                let targetArea = await Area.findOne({ name: incident.category });

                // Si no existe, usar "Otros" como área por defecto
                if (!targetArea) {
                    targetArea = await Area.findOne({ name: 'Otros' });
                }

                if (targetArea) {
                    incident.area = targetArea.name;
                    await incident.save();
                    updatedCount++;
                }
            }
        }

        console.log(`✅ Migradas ${updatedCount} incidencias`);

        // Mostrar estadísticas finales
        const finalAreas = await Area.find();
        const finalIncidents = await Incident.find();

        console.log('\n📊 ESTADÍSTICAS FINALES:');
        console.log(`   Áreas creadas: ${finalAreas.length}`);
        console.log(`   Incidencias migradas: ${updatedCount}`);
        console.log(`   Total de incidencias: ${finalIncidents.length}`);

        console.log('\n✅ Migración completada exitosamente');

    } catch (error) {
        console.error('❌ Error durante la migración:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado de MongoDB');
    }
}

// Ejecutar la migración
if (require.main === module) {
    migrateCategoriesToAreas();
}

module.exports = { migrateCategoriesToAreas }; 