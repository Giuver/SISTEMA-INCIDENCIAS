import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Grid, Typography, Box, useTheme, Skeleton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../utils/apiService';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';

// Componentes
import DateFilters from '../components/dashboard/DateFilters';
import KPICards from '../components/dashboard/KPICards';
import QuickActions from '../components/dashboard/QuickActions';
import TrendsChart from '../components/dashboard/TrendsChart';
import RecentIncidents from '../components/dashboard/RecentIncidents';
import AssigneeChart from '../components/dashboard/AssigneeChart';
import PerformanceMetrics from '../components/dashboard/PerformanceMetrics';
import SystemAlerts from '../components/dashboard/SystemAlerts';
import RiskDashboard from '../components/dashboard/RiskDashboard';

// Utilidades
import {
    filterByDateRange,
    calculateKPIs,
    getDailyTrends,
    groupByAssignee,
    calculatePerformanceMetrics,
    getAlerts,
    calculateSLA,
    isCacheValid,
    getCachedData,
    updateCache
} from '../utils/dashboardUtils';
import sessionManager from '../utils/sessionManager';

const Dashboard = () => {
    const [incidencias, setIncidencias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRange, setSelectedRange] = useState({ label: 'Últimos 7 días', value: 'week', days: 7 });
    const theme = useTheme();
    const navigate = useNavigate();

    // Función optimizada para obtener datos
    const fetchIncidencias = useCallback(async (range = selectedRange) => {
        try {
            setLoading(true);
            // Calcular fechas desde el filtro
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - range.days);
            // Formatear fechas a ISO
            const from = startDate.toISOString();
            const to = endDate.toISOString();
            // Petición con filtros y límite alto
            const res = await apiService.get(`/incidents?from=${from}&to=${to}&limit=1000`);
            updateCache(res.incidents || res.data || []);
            setIncidencias(res.incidents || res.data || []);
        } catch (err) {
            console.error('Error fetching incidents:', err);
            setIncidencias([]);
        } finally {
            setLoading(false);
        }
    }, [selectedRange]);

    // Cargar datos al montar el componente y cuando cambie el filtro de fechas
    useEffect(() => {
        fetchIncidencias(selectedRange);
    }, [fetchIncidencias, selectedRange]);

    // Memoizar cálculos para evitar recálculos innecesarios
    const filteredIncidencias = useMemo(() => {
        if (!incidencias || !incidencias.length) return [];

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - selectedRange.days);

        return filterByDateRange(incidencias, startDate, endDate);
    }, [incidencias, selectedRange.days]);

    const kpis = useMemo(() => {
        return calculateKPIs(filteredIncidencias);
    }, [filteredIncidencias]);

    const trendsData = useMemo(() => {
        return getDailyTrends(filteredIncidencias, selectedRange.days);
    }, [filteredIncidencias, selectedRange.days]);

    const assigneeData = useMemo(() => {
        return groupByAssignee(filteredIncidencias);
    }, [filteredIncidencias]);

    // Métricas de rendimiento
    const performanceMetrics = useMemo(() => {
        return calculatePerformanceMetrics(filteredIncidencias);
    }, [filteredIncidencias]);

    // Alertas del sistema
    const alerts = useMemo(() => {
        return getAlerts(filteredIncidencias);
    }, [filteredIncidencias]);

    // SLA
    const sla = useMemo(() => {
        return calculateSLA(filteredIncidencias);
    }, [filteredIncidencias]);

    // Datos para gráficos
    const porEstado = useMemo(() => {
        const counts = {};
        filteredIncidencias.forEach(i => {
            const key = i.estado || 'Sin dato';
            counts[key] = (counts[key] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [filteredIncidencias]);

    const porArea = useMemo(() => {
        const counts = {};
        filteredIncidencias.forEach(i => {
            const key = i.area || 'Sin área';
            counts[key] = (counts[key] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [filteredIncidencias]);

    const porPrioridad = useMemo(() => {
        const counts = {};
        filteredIncidencias.forEach(i => {
            const key = i.priority || 'Sin prioridad';
            counts[key] = (counts[key] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [filteredIncidencias]);

    // Incidencias recientes (últimas 5)
    const recientes = useMemo(() => {
        return filteredIncidencias
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);
    }, [filteredIncidencias]);

    // Colores para gráficos
    const COLORS = useMemo(() => [
        theme.palette.success.main,
        theme.palette.warning.main,
        theme.palette.error.main,
        theme.palette.primary.main,
        theme.palette.secondary.main
    ], [theme]);

    // Manejadores de eventos
    const handleRangeChange = useCallback((range) => {
        setSelectedRange(range);
        fetchIncidencias(range);
    }, [fetchIncidencias]);

    const handleRefresh = useCallback(() => {
        setLoading(true);
        fetchIncidencias();
    }, [fetchIncidencias]);

    const handleAction = useCallback((action) => {
        switch (action) {
            case 'new-incident':
                navigate('/incidents/new');
                break;

            case 'reports':
                navigate('/reports');
                break;
            case 'trends':
                navigate('/trends');
                break;
            case 'users':
                navigate('/users');
                break;
            case 'areas':
                navigate('/areas');
                break;
            default:
                break;
        }
    }, [navigate]);

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            {/* Header */}
            <Typography variant="h4" fontWeight={700} color={theme.palette.primary.main} gutterBottom>
                ¡Bienvenido, Administrador Sistema!
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" mb={4}>
                Resumen de la actividad del sistema de incidencias
            </Typography>

            {/* Filtros de fecha */}
            <DateFilters
                selectedRange={selectedRange}
                onRangeChange={handleRangeChange}
                onRefresh={handleRefresh}
            />

            {/* Tarjetas KPI */}
            <Box mb={4}>
                <KPICards kpis={kpis} loading={loading} />
            </Box>

            {/* Gráfico de tendencias */}
            <Box mb={4}>
                <TrendsChart data={trendsData} loading={loading} />
            </Box>

            {/* Sección principal de gráficos y datos */}
            <Grid container spacing={3} mb={4}>
                {/* Incidencias recientes */}
                <Grid item xs={12} lg={8}>
                    <RecentIncidents
                        incidents={recientes}
                        loading={loading}
                        onViewIncident={(id) => navigate(`/incidents/${id}`)}
                    />
                </Grid>

                {/* Alertas del sistema */}
                <Grid item xs={12} lg={4}>
                    <SystemAlerts alerts={alerts} loading={loading} />
                </Grid>
            </Grid>

            {/* Gráficos adicionales */}
            <Grid container spacing={3}>
                {/* Gráfico por área */}
                <Grid item xs={12} md={6}>
                    <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, height: 400 }}>
                        <Typography variant="h6" fontWeight={700} mb={2}>
                            Incidencias por Área
                        </Typography>
                        {loading ? (
                            <Skeleton variant="rectangular" height={300} />
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={porArea}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="value" fill={theme.palette.primary.main} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </Box>
                </Grid>

                {/* Gráfico por prioridad */}
                <Grid item xs={12} md={6}>
                    <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, height: 400 }}>
                        <Typography variant="h6" fontWeight={700} mb={2}>
                            Incidencias por Prioridad
                        </Typography>
                        {loading ? (
                            <Skeleton variant="rectangular" height={300} />
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={porPrioridad}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        label
                                    >
                                        {porPrioridad.map((entry, index) => (
                                            <Cell key={`cell-prio-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </Box>
                </Grid>
            </Grid>

            {/* Performance Metrics */}
            <Box mt={4}>
                <PerformanceMetrics metrics={performanceMetrics} loading={loading} />
            </Box>
        </Container>
    );
};

export default Dashboard; 