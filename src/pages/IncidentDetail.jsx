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
    ListItemText
} from '@mui/material';
import axios from 'axios';
import { useNotification } from '../utils/notification';

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
    const notify = useNotification();

    // Simulación de rol (en producción, obtener del contexto de auth)
    const userRole = localStorage.getItem('role') || 'usuario';
    const userId = localStorage.getItem('userId') || '';

    useEffect(() => {
        const fetchIncident = async () => {
            try {
                const res = await axios.get(`/api/incidents/${id}`);
                setIncident(res.data);
                setIsLoading(false);
            } catch (err) {
                setError('No se pudo cargar la incidencia');
                notify('No se pudo cargar la incidencia', 'error');
                setIsLoading(false);
            }
        };
        fetchIncident();
    }, [id, success]);

    useEffect(() => {
        if (userRole === 'admin' || userRole === 'soporte') {
            axios.get('/api/users').then(res => setUsers(res.data));
        }
    }, [userRole]);

    const handleStatusChange = async () => {
        try {
            await axios.patch(`/api/incidents/${id}/estado`, {
                status: newStatus,
                comment
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
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
            await axios.patch(`/api/incidents/${id}/asignar`, {
                assignedTo: assignTo
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
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
            await axios.patch(`/api/incidents/${id}/estado`, {
                status: 'resuelto',
                solution,
                comment: 'Solución registrada'
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setSuccess('Solución enviada exitosamente');
            setSolution('');
        } catch (err) {
            setError('Error al enviar la solución');
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
                        <Typography variant="h6">Categoría</Typography>
                        <Typography variant="body1">{incident.category}</Typography>
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
                {(userRole === 'admin' || userRole === 'soporte') && incident.status !== 'cerrado' && (
                    <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        {/* Asignar */}
                        <FormControl sx={{ minWidth: 200 }} size="small">
                            <InputLabel>Asignar a</InputLabel>
                            <Select
                                value={assignTo}
                                label="Asignar a"
                                onChange={e => setAssignTo(e.target.value)}
                            >
                                <MenuItem value="">Seleccionar</MenuItem>
                                {users.map(u => (
                                    <MenuItem key={u._id} value={u._id}>{u.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Button
                            variant="contained"
                            color="primary"
                            disabled={!assignTo}
                            onClick={handleAssign}
                        >
                            Asignar
                        </Button>
                        {/* Cambiar estado */}
                        <FormControl sx={{ minWidth: 200 }} size="small">
                            <InputLabel>Nuevo estado</InputLabel>
                            <Select
                                value={newStatus}
                                label="Nuevo estado"
                                onChange={e => setNewStatus(e.target.value)}
                            >
                                <MenuItem value="">Seleccionar</MenuItem>
                                {['pendiente', 'en_proceso', 'resuelto', 'cerrado'].filter(s => s !== incident.status).map(s => (
                                    <MenuItem key={s} value={s}>{s}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            size="small"
                            label="Comentario"
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                        />
                        <Button
                            variant="contained"
                            color="info"
                            disabled={!newStatus}
                            onClick={handleStatusChange}
                        >
                            Cambiar Estado
                        </Button>
                    </Box>
                )}

                {/* Solución (solo si está en proceso y el usuario es soporte/admin) */}
                {incident.status === 'en_proceso' && (userRole === 'soporte' || userRole === 'admin') && (
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
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                color="success"
                                disabled={!solution}
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
                            {incident.history && incident.history.length > 0 ? incident.history.map((h, idx) => (
                                <TableRow key={idx}>
                                    <TableCell>{new Date(h.date).toLocaleString()}</TableCell>
                                    <TableCell>{h.user ? h.user.name || h.user : 'N/A'}</TableCell>
                                    <TableCell>{h.action}</TableCell>
                                    <TableCell>{h.comment}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">Sin historial</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Container>
    );
};

export default IncidentDetail; 