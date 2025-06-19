import React from 'react';
import { Grid, Card, CardContent, Box, Typography, Avatar, useTheme } from '@mui/material';
import {
    ListAlt,
    HourglassEmpty,
    Assignment,
    CheckCircle,
    TrendingUp,
    Warning,
    Speed,
    Group
} from '@mui/icons-material';

const KPICards = ({ kpis, loading }) => {
    const theme = useTheme();

    const kpiData = [
        {
            title: 'Total Incidencias',
            value: kpis?.total || 0,
            icon: <ListAlt />,
            color: theme.palette.success.main,
            bgColor: theme.palette.success.light
        },
        {
            title: 'Pendientes',
            value: kpis?.pendientes || 0,
            icon: <HourglassEmpty />,
            color: theme.palette.info.main,
            bgColor: theme.palette.info.light
        },
        {
            title: 'En Proceso',
            value: kpis?.enProceso || 0,
            icon: <Assignment />,
            color: theme.palette.warning.main,
            bgColor: theme.palette.warning.light
        },
        {
            title: 'Resueltas',
            value: kpis?.resueltas || 0,
            icon: <CheckCircle />,
            color: theme.palette.success.dark,
            bgColor: theme.palette.success.light
        },
        {
            title: 'Tasa Resolución',
            value: `${kpis?.tasaResolucion || 0}%`,
            icon: <TrendingUp />,
            color: theme.palette.primary.main,
            bgColor: theme.palette.primary.light
        },
        {
            title: 'Alta Prioridad',
            value: kpis?.altaPrioridad || 0,
            icon: <Warning />,
            color: theme.palette.error.main,
            bgColor: theme.palette.error.light
        },
        {
            title: 'Tiempo Promedio',
            value: `${kpis?.tiempoPromedioResolucion || 0}h`,
            icon: <Speed />,
            color: theme.palette.secondary.main,
            bgColor: theme.palette.secondary.light
        },
        {
            title: 'Asignadas',
            value: kpis?.asignadas || 0,
            icon: <Group />,
            color: theme.palette.info.dark,
            bgColor: theme.palette.info.light
        }
    ];

    return (
        <Grid container spacing={3}>
            {kpiData.map((kpi, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                    <Card
                        sx={{
                            bgcolor: theme.palette.background.paper,
                            boxShadow: 2,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: 4
                            }
                        }}
                    >
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                                <Avatar
                                    sx={{
                                        bgcolor: kpi.bgColor,
                                        color: kpi.color,
                                        width: 56,
                                        height: 56
                                    }}
                                >
                                    {kpi.icon}
                                </Avatar>
                                <Box flex={1}>
                                    <Typography
                                        variant="h6"
                                        color="text.secondary"
                                        sx={{ fontSize: '0.875rem', fontWeight: 500 }}
                                    >
                                        {kpi.title}
                                    </Typography>
                                    <Typography
                                        variant="h4"
                                        color={kpi.color}
                                        sx={{
                                            fontWeight: 700,
                                            fontSize: loading ? '1.5rem' : '2rem'
                                        }}
                                    >
                                        {loading ? '...' : kpi.value}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );
};

export default KPICards; 