import React from 'react';
import {
    Paper,
    Typography,
    Box,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Chip,
    useTheme,
    Alert,
    AlertTitle
} from '@mui/material';
import {
    Error,
    Warning,
    Info,
    CheckCircle
} from '@mui/icons-material';

const SystemAlerts = ({ alerts, loading }) => {
    const theme = useTheme();

    const getAlertIcon = (type) => {
        switch (type) {
            case 'error':
                return <Error color="error" />;
            case 'warning':
                return <Warning color="warning" />;
            case 'info':
                return <Info color="info" />;
            case 'success':
                return <CheckCircle color="success" />;
            default:
                return <Info color="info" />;
        }
    };

    const getAlertColor = (type) => {
        switch (type) {
            case 'error':
                return theme.palette.error.main;
            case 'warning':
                return theme.palette.warning.main;
            case 'info':
                return theme.palette.info.main;
            case 'success':
                return theme.palette.success.main;
            default:
                return theme.palette.info.main;
        }
    };

    if (loading) {
        return (
            <Paper sx={{ p: 3, minHeight: 200 }}>
                <Typography variant="h6" fontWeight={700} mb={2}>
                    Alertas del Sistema
                </Typography>
                <Box>
                    <Typography>Cargando alertas...</Typography>
                </Box>
            </Paper>
        );
    }

    if (!alerts || alerts.length === 0) {
        return (
            <Paper sx={{ p: 3, minHeight: 200 }}>
                <Typography variant="h6" fontWeight={700} mb={2}>
                    Alertas del Sistema
                </Typography>
                <Alert severity="success" sx={{ mt: 2 }}>
                    <AlertTitle>¡Todo en orden!</AlertTitle>
                    No hay alertas activas en el sistema. El rendimiento es óptimo.
                </Alert>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3, minHeight: 200 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={700}>
                    Alertas del Sistema
                </Typography>
                <Chip
                    label={`${alerts.length} alerta${alerts.length > 1 ? 's' : ''}`}
                    size="small"
                    color={alerts.some(a => a.type === 'error') ? "error" : "warning"}
                    variant="outlined"
                />
            </Box>
            <List>
                {alerts.map((alert, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                            {getAlertIcon(alert.type)}
                        </ListItemIcon>
                        <ListItemText
                            primary={
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Typography variant="subtitle1" fontWeight={600}>
                                        {alert.message}
                                    </Typography>
                                    {alert.count && (
                                        <Chip
                                            label={alert.count}
                                            size="small"
                                            color={alert.type}
                                            variant="filled"
                                        />
                                    )}
                                </Box>
                            }
                            secondary={
                                <Typography variant="body2" color="text.secondary">
                                    {alert.type === 'error' && 'Requiere atención inmediata'}
                                    {alert.type === 'warning' && 'Revisar y tomar acción'}
                                    {alert.type === 'info' && 'Información importante'}
                                </Typography>
                            }
                        />
                    </ListItem>
                ))}
            </List>
        </Paper>
    );
};

export default SystemAlerts; 