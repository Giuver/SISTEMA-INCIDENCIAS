import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    Box,
    Chip,
    Button,
    TextField,
    Grid,
    Divider,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    List,
    ListItem,
    ListItemText,
    Avatar,
    CircularProgress,
    IconButton
} from '@mui/material';
import axios from 'axios';
import { useNotification } from '../utils/notification';
import SendIcon from '@mui/icons-material/Send';
import sessionManager from '../utils/sessionManager';
import { apiService } from '../utils/apiService';

const statusColors = {
    pendiente: 'warning',
    en_proceso: 'info',
    resuelto: 'success',
    cerrado: 'default',
};

const priorityColors = {
    Baja: 'success',
    Media: 'warning',
    Alta: 'error',
    Crítica: 'error',
};

const estados = ['abierta', 'en progreso', 'resuelta', 'cerrada'];

const IncidentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [incident, setIncident] = useState(null);
    const [solution, setSolution] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [comment, setComment] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [users, setUsers] = useState([]);
    const [assignTo, setAssignTo] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [sendingComment, setSendingComment] = useState(false);
    const notify = useNotification();

    const authData = sessionManager.getAuthData();
    const token = authData?.token;
    const userRole = authData?.role || 'usuario';
    const userId = authData?.userId || '';

    // Control de permisos por rol
    // Solo admin y soporte pueden realizar acciones sobre incidencias
    const canManageIncidents = userRole === 'admin' || userRole === 'soporte';
    const canEditIncidents = userRole === 'admin' || userRole === 'soporte';
    const isReadOnly = !canEditIncidents;

    useEffect(() => {
        const fetchIncident = async () => {
            try {
                const res = await apiService.get(`/incidents/${id}`);
                setIncident(res);
                setIsLoading(false);
            } catch (err) {
                setError('Error al cargar la incidencia');
                notify('Error al cargar la incidencia', 'error');
                setIsLoading(false);
            }
        };
        const fetchComments = async () => {
            setLoadingComments(true);
            try {
                const res = await apiService.get(`/incidents/${id}/comentarios`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setComments(res);
            } catch (err) {
                setComments([]);
            } finally {
                setLoadingComments(false);
            }
        };
        const fetchUsers = async () => {
            try {
                const res = await apiService.get('/users');
                setUsers(res);
            } catch (err) {
                setUsers([]);
            }
        };
        fetchIncident();
        fetchComments();
        fetchUsers();
    }, [id]);

    const handleStatusChange = async () => {
        try {
            await apiService.patch(`/incidents/${id}/estado`, {
                status: newStatus,
                comment
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Estado actualizado');
            notify('Estado actualizado', 'success');
            setComment('');
            setNewStatus('');
        } catch (err) {
            setError('No se pudo actualizar el estado');
            notify('No se pudo actualizar el estado', 'error');
        }
    };

    const handleAssign = async () => {
        try {
            await apiService.patch(`/incidents/${id}/asignar`, {
                assignedTo: assignTo
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Incidencia asignada');
            notify('Incidencia asignada', 'success');
            setAssignTo('');
        } catch (err) {
            setError('No se pudo asignar la incidencia');
            notify('No se pudo asignar la incidencia', 'error');
        }
    };

    const handleSolutionSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiService.patch(`/incidents/${id}/estado`, {
                status: 'resuelto',
                solution,
                comment: 'Solución registrada'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Solución enviada exitosamente');
            setSolution('');
        } catch (err) {
            setError('Error al enviar la solución');
        }
    };

    const handleAddComment = async () => {
        if (!commentText.trim()) return;
        setSendingComment(true);
        try {
            const token = localStorage.getItem('token');
            await apiService.post(`/incidents/${id}/comentarios`, { text: commentText }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCommentText('');
            // Recargar comentarios
            const res = await apiService.get(`/incidents/${id}/comentarios`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setComments(res);
        } catch (err) {
            // Puedes mostrar notificación de error si lo deseas
        } finally {
            setSendingComment(false);
        }
    };

    if (isLoading) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Typography>Cargando...</Typography>
            </Container>
        );
    }

    if (!incident) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="error">Incidencia no encontrada</Alert>
            </Container>
        );
    }

    let assignedToValue = '';
    if (incident.assignedTo && users.length > 0) {
        const assignedId = typeof incident.assignedTo === 'object' ? incident.assignedTo._id : incident.assignedTo;
        if (users.some(u => u._id === assignedId)) {
            assignedToValue = assignedId;
        }
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" component="h1">
                        Detalles de la Incidencia
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip label={incident.status} color={statusColors[incident.status]} />
                        <Chip label={incident.priority} color={priorityColors[incident.priority]} />
                    </Box>
                </Box>

                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="h6">Asunto</Typography>
                        <Typography variant="body1">{incident.subject}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="h6">Área</Typography>
                        <Typography variant="body1">{incident.area || 'Sin área'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="h6">Fecha de Creación</Typography>
                        <Typography variant="body1">
                            {new Date(incident.createdAt).toLocaleString()}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="h6">Asignado a</Typography>
                        <Typography variant="body1">
                            {incident.assignedTo?.name || 'No asignado'}
                        </Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="h6">Descripción</Typography>
                        <Typography variant="body1">{incident.description}</Typography>
                    </Grid>
                    {incident.tags && incident.tags.length > 0 && (
                        <Grid item xs={12}>
                            <Typography variant="h6">Etiquetas</Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                                {incident.tags.map((tag, idx) => (
                                    <Chip key={idx} label={tag} color="secondary" variant="filled" />
                                ))}
                            </Box>
                        </Grid>
                    )}
                    {incident.attachment && (
                        <Grid item xs={12}>
                            <Typography variant="h6">Archivo Adjunto</Typography>
                            <Button
                                variant="outlined"
                                href={`/${incident.attachment}`}
                                target="_blank"
                            >
                                Ver archivo
                            </Button>
                        </Grid>
                    )}
                    {incident.solution && (
                        <Grid item xs={12}>
                            <Typography variant="h6">Solución</Typography>
                            <Typography variant="body1">{incident.solution}</Typography>
                        </Grid>
                    )}
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Acciones según rol y estado */}
                {/* Solo admin y soporte pueden realizar acciones sobre incidencias */}
                {canManageIncidents && incident.status !== 'cerrado' && (
                    <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        {/* Asignar */}
                        <FormControl sx={{ minWidth: 200 }} size="small">
                            <InputLabel>Asignar a</InputLabel>
                            <Select
                                value={assignTo || assignedToValue}
                                label="Asignar a"
                                onChange={e => setAssignTo(e.target.value)}
                                disabled={isReadOnly}
                                title={isReadOnly ?
                                    'Solo usuarios con rol de soporte o administrador pueden asignar incidencias' :
                                    'Asignar la incidencia a un usuario'
                                }
                            >
                                <MenuItem value="">Sin asignar</MenuItem>
                                {users.map(user => (
                                    <MenuItem key={user._id} value={user._id}>
                                        {user.name} ({user.role})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Button
                            variant="contained"
                            onClick={handleAssign}
                            disabled={isReadOnly || !assignTo}
                            title={isReadOnly ?
                                'Solo usuarios con rol de soporte o administrador pueden asignar incidencias' :
                                'Asignar la incidencia'
                            }
                            sx={{ minWidth: 120 }}
                        >
                            Asignar
                        </Button>
                        {/* Cambiar Estado */}
                        <FormControl sx={{ minWidth: 200 }} size="small">
                            <InputLabel>Cambiar Estado</InputLabel>
                            <Select
                                value={newStatus || incident.status}
                                label="Cambiar Estado"
                                onChange={e => setNewStatus(e.target.value)}
                                disabled={isReadOnly}
                                title={isReadOnly ?
                                    'Solo usuarios con rol de soporte o administrador pueden cambiar el estado de las incidencias' :
                                    'Cambiar el estado de la incidencia'
                                }
                            >
                                <MenuItem value="pendiente">Pendiente</MenuItem>
                                <MenuItem value="en_proceso">En Proceso</MenuItem>
                                <MenuItem value="resuelto">Resuelto</MenuItem>
                                <MenuItem value="cerrado">Cerrado</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            size="small"
                            label="Comentario"
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            disabled={isReadOnly}
                        />
                        <Button
                            variant="contained"
                            onClick={handleStatusChange}
                            disabled={isReadOnly || !newStatus || newStatus === incident.status}
                            title={isReadOnly ?
                                'Solo usuarios con rol de soporte o administrador pueden cambiar el estado' :
                                'Aplicar cambio de estado'
                            }
                            sx={{ minWidth: 120 }}
                        >
                            Aplicar
                        </Button>
                    </Box>
                )}

                {/* Solución (solo si está en proceso y el usuario es soporte/admin) */}
                {incident.status === 'en_proceso' && canManageIncidents && (
                    <Box sx={{ mb: 3 }}>
                        <form onSubmit={handleSolutionSubmit}>
                            <Typography variant="h6" gutterBottom>
                                Solución
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                value={solution}
                                onChange={e => setSolution(e.target.value)}
                                placeholder="Ingrese la solución del problema..."
                                sx={{ mb: 2 }}
                                disabled={isReadOnly}
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                color="success"
                                disabled={!solution || isReadOnly}
                                title={isReadOnly ?
                                    'Solo usuarios con rol de soporte o administrador pueden enviar soluciones' :
                                    'Enviar solución y marcar como resuelto'
                                }
                            >
                                Enviar Solución y Marcar como Resuelto
                            </Button>
                        </form>
                    </Box>
                )}

                {/* Historial de acciones */}
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" gutterBottom>Historial de la Incidencia</Typography>
                <TableContainer component={Paper} sx={{ mb: 2 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Fecha</TableCell>
                                <TableCell>Usuario</TableCell>
                                <TableCell>Acción</TableCell>
                                <TableCell>Comentario</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {incident.history && incident.history.length > 0 ? incident.history.map((h, idx) => {
                                let userName = 'N/A';
                                if (h.user && typeof h.user === 'object' && h.user.name) {
                                    userName = h.user.name;
                                } else if (h.user && typeof h.user === 'string' && users.length > 0) {
                                    const found = users.find(u => u._id === h.user);
                                    if (found) userName = found.name;
                                }
                                return (
                                    <TableRow key={idx}>
                                        <TableCell>{new Date(h.date).toLocaleString()}</TableCell>
                                        <TableCell>{userName}</TableCell>
                                        <TableCell>{h.action}</TableCell>
                                        <TableCell>{h.comment}</TableCell>
                                    </TableRow>
                                );
                            }) : (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">Sin historial</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Sección de comentarios */}
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" sx={{ mb: 2 }}>Comentarios</Typography>
                {loadingComments ? (
                    <CircularProgress size={32} />
                ) : (
                    <List>
                        {comments.length === 0 && <Typography color="text.secondary">Sin comentarios</Typography>}
                        {comments.map((c, idx) => (
                            <ListItem alignItems="flex-start" key={idx}>
                                <ListItemAvatar>
                                    <Avatar>{c.user?.name ? c.user.name[0].toUpperCase() : '?'}</Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={c.user?.name || 'Usuario'}
                                    secondary={<>
                                        <Typography component="span" variant="body2" color="text.primary">{c.text}</Typography>
                                        <br />
                                        <Typography component="span" variant="caption" color="text.secondary">{new Date(c.date).toLocaleString()}</Typography>
                                    </>}
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
                <Box display="flex" alignItems="center" gap={2} mt={2}>
                    <TextField
                        label="Agregar comentario"
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        fullWidth
                        multiline
                        minRows={1}
                        maxRows={4}
                        disabled={sendingComment || isReadOnly}
                        inputProps={{ maxLength: 500, 'aria-label': 'Agregar comentario' }}
                    />
                    <IconButton color="primary" onClick={handleAddComment} disabled={sendingComment || !commentText.trim() || isReadOnly} aria-label="Enviar comentario">
                        {sendingComment ? <CircularProgress size={24} /> : <SendIcon />}
                    </IconButton>
                </Box>
            </Paper>
        </Container>
    );
};

export default IncidentDetail; 