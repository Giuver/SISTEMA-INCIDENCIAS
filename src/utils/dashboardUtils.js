import { format, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

// Cache para almacenar datos temporalmente
const cache = {
    data: null,
    timestamp: null,
    ttl: 5 * 60 * 1000 // 5 minutos
};

// Función para verificar si el caché es válido
export const isCacheValid = () => {
    if (!cache.data || !cache.timestamp) return false;
    return Date.now() - cache.timestamp < cache.ttl;
};

// Función para actualizar el caché
export const updateCache = (data) => {
    cache.data = data;
    cache.timestamp = Date.now();
};

// Función para obtener datos del caché
export const getCachedData = () => cache.data;

// Función para procesar datos por rango de fechas
export const filterByDateRange = (data, startDate, endDate) => {
    return data.filter(incident => {
        const incidentDate = new Date(incident.createdAt);
        return isWithinInterval(incidentDate, {
            start: startOfDay(startDate),
            end: endOfDay(endDate)
        });
    });
};

// Función para calcular tiempo promedio de resolución
export const calculateAverageResolutionTime = (incidents) => {
    const resolvedIncidents = incidents.filter(inc => inc.estado === 'resuelto' && inc.fechaResolucion);
    if (resolvedIncidents.length === 0) return 0;

    const totalTime = resolvedIncidents.reduce((acc, inc) => {
        const start = new Date(inc.createdAt);
        const end = new Date(inc.fechaResolucion);
        return acc + (end - start);
    }, 0);

    return Math.round(totalTime / resolvedIncidents.length / (1000 * 60 * 60)); // Horas
};

// Función para obtener tendencias diarias
export const getDailyTrends = (incidents, days = 7) => {
    const trends = [];
    for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const formattedDate = format(date, 'dd/MM');
        const count = incidents.filter(inc => {
            const incidentDate = new Date(inc.createdAt);
            return format(incidentDate, 'dd/MM') === formattedDate;
        }).length;
        trends.push({ date: formattedDate, count });
    }
    return trends;
};

// Función para calcular KPIs
export const calculateKPIs = (incidents) => {
    const total = incidents.length;
    const resueltas = incidents.filter(i => i.estado === 'resuelto').length;
    const pendientes = incidents.filter(i => i.estado === 'pendiente').length;
    const enProceso = incidents.filter(i => i.estado === 'en_proceso').length;
    const altaPrioridad = incidents.filter(i => i.prioridad === 'alta').length;
    const asignadas = incidents.filter(i => i.asignado).length;

    return {
        total,
        resueltas,
        pendientes,
        enProceso,
        altaPrioridad,
        asignadas,
        tasaResolucion: total ? Math.round((resueltas / total) * 100) : 0,
        tiempoPromedioResolucion: calculateAverageResolutionTime(incidents)
    };
};

// Función para agrupar por asignado
export const groupByAssignee = (incidents) => {
    const grouped = {};
    incidents.forEach(inc => {
        const assignee = inc.asignado?.nombre || 'Sin asignar';
        grouped[assignee] = (grouped[assignee] || 0) + 1;
    });
    return Object.entries(grouped)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // Top 5 asignados
};

// Función para calcular distribución por categoría y estado
export const getCategoryStateDistribution = (incidents) => {
    const distribution = {};
    incidents.forEach(inc => {
        const category = inc.categoria || 'Sin categoría';
        const state = inc.estado || 'sin_estado';
        if (!distribution[category]) {
            distribution[category] = {
                pendiente: 0,
                en_proceso: 0,
                resuelto: 0
            };
        }
        distribution[category][state] = (distribution[category][state] || 0) + 1;
    });
    return distribution;
};

// Función para calcular métricas de rendimiento avanzadas
export const calculatePerformanceMetrics = (incidents) => {
    const total = incidents.length;
    const resueltas = incidents.filter(i => i.estado === 'resuelto').length;
    const altaPrioridad = incidents.filter(i => i.prioridad === 'alta').length;
    const criticas = incidents.filter(i => i.prioridad === 'alta' && i.estado !== 'resuelto').length;

    // Calcular tiempo promedio de resolución
    const tiempoPromedio = calculateAverageResolutionTime(incidents);

    // Calcular tasa de resolución
    const tasaResolucion = total ? Math.round((resueltas / total) * 100) : 0;

    // Calcular satisfacción (simulado basado en tiempo de resolución)
    const satisfaccion = Math.max(0, Math.min(100, 100 - (tiempoPromedio * 2)));

    return {
        tasaResolucion,
        tiempoPromedioResolucion: tiempoPromedio,
        satisfaccion: Math.round(satisfaccion),
        incidenciasCriticas: criticas,
        totalIncidencias: total,
        incidenciasResueltas: resueltas,
        incidenciasAltaPrioridad: altaPrioridad
    };
};

// Función para calcular tendencias de rendimiento
export const getPerformanceTrends = (incidents, days = 30) => {
    const trends = [];
    for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dayIncidents = incidents.filter(inc => {
            const incidentDate = new Date(inc.createdAt);
            return format(incidentDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
        });

        const resolved = dayIncidents.filter(inc => inc.estado === 'resuelto').length;
        const total = dayIncidents.length;
        const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

        trends.push({
            date: format(date, 'dd/MM'),
            total,
            resolved,
            resolutionRate
        });
    }
    return trends;
};

// Función para calcular SLA (Service Level Agreement)
export const calculateSLA = (incidents) => {
    const slaTarget = 24; // 24 horas para resolución
    const resolvedIncidents = incidents.filter(inc => inc.estado === 'resuelto' && inc.fechaResolucion);

    if (resolvedIncidents.length === 0) return 0;

    const withinSLA = resolvedIncidents.filter(inc => {
        const start = new Date(inc.createdAt);
        const end = new Date(inc.fechaResolucion);
        const hours = (end - start) / (1000 * 60 * 60);
        return hours <= slaTarget;
    }).length;

    return Math.round((withinSLA / resolvedIncidents.length) * 100);
};

// Función para obtener alertas y notificaciones
export const getAlerts = (incidents) => {
    const alerts = [];

    // Alertas de incidencias críticas sin asignar
    const criticalUnassigned = incidents.filter(inc =>
        inc.prioridad === 'alta' && !inc.asignado && inc.estado !== 'resuelto'
    );

    if (criticalUnassigned.length > 0) {
        alerts.push({
            type: 'error',
            message: `${criticalUnassigned.length} incidencias críticas sin asignar`,
            count: criticalUnassigned.length
        });
    }

    // Alertas de incidencias pendientes por mucho tiempo
    const oldPending = incidents.filter(inc => {
        if (inc.estado !== 'pendiente') return false;
        const created = new Date(inc.createdAt);
        const now = new Date();
        const hours = (now - created) / (1000 * 60 * 60);
        return hours > 48; // Más de 48 horas
    });

    if (oldPending.length > 0) {
        alerts.push({
            type: 'warning',
            message: `${oldPending.length} incidencias pendientes por más de 48 horas`,
            count: oldPending.length
        });
    }

    // Alertas de rendimiento bajo
    const resolutionRate = calculateKPIs(incidents).tasaResolucion;
    if (resolutionRate < 70) {
        alerts.push({
            type: 'warning',
            message: `Tasa de resolución baja: ${resolutionRate}%`,
            count: resolutionRate
        });
    }

    return alerts;
}; 