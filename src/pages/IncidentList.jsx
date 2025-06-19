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
    Divider
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
    const role = localStorage.getItem('role');
    const userId = localStorage.getItem('userId');
    const notify = useNotification();
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

    const fetchIncidents = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/incidents', {
                headers: { Authorization: `Bearer ${token}` }
            });
            let data = res.data;
            // Filtrar según rol
            if (role === 'usuario') {
                data = data.filter(i => i.createdBy === userId);
            }
            setIncidents(data);
        } catch (err) {
            setIncidents([]);
            notify('Error al cargar incidencias', 'error');
        }
    };

    const fetchCategorias = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/categories', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCategorias(res.data);
        } catch (err) {
            setCategorias([]);
            notify('Error al cargar categorías', 'error');
        }
    };

    const fetchUsuarios = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsuarios(res.data);
        } catch (err) {
            setUsuarios([]);
            notify('Error al cargar usuarios', 'error');
        }
    };

    useEffect(() => {
        fetchIncidents();
        fetchCategorias();
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

    const filtrarIncidencias = () => {
        return incidents.filter(i =>
            (!filtros.estado || i.status === filtros.estado) &&
            (!filtros.prioridad || i.priority === filtros.prioridad) &&
            (!filtros.categoria || i.category === filtros.categoria) &&
            (!filtros.asignado || (i.assignedTo && i.assignedTo._id === filtros.asignado)) &&
            (!filtros.search || i.subject?.toLowerCase().includes(filtros.search.toLowerCase()))
        );
    };

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
        const data = filtrarIncidencias().map(i => ({
            Asunto: i.subject,
            Estado: i.status,
            Prioridad: i.priority,
            Categoría: i.category,
            Asignado: i.assignedTo?.name || '-',
            Fecha: new Date(i.createdAt).toLocaleDateString(),
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Incidencias');
        XLSX.writeFile(wb, 'incidencias.xlsx');
    };

    const handleEditIncident = (incident) => {
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
            const token = localStorage.getItem('token');
            await axios.patch(`/api/incidents/${selectedIncident._id}/estado`, {
                status: newStatus,
                comment: 'Cambio de estado desde el modal',
                solution: newStatus === 'resuelto' ? solution : undefined
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            notify('Estado actualizado', 'success');
            await fetchIncidents();
            setModalOpen(false);
            setSelectedIncident(null);
            setEditModalOpen(false);
        } catch (err) {
            notify('Error al actualizar estado', 'error');
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdateAssigned = async () => {
        setUpdating(true);
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`/api/incidents/${selectedIncident._id}/asignar`, {
                assignedTo: newAssigned
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            notify('Responsable actualizado', 'success');
            await fetchIncidents();
            setSelectedIncident(incidents.find(i => i._id === selectedIncident._id));
        } catch (err) {
            notify('Error al asignar', 'error');
        } finally {
            setUpdating(false);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 6 }}>
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
                        <InputLabel>Categoría</InputLabel>
                        <Select name="categoria" value={filtros.categoria} label="Categoría" onChange={handleFiltro}>
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
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Asunto</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell>Prioridad</TableCell>
                                <TableCell>Categoría</TableCell>
                                <TableCell>Asignado</TableCell>
                                <TableCell>Fecha</TableCell>
                                <TableCell align="right">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtrarIncidencias().slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((i) => (
                                <TableRow key={i._id}>
                                    <TableCell>{i.subject}</TableCell>
                                    <TableCell><Chip label={i.status} color={statusColors[i.status]} /></TableCell>
                                    <TableCell><Chip label={i.priority} color={priorityColors[i.priority]} /></TableCell>
                                    <TableCell>{i.category}</TableCell>
                                    <TableCell>{i.assignedTo?.name || '-'}</TableCell>
                                    <TableCell>{new Date(i.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell align="right">
                                        <Button size="small" variant="outlined" onClick={() => handleViewIncident(i)}>Ver</Button>
                                        {(role === 'admin' || role === 'soporte' || (role === 'usuario' && i.createdBy === userId)) && (
                                            <Button size="small" variant="contained" sx={{ ml: 1 }} onClick={() => handleEditIncident(i)}>Editar</Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    component="div"
                    count={filtrarIncidencias().length}
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
                                    <Typography variant="subtitle2" color="text.secondary">Categoría</Typography>
                                    <Typography variant="body1" sx={{ mb: 1 }}>{selectedIncident.category}</Typography>
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
                            {(role === 'admin' || role === 'soporte') && (
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
        </Container>
    );
};

export default IncidentList; 