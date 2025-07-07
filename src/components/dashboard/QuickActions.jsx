import React from 'react';
import {
    Paper,
    Box,
    Button,
    Typography,
    useTheme,
    Grid,
    Card,
    CardContent,
    CardActionArea
} from '@mui/material';
import {
    Add,
    Assignment,
    Assessment,
    TrendingUp,
    Notifications,
    Settings,
    Group,
    Category
} from '@mui/icons-material';

const QuickActions = ({ onAction }) => {
    const theme = useTheme();

    const actions = [
        {
            title: 'Nueva Incidencia',
            description: 'Crear una nueva incidencia',
            icon: <Add />,
            color: theme.palette.success.main,
            action: 'new-incident'
        },

        {
            title: 'Ver Reportes',
            description: 'Generar reportes detallados',
            icon: <Assessment />,
            color: theme.palette.info.main,
            action: 'reports'
        },
        {
            title: 'Análisis de Tendencias',
            description: 'Ver métricas avanzadas',
            icon: <TrendingUp />,
            color: theme.palette.warning.main,
            action: 'trends'
        },
        {
            title: 'Gestión de Usuarios',
            description: 'Administrar usuarios del sistema',
            icon: <Group />,
            color: theme.palette.secondary.main,
            action: 'users'
        },
        {
            title: 'Áreas',
            description: 'Gestionar áreas de incidencias',
            icon: <Category />,
            color: theme.palette.error.main,
            action: 'areas'
        }
    ];

    return (
        <Paper sx={{ p: 3, mb: 3, bgcolor: theme.palette.background.paper }}>
            <Typography variant="h6" fontWeight={700} mb={3}>
                Acciones Rápidas
            </Typography>
            <Grid container spacing={2}>
                {actions.map((action, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card
                            sx={{
                                height: '100%',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: 4
                                }
                            }}
                        >
                            <CardActionArea
                                onClick={() => onAction(action.action)}
                                sx={{ height: '100%', p: 2 }}
                            >
                                <CardContent>
                                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                                        <Box
                                            sx={{
                                                p: 1,
                                                borderRadius: 1,
                                                bgcolor: `${action.color}20`,
                                                color: action.color
                                            }}
                                        >
                                            {action.icon}
                                        </Box>
                                        <Typography variant="h6" fontWeight={600}>
                                            {action.title}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary">
                                        {action.description}
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Paper>
    );
};

export default QuickActions; 