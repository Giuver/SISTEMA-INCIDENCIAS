import React from 'react';
import {
    Paper,
    Typography,
    Box,
    Grid,
    LinearProgress,
    useTheme,
    Chip
} from '@mui/material';
import {
    Speed,
    TrendingUp,
    TrendingDown,
    CheckCircle,
    Warning,
    Error
} from '@mui/icons-material';

const PerformanceMetrics = ({ metrics, loading }) => {
    const theme = useTheme();

    const getPerformanceColor = (value, threshold) => {
        if (value >= threshold * 0.8) return theme.palette.success.main;
        if (value >= threshold * 0.6) return theme.palette.warning.main;
        return theme.palette.error.main;
    };

    const getPerformanceIcon = (value, threshold) => {
        if (value >= threshold * 0.8) return <CheckCircle color="success" />;
        if (value >= threshold * 0.6) return <Warning color="warning" />;
        return <Error color="error" />;
    };

    if (loading) {
        return (
            <Paper sx={{ p: 3, minHeight: 200 }}>
                <Typography variant="h6" fontWeight={700} mb={2}>
                    Métricas de Rendimiento
                </Typography>
                <Box>
                    <LinearProgress />
                </Box>
            </Paper>
        );
    }

    const performanceData = [
        {
            title: 'Tasa de Resolución',
            value: metrics?.tasaResolucion || 0,
            maxValue: 100,
            unit: '%',
            description: 'Porcentaje de incidencias resueltas'
        },
        {
            title: 'Tiempo Promedio de Resolución',
            value: metrics?.tiempoPromedioResolucion || 0,
            maxValue: 48,
            unit: 'h',
            description: 'Tiempo promedio para resolver incidencias'
        },
        {
            title: 'Satisfacción del Usuario',
            value: metrics?.satisfaccion || 85,
            maxValue: 100,
            unit: '%',
            description: 'Nivel de satisfacción general'
        },
        {
            title: 'Incidencias Críticas',
            value: metrics?.incidenciasCriticas || 0,
            maxValue: 10,
            unit: '',
            description: 'Incidencias de alta prioridad pendientes'
        }
    ];

    return (
        <Paper sx={{ p: 3, minHeight: 200 }}>
            <Typography variant="h6" fontWeight={700} mb={3}>
                Métricas de Rendimiento
            </Typography>
            <Grid container spacing={3}>
                {performanceData.map((metric, index) => {
                    const percentage = (metric.value / metric.maxValue) * 100;
                    const color = getPerformanceColor(metric.value, metric.maxValue);
                    const icon = getPerformanceIcon(metric.value, metric.maxValue);

                    return (
                        <Grid item xs={12} sm={6} key={index}>
                            <Box>
                                <Box display="flex" alignItems="center" gap={1} mb={1}>
                                    {icon}
                                    <Typography variant="subtitle1" fontWeight={600}>
                                        {metric.title}
                                    </Typography>
                                </Box>
                                <Box display="flex" alignItems="center" gap={2} mb={1}>
                                    <Typography variant="h4" color={color} fontWeight={700}>
                                        {metric.value}{metric.unit}
                                    </Typography>
                                    <Chip
                                        label={`${percentage.toFixed(1)}%`}
                                        size="small"
                                        color={percentage >= 80 ? "success" : percentage >= 60 ? "warning" : "error"}
                                        variant="outlined"
                                    />
                                </Box>
                                <Typography variant="body2" color="text.secondary" mb={2}>
                                    {metric.description}
                                </Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={Math.min(percentage, 100)}
                                    sx={{
                                        height: 8,
                                        borderRadius: 4,
                                        bgcolor: theme.palette.grey[200],
                                        '& .MuiLinearProgress-bar': {
                                            bgcolor: color,
                                            borderRadius: 4
                                        }
                                    }}
                                />
                            </Box>
                        </Grid>
                    );
                })}
            </Grid>
        </Paper>
    );
};

export default PerformanceMetrics; 