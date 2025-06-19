const NodeCache = require('node-cache');

// Crear una instancia de caché con un TTL de 5 minutos
const cache = new NodeCache({ stdTTL: 300 });

// Función para obtener datos de la caché o de la base de datos
const getCachedData = async (key, fetchData) => {
    // Intentar obtener datos de la caché
    const cachedData = cache.get(key);
    if (cachedData) {
        return cachedData;
    }

    // Si no hay datos en caché, obtenerlos de la fuente original
    const freshData = await fetchData();

    // Guardar en caché
    cache.set(key, freshData);

    return freshData;
};

// Función para invalidar la caché
const invalidateCache = (key) => {
    cache.del(key);
};

// Función para invalidar múltiples claves de caché
const invalidateMultipleCache = (keys) => {
    cache.del(keys);
};

// Función para limpiar toda la caché
const clearCache = () => {
    cache.flushAll();
};

// Función para obtener estadísticas de la caché
const getCacheStats = () => {
    return cache.getStats();
};

module.exports = {
    getCachedData,
    invalidateCache,
    invalidateMultipleCache,
    clearCache,
    getCacheStats,
}; 