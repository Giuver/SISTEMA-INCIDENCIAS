import React, { useEffect, useState } from 'react';
import {
    Container,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Chip,
    IconButton,
    Box,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Tooltip,
    TablePagination,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    Divider,
    CircularProgress,
    Snackbar,
    Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import axios from 'axios';
import { useNotification } from '../utils/notification';
import GetAppIcon from '@mui/icons-material/GetApp';
import * as XLSX from 'xlsx';
import IncidentForm from './IncidentForm';
import LoaderOverlay from '../components/LoaderOverlay';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import sessionManager from '../utils/sessionManager';

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

const estados = ['pendiente', 'en_proceso', 'resuelto', 'cerrado'];
const prioridades = ['Baja', 'Media', 'Alta', 'Crítica'];

const IncidentList = () => {
    const navigate = useNavigate();
    const [incidents, setIncidents] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [filtros, setFiltros] = useState({ estado: '', prioridad: '', categoria: '', asignado: '', search: '' });
    const authData = sessionManager.getAuthData();
    const token = authData?.token;
    const role = authData?.role;
    const userId = authData?.userId;
    const notify = useNotification();
    const [loading, setLoading] = useState(true);
    const [errorUsers, setErrorUsers] = useState(false);
    const [total, setTotal] = useState(0);

    // Control de permisos por rol
    // Solo admin y soporte pueden realizar acciones sobre incidencias
    const canManageIncidents = role === 'admin' || role === 'soporte';
    // Los usuarios solo pueden crear incidencias, no editarlas
    const canCreateIncidents = true; // Todos pueden crear
    const canEditIncidents = role === 'admin' || role === 'soporte';
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editIncident, setEditIncident] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [newAssigned, setNewAssigned] = useState('');
    const [solution, setSolution] = useState('');
    const [newModalOpen, setNewModalOpen] = useState(false);
    const [rowUpdating, setRowUpdating] = useState(null);

    const fetchIncidents = async () => {
        setLoading(true);
        try {
            // Construir query params con filtros
            const params = new URLSearchParams({
                page: page + 1,
                limit: rowsPerPage
            });

            // Agregar filtros si están activos
            if (filtros.estado) params.append('status', filtros.estado);
            if (filtros.prioridad) params.append('priority', filtros.prioridad);
            if (filtros.categoria) params.append('area', filtros.categoria);
            if (filtros.asignado) params.append('assignedTo', filtros.asignado);
            if (filtros.search) params.append('search', filtros.search);

            const res = await axios.get(`/api/incidents?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIncidents(res.data.incidents || res.data);
            setTotal(res.data.total || 0);
        } catch (err) {
            setIncidents([]);
            setTotal(0);
            notify('No se pudieron cargar las incidencias', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchAreas = async () => {
        try {
            const res = await axios.get('/api/areas', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCategorias(res.data);
        } catch (err) {
            setCategorias([]);
            notify('Error al cargar áreas', 'error');
        }
    };

    const fetchUsuarios = async () => {
        try {
            const userRole = role;
            // Solo cargar usuarios si es admin o soporte
            if (userRole === 'admin' || userRole === 'soporte') {
                const res = await axios.get('/api/users', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUsuarios(res.data);
            } else {
                setUsuarios([]);
            }
        } catch (err) {
            setUsuarios([]);
            // Solo mostrar error si es admin o soporte
            const userRole = role;
            if (userRole === 'admin' || userRole === 'soporte') {
                notify('Error al cargar usuarios', 'error');
            }
        }
    };

    useEffect(() => {
        fetchIncidents();
    }, [page, rowsPerPage, filtros]);

    useEffect(() => {
        fetchAreas();
        fetchUsuarios();
    }, []);

    useEffect(() => {
        if (selectedIncident) {
            setNewStatus(selectedIncident.status);
            setNewAssigned(selectedIncident.assignedTo?._id || '');
            setSolution(selectedIncident.solution || '');
        }
    }, [selectedIncident]);

    const handleFiltro = (e) => {
        setFiltros({ ...filtros, [e.target.name]: e.target.value });
    };

    // Función eliminada - los filtros ahora se aplican en el backend

    const handleViewIncident = (incident) => {
        setSelectedIncident(incident);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedIncident(null);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const exportToExcel = () => {
        const data = incidents.map(i => ({
            Asunto: i.subject,
            Estado: i.status,
            Prioridad: i.priority,
            Área: i.area,
            Asignado: i.assignedTo?.name || '-',
            Fecha: new Date(i.createdAt).toLocaleDateString(),
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Incidencias');
        XLSX.writeFile(wb, 'incidencias.xlsx');
    };

    const handleEditIncident = (incident) => {
        if (!canEditIncidents) {
            notify('Usted no cuenta con estos privilegios', 'error');
            return;
        }
        setEditIncident(incident);
        setEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setEditModalOpen(false);
        setEditIncident(null);
        fetchIncidents();
    };

    const handleUpdateStatus = async () => {
        setUpdating(true);
        try {
            await axios.patch(`/api/incidents/${selectedIncident._id}/estado`, {
                status: newStatus,
                comment: 'Cambio de estado desde el modal',
                solution: newStatus === 'resuelto' ? solution : undefined
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            notify('Estado actualizado correctamente', 'success');
            await fetchIncidents();
            setModalOpen(false);
            setSelectedIncident(null);
            setEditModalOpen(false);
        } catch (err) {
            notify('Error al actualizar el estado', 'error');
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdateAssigned = async () => {
        setUpdating(true);
        try {
            await axios.patch(`/api/incidents/${selectedIncident._id}/asignar`, {
                assignedTo: newAssigned
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            notify('Responsable asignado correctamente', 'success');
            await fetchIncidents();
            setSelectedIncident(incidents.find(i => i._id === selectedIncident._id));
        } catch (err) {
            notify('Error al asignar responsable', 'error');
        } finally {
            setUpdating(false);
        }
    };

    // Edición rápida
    const handleQuickEdit = async (id, field, value) => {
        setRowUpdating(id + field);
        try {
            await axios.patch(`/api/incidents/${id}/asignar`, { assignedTo: value }, { headers: { Authorization: `Bearer ${token}` } });
            notify('Responsable actualizado', 'success');
        } catch (err) {
            notify('Error al actualizar', 'error');
        } finally {
            setRowUpdating(null);
        }
    };

    const handleCloseErrorUsers = () => {
        setErrorUsers(false);
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 6 }}>
            <LoaderOverlay open={loading} />
            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>Listado de Incidencias</Typography>
                <Box display="flex" gap={2} flexWrap="wrap" mb={2}>
                    <Button variant="contained" color="success" sx={{ mb: 2, mr: 2 }} onClick={() => setNewModalOpen(true)}>
                        Nueva Incidencia
                    </Button>
                    <FormControl sx={{ minWidth: 120 }} size="small">
                        <InputLabel>Estado</InputLabel>
                        <Select name="estado" value={filtros.estado} label="Estado" onChange={handleFiltro}>
                            <MenuItem value="">Todos</MenuItem>
                            {estados.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl sx={{ minWidth: 120 }} size="small">
                        <InputLabel>Prioridad</InputLabel>
                        <Select name="prioridad" value={filtros.prioridad} label="Prioridad" onChange={handleFiltro}>
                            <MenuItem value="">Todas</MenuItem>
                            {prioridades.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl sx={{ minWidth: 150 }} size="small">
                        <InputLabel>Área</InputLabel>
                        <Select name="categoria" value={filtros.categoria} label="Área" onChange={handleFiltro}>
                            <MenuItem value="">Todas</MenuItem>
                            {categorias.map(c => <MenuItem key={c._id} value={c.name}>{c.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl sx={{ minWidth: 150 }} size="small">
                        <InputLabel>Asignado</InputLabel>
                        <Select name="asignado" value={filtros.asignado} label="Asignado" onChange={handleFiltro}>
                            <MenuItem value="">Todos</MenuItem>
                            {usuarios.map(u => <MenuItem key={u._id} value={u._id}>{u.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <TextField
                        name="search"
                        label="Buscar asunto"
                        value={filtros.search}
                        onChange={handleFiltro}
                        size="small"
                    />
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<GetAppIcon />}
                    onClick={exportToExcel}
                    sx={{ mb: 2 }}
                >
                    Exportar a Excel
                </Button>
                <TableContainer component={Paper} role="table" aria-label="Listado de incidencias">
                    <Table>
                        <TableHead>
                            <TableRow role="row">
                                <TableCell role="columnheader">Asunto</TableCell>
                                <TableCell role="columnheader">Estado</TableCell>
                                <TableCell role="columnheader">Prioridad</TableCell>
                                <TableCell role="columnheader">Área</TableCell>
                                <TableCell role="columnheader">Asignado</TableCell>
                                <TableCell role="columnheader">Fecha</TableCell>
                                <TableCell role="columnheader" align="right">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : incidents.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        No hay incidencias registradas.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                incidents.map((i) => (
                                    <TableRow key={i._id} role="row">
                                        <TableCell role="cell">{i.subject}</TableCell>
                                        <TableCell role="cell">
                                            {canManageIncidents ? (
                                                <FormControl size="small" variant="standard">
                                                    <Select
                                                        value={i.status}
                                                        onChange={e => handleQuickEdit(i._id, 'status', e.target.value)}
                                                        disabled={rowUpdating === i._id + 'status'}
                                                        inputProps={{ 'aria-label': 'Estado de la incidencia' }}
                                                        sx={{ '&:focus': { outline: '2px solid #1976d2' } }}
                                                    >
                                                        {estados.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
                                                    </Select>
                                                    {rowUpdating === i._id + 'status' && <CircularProgress size={18} sx={{ ml: 1 }} />}
                                                </FormControl>
                                            ) : (
                                                <Chip label={i.status} color={statusColors[i.status]} sx={{ fontWeight: 'bold' }} />
                                            )}
                                        </TableCell>
                                        <TableCell role="cell">
                                            {canManageIncidents ? (
                                                <FormControl size="small" variant="standard">
                                                    <Select
                                                        value={i.priority}
                                                        onChange={e => handleQuickEdit(i._id, 'priority', e.target.value)}
                                                        disabled={rowUpdating === i._id + 'priority'}
                                                        inputProps={{ 'aria-label': 'Prioridad de la incidencia' }}
                                                        sx={{ '&:focus': { outline: '2px solid #1976d2' } }}
                                                    >
                                                        {prioridades.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                                                    </Select>
                                                    {rowUpdating === i._id + 'priority' && <CircularProgress size={18} sx={{ ml: 1 }} />}
                                                </FormControl>
                                            ) : (
                                                <Chip label={i.priority} color={priorityColors[i.priority]} sx={{ fontWeight: 'bold' }} />
                                            )}
                                        </TableCell>
                                        <TableCell role="cell">{i.area || 'Sin área'}</TableCell>
                                        <TableCell role="cell">
                                            {Array.isArray(i.assignedTo) && i.assignedTo.length > 0 ? (
                                                <Tooltip title={i.assignedTo.map(u => u.name).join(', ')} arrow>
                                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                        {i.assignedTo.slice(0, 2).map(u => (
                                                            <Chip key={u._id} label={u.name} size="small" color="primary" icon={<PersonIcon />} />
                                                        ))}
                                                        {i.assignedTo.length > 2 && (
                                                            <Chip label={`+${i.assignedTo.length - 2}`} size="small" color="primary" />
                                                        )}
                                                    </Box>
                                                </Tooltip>
                                            ) : (
                                                <Chip label="Sin asignar" size="small" color="default" variant="outlined" />
                                            )}
                                        </TableCell>
                                        <TableCell role="cell">{new Date(i.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell role="cell" align="right">
                                            <Tooltip title="Ver detalles de la incidencia" arrow>
                                                <IconButton
                                                    onClick={() => handleViewIncident(i)}
                                                    size="small"
                                                    aria-label="Ver detalles de la incidencia"
                                                    tabIndex={0}
                                                    sx={{ '&:focus': { outline: '2px solid #1976d2' } }}
                                                >
                                                    <VisibilityIcon />
                                                </IconButton>
                                            </Tooltip>
                                            {canManageIncidents && (
                                                <Tooltip title="Editar incidencia" arrow>
                                                    <IconButton
                                                        onClick={() => handleEditIncident(i)}
                                                        size="small"
                                                        aria-label="Editar incidencia"
                                                        tabIndex={0}
                                                        sx={{ '&:focus': { outline: '2px solid #1976d2' } }}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    component="div"
                    count={total}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[5, 10, 25]}
                />
            </Paper>
            <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold', fontSize: 22 }}>Detalle de Incidencia</DialogTitle>
                <DialogContent>
                    {selectedIncident ? (
                        <Box>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">Asunto</Typography>
                                    <Typography variant="h6" sx={{ mb: 1 }}>{selectedIncident.subject}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">Área</Typography>
                                    <Typography variant="body1" sx={{ mb: 1 }}>{selectedIncident.area || 'Sin área'}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">Estado</Typography>
                                    <Chip label={selectedIncident.status} color={statusColors[selectedIncident.status]} sx={{ fontWeight: 'bold', fontSize: 15, px: 2, mb: 1 }} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">Prioridad</Typography>
                                    <Chip label={selectedIncident.priority} color={priorityColors[selectedIncident.priority]} sx={{ fontWeight: 'bold', fontSize: 15, px: 2, mb: 1 }} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">Asignado a</Typography>
                                    <Typography variant="body1" sx={{ mb: 1 }}>{selectedIncident.assignedTo?.name || '-'}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">Fecha de creación</Typography>
                                    <Typography variant="body1" sx={{ mb: 1 }}>{new Date(selectedIncident.createdAt).toLocaleString()}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Descripción</Typography>
                                    <Typography variant="body1" sx={{ mb: 1 }}>{selectedIncident.description}</Typography>
                                </Grid>
                                {selectedIncident.attachment && (
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" color="text.secondary">Archivo Adjunto</Typography>
                                        <Button variant="outlined" href={`/${selectedIncident.attachment}`} target="_blank" sx={{ mt: 1 }}>Descargar</Button>
                                    </Grid>
                                )}
                            </Grid>
                            <Divider sx={{ my: 3 }} />
                            <Typography variant="h6" sx={{ mb: 1 }}>Historial de acciones</Typography>
                            {selectedIncident.history && selectedIncident.history.length > 0 ? (
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Acción</TableCell>
                                                <TableCell>Usuario</TableCell>
                                                <TableCell>Comentario</TableCell>
                                                <TableCell>Fecha</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {selectedIncident.history.map((h, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell>{h.action}</TableCell>
                                                    <TableCell>{h.user}</TableCell>
                                                    <TableCell>{h.comment}</TableCell>
                                                    <TableCell>{new Date(h.date).toLocaleString()}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Typography color="text.secondary">Sin historial</Typography>
                            )}
                            {canManageIncidents && (
                                <Box sx={{ mt: 2, mb: 2 }}>
                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                        <InputLabel>Estado</InputLabel>
                                        <Select value={newStatus} label="Estado" onChange={e => setNewStatus(e.target.value)}>
                                            <MenuItem value="pendiente">Pendiente</MenuItem>
                                            <MenuItem value="en_proceso">En Proceso</MenuItem>
                                            <MenuItem value="resuelto">Resuelto</MenuItem>
                                            <MenuItem value="cerrado">Cerrado</MenuItem>
                                        </Select>
                                    </FormControl>
                                    {newStatus === 'resuelto' && (
                                        <TextField
                                            label="Solución"
                                            value={solution}
                                            onChange={e => setSolution(e.target.value)}
                                            fullWidth
                                            multiline
                                            minRows={2}
                                            sx={{ mb: 2 }}
                                        />
                                    )}
                                    <Button variant="contained" color="primary" onClick={handleUpdateStatus} disabled={updating} sx={{ mr: 2 }}>
                                        Guardar Estado
                                    </Button>
                                    <FormControl fullWidth sx={{ mt: 2 }}>
                                        <InputLabel>Asignado a</InputLabel>
                                        <Select value={newAssigned} label="Asignado a" onChange={e => setNewAssigned(e.target.value)}>
                                            <MenuItem value="">Sin asignar</MenuItem>
                                            {usuarios.map(u => <MenuItem key={u._id} value={u._id}>{u.name}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                    <Button variant="contained" color="secondary" onClick={handleUpdateAssigned} disabled={updating} sx={{ mt: 2 }}>
                                        Guardar Asignación
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    ) : (
                        <Typography>Cargando...</Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseModal} color="success">Cerrar</Button>
                </DialogActions>
            </Dialog>
            <Dialog open={editModalOpen} onClose={handleCloseEditModal} maxWidth="md" fullWidth>
                <DialogTitle>Editar Incidencia</DialogTitle>
                <DialogContent>
                    {editIncident && (
                        <IncidentForm id={editIncident._id} onClose={handleCloseEditModal} isModal />
                    )}
                </DialogContent>
            </Dialog>
            <Dialog open={newModalOpen} onClose={() => setNewModalOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Nueva Incidencia</DialogTitle>
                <DialogContent>
                    <IncidentForm onClose={() => { setNewModalOpen(false); fetchIncidents(); }} isModal />
                </DialogContent>
            </Dialog>
            {role === 'admin' && errorUsers && (
                <Snackbar open={true} autoHideDuration={6000} onClose={handleCloseErrorUsers}>
                    <Alert onClose={handleCloseErrorUsers} severity="error" sx={{ width: '100%' }}>
                        Error al cargar usuarios
                    </Alert>
                </Snackbar>
            )}
        </Container>
    );
};

export default IncidentList; 