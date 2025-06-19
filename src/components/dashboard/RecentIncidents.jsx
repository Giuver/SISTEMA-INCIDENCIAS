import React from 'react';
import {
    Paper,
    Typography,
    List,
    ListItem,
    ListItemText,
    Chip,
    Divider,
    Box,
    Avatar,
    useTheme,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Visibility,
    Edit,
    Assignment,
    Schedule,
    CheckCircle,
    Warning,
    Error
} from '@mui/icons-material';

const RecentIncidents = ({ incidents, loading, onViewIncident }) => {
    const theme = useTheme();

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pendiente':
                return <Schedule color="info" />;
            case 'en_proceso':
                return <Assignment color="warning" />;
            case 'resuelto':
                return <CheckCircle color="success" />;
            default:
                return <Schedule color="disabled" />;
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'alta':
            case 'crítica':
                return 'error';
            case 'media':
                return 'warning';
            case 'baja':
                return 'success';
            default:
                return 'default';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pendiente':
                return 'info';
            case 'en_proceso':
                return 'warning';
            case 'resuelto':
                return 'success';
            default:
                return 'default';
        }
    };

    if (loading) {
        return (
            <Paper sx={{ p: 3, minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography>Cargando incidencias recientes...</Typography>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3, minHeight: 400 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={700}>
                    Incidencias Recientes
                </Typography>
                <Chip
                    label={`${incidents.length} total`}
                    size="small"
                    color="primary"
                    variant="outlined"
                />
            </Box>
            <List>
                {incidents.map((incident, idx) => (
                    <React.Fragment key={incident._id}>
                        <ListItem
                            alignItems="flex-start"
                            sx={{
                                '&:hover': {
                                    bgcolor: theme.palette.action.hover,
                                    borderRadius: 1
                                }
                            }}
                        >
                            <Avatar sx={{ mr: 2, bgcolor: theme.palette.primary.light }}>
                                {getStatusIcon(incident.estado)}
                            </Avatar>
                            <ListItemText
                                primary={
                                    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                                        <Typography component="span" sx={{ flex: 1, fontWeight: 600 }}>
                                            {incident.subject || incident.asunto}
                                        </Typography>
                                        <Chip
                                            label={incident.estado || 'Sin estado'}
                                            size="small"
                                            color={getStatusColor(incident.estado)}
                                            variant="outlined"
                                        />
                                        <Chip
                                            label={incident.prioridad || 'Sin prioridad'}
                                            size="small"
                                            color={getPriorityColor(incident.prioridad)}
                                            variant="outlined"
                                        />
                                    </Box>
                                }
                                secondary={
                                    <Box sx={{ mt: 1 }}>
                                        <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                                            <Typography component="span" variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                                                Categoría:
                                            </Typography>
                                            <Typography component="span" variant="body2" color="text.secondary">
                                                {incident.categoria || 'Sin categoría'}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                                            <Typography component="span" variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                                                Asignado:
                                            </Typography>
                                            <Typography component="span" variant="body2" color="text.secondary">
                                                {incident.assignedTo?.name || 'Sin asignar'}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Typography component="span" variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                                                Creado:
                                            </Typography>
                                            <Typography component="span" variant="body2" color="text.secondary">
                                                {incident.createdAt ? new Date(incident.createdAt).toLocaleString() : 'Sin fecha'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                }
                            />
                            <Box display="flex" gap={1}>
                                <Tooltip title="Ver detalles">
                                    <IconButton
                                        size="small"
                                        onClick={() => onViewIncident(incident._id)}
                                        color="primary"
                                    >
                                        <Visibility />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </ListItem>
                        {idx < incidents.length - 1 && <Divider />}
                    </React.Fragment>
                ))}
            </List>
            {incidents.length === 0 && (
                <Box display="flex" flexDirection="column" alignItems="center" py={4}>
                    <Typography color="text.secondary">
                        No hay incidencias recientes
                    </Typography>
                </Box>
            )}
        </Paper>
    );
};

export default RecentIncidents; 