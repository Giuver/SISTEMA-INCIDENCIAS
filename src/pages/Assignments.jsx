import React, { useEffect, useState } from 'react';
import {
    Container, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Select, MenuItem, FormControl, InputLabel, Box, Dialog, DialogTitle, DialogContent, DialogActions, Alert
} from '@mui/material';
import axios from 'axios';
import { useNotification } from '../utils/notification';

const Assignments = () => {
    const [incidents, setIncidents] = useState([]);
    const [users, setUsers] = useState([]);
    const [filtros, setFiltros] = useState({ status: '', assignedTo: '' });
    const [open, setOpen] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [selectedUser, setSelectedUser] = useState('');
    const [error, setError] = useState('');
    const notify = useNotification();
    const role = localStorage.getItem('role');

    const fetchIncidents = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/incidents', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIncidents(res.data);
        } catch (err) {
            setIncidents([]);
            notify('Error al cargar incidencias', 'error');
        }
    };

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data.filter(u => u.role === 'soporte'));
        } catch (err) {
            setUsers([]);
            notify('Error al cargar usuarios', 'error');
        }
    };

    useEffect(() => {
        fetchIncidents();
        fetchUsers();
    }, []);

    const handleFiltro = (e) => {
        setFiltros({ ...filtros, [e.target.name]: e.target.value });
    };

    const filtrarIncidencias = () => {
        return incidents.filter(i =>
            (!filtros.status || i.status === filtros.status) &&
            (!filtros.assignedTo || (i.assignedTo && i.assignedTo._id === filtros.assignedTo))
        );
    };

    const handleOpen = (incident) => {
        setSelectedIncident(incident);
        setSelectedUser(incident.assignedTo?._id || '');
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedIncident(null);
        setSelectedUser('');
        setError('');
    };

    const handleAssign = async () => {
        if (!selectedUser) {
            setError('Selecciona un usuario de soporte');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`/api/incidents/${selectedIncident._id}/asignar`, { assignedTo: selectedUser }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            notify('Incidencia asignada', 'success');
            fetchIncidents();
            handleClose();
        } catch (err) {
            setError('Error al asignar incidencia');
            notify('Error al asignar incidencia', 'error');
        }
    };

    if (role !== 'admin' && role !== 'soporte') {
        return <Alert severity="error">Acceso denegado. Solo para administradores y soporte.</Alert>;
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 6 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>Gestión de Asignaciones</Typography>
                <Box display="flex" gap={2} flexWrap="wrap" mb={2}>
                    <FormControl sx={{ minWidth: 150 }} size="small">
                        <InputLabel>Estado</InputLabel>
                        <Select name="status" value={filtros.status} label="Estado" onChange={handleFiltro}>
                            <MenuItem value="">Todos</MenuItem>
                            <MenuItem value="pendiente">Pendiente</MenuItem>
                            <MenuItem value="en_proceso">En Proceso</MenuItem>
                            <MenuItem value="resuelto">Resuelto</MenuItem>
                            <MenuItem value="cerrado">Cerrado</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl sx={{ minWidth: 200 }} size="small">
                        <InputLabel>Asignado a</InputLabel>
                        <Select name="assignedTo" value={filtros.assignedTo} label="Asignado a" onChange={handleFiltro}>
                            <MenuItem value="">Todos</MenuItem>
                            {users.map(u => <MenuItem key={u._id} value={u._id}>{u.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Asunto</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell>Prioridad</TableCell>
                                <TableCell>Categoría</TableCell>
                                <TableCell>Asignado a</TableCell>
                                <TableCell align="right">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtrarIncidencias().map((i) => (
                                <TableRow key={i._id}>
                                    <TableCell>{i.subject}</TableCell>
                                    <TableCell>{i.status}</TableCell>
                                    <TableCell>{i.priority}</TableCell>
                                    <TableCell>{i.category}</TableCell>
                                    <TableCell>{i.assignedTo?.name || '-'}</TableCell>
                                    <TableCell align="right">
                                        <Button size="small" variant="contained" onClick={() => handleOpen(i)}>Asignar/Cambiar</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Asignar incidencia</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Usuario de soporte</InputLabel>
                        <Select value={selectedUser} label="Usuario de soporte" onChange={e => setSelectedUser(e.target.value)}>
                            <MenuItem value="">Sin asignar</MenuItem>
                            {users.map(u => <MenuItem key={u._id} value={u._id}>{u.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancelar</Button>
                    <Button variant="contained" onClick={handleAssign}>Asignar</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Assignments; 