import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Grid, Typography, Box, useTheme, Skeleton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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

const Dashboard = () => {
    const [incidencias, setIncidencias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRange, setSelectedRange] = useState({ label: 'Últimos 7 días', value: 'week', days: 7 });
    const theme = useTheme();
    const navigate = useNavigate();

    // Función optimizada para obtener datos
    const fetchIncidencias = useCallback(async () => {
        try {
            // Verificar caché primero
            if (isCacheValid()) {
                setIncidencias(getCachedData());
                setLoading(false);
                return;
            }

            const token = localStorage.getItem('token');
            const res = await axios.get('/api/incidents', {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Actualizar caché
            updateCache(res.data);
            setIncidencias(res.data);
        } catch (err) {
            console.error('Error fetching incidents:', err);
            setIncidencias([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Cargar datos al montar el componente
    useEffect(() => {
        fetchIncidencias();
    }, [fetchIncidencias]);

    // Memoizar cálculos para evitar recálculos innecesarios
    const filteredIncidencias = useMemo(() => {
        if (!incidencias.length) return [];

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

    const porCategoria = useMemo(() => {
        const counts = {};
        filteredIncidencias.forEach(i => {
            const key = i.categoria || 'Sin categoría';
            counts[key] = (counts[key] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [filteredIncidencias]);

    const porPrioridad = useMemo(() => {
        const counts = {};
        filteredIncidencias.forEach(i => {
            const key = i.prioridad || 'Sin prioridad';
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
    }, []);

    const handleRefresh = useCallback(() => {
        setLoading(true);
        fetchIncidencias();
    }, [fetchIncidencias]);

    const handleAction = useCallback((action) => {
        switch (action) {
            case 'new-incident':
                navigate('/incidents/new');
                break;
            case 'assign-incidents':
                navigate('/assignments');
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
            case 'categories':
                navigate('/categories');
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

            {/* Acciones rápidas */}
            <QuickActions onAction={handleAction} />

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
                {/* Gráfico por categoría */}
                <Grid item xs={12} md={6}>
                    <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, height: 400 }}>
                        <Typography variant="h6" fontWeight={700} mb={2}>
                            Incidencias por Categoría
                        </Typography>
                        {loading ? (
                            <Skeleton variant="rectangular" height={300} />
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={porCategoria}>
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

            {/* Gráfico de asignados */}
            <Box mt={4}>
                <AssigneeChart data={assigneeData} loading={loading} />
            </Box>

            {/* Performance Metrics */}
            <Box mt={4}>
                <PerformanceMetrics metrics={performanceMetrics} loading={loading} />
            </Box>
        </Container>
    );
};

export default Dashboard; 