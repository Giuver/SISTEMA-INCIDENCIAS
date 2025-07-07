import React, { useEffect, useState } from 'react';
import {
    Container, Paper, Typography, Button, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip, Tooltip, Alert
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import axios from 'axios';

const emptyArea = { name: '', description: '', color: '#4CAF50' };

const AreaAdmin = () => {
    const [areas, setAreas] = useState([]);
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState(emptyArea);
    const [selectedId, setSelectedId] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [incidents, setIncidents] = useState([]);

    const fetchAreas = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/areas', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAreas(res.data);
        } catch (err) {
            setError('Error al cargar áreas');
        }
    };

    const fetchIncidents = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/incidents', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIncidents(res.data);
        } catch (err) {
            // No bloquear por error aquí
        }
    };

    useEffect(() => {
        fetchAreas();
        fetchIncidents();
    }, []);

    const handleOpen = (area = emptyArea, id = null) => {
        setForm(area);
        setSelectedId(id);
        setEditMode(!!id);
        setOpen(true);
        setError('');
        setSuccess('');
    };

    const handleClose = () => {
        setOpen(false);
        setForm(emptyArea);
        setSelectedId(null);
        setEditMode(false);
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const validate = () => {
        if (!form.name || form.name.length < 3) return 'El nombre es obligatorio y debe tener al menos 3 caracteres';
        if (!form.color) return 'El color es obligatorio';
        if (areas.some(area => area.name === form.name && (!editMode || area._id !== selectedId))) return 'El nombre del área ya existe';
        return '';
    };

    const handleSubmit = async () => {
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }
        try {
            if (editMode) {
                await axios.put(`/api/areas/${selectedId}`, form, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
                setSuccess('Área actualizada');
            } else {
                await axios.post('/api/areas', form, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
                setSuccess('Área creada');
            }
            fetchAreas();
            handleClose();
        } catch (err) {
            setError('Error al guardar el área');
        }
    };

    const handleDelete = async (id) => {
        // Bloquear eliminación si el área está en uso
        const area = areas.find(a => a._id === id);
        const used = incidents.some(i => i.area === area.name);
        if (used) {
            setError('No se puede eliminar un área que está en uso por incidencias.');
            return;
        }
        if (!window.confirm('¿Seguro que deseas eliminar esta área?')) return;
        try {
            await axios.delete(`/api/areas/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            setSuccess('Área eliminada');
            fetchAreas();
        } catch (err) {
            setError('Error al eliminar el área');
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Paper sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h4">Administrar Áreas</Typography>
                    <Button variant="contained" color="primary" startIcon={<Add />} onClick={() => handleOpen()}>Nueva Área</Button>
                </Box>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Nombre</TableCell>
                                <TableCell>Descripción</TableCell>
                                <TableCell>Color</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {areas.map((area) => (
                                <TableRow key={area._id}>
                                    <TableCell>{area.name}</TableCell>
                                    <TableCell>{area.description}</TableCell>
                                    <TableCell>
                                        <Chip label={area.color} style={{ backgroundColor: area.color, color: '#fff' }} />
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title="Editar">
                                            <IconButton onClick={() => handleOpen(area, area._id)} color="primary"><Edit /></IconButton>
                                        </Tooltip>
                                        <Tooltip title="Eliminar">
                                            <span>
                                                <IconButton onClick={() => handleDelete(area._id)} color="error" disabled={incidents.some(i => i.area === area.name)}>
                                                    <Delete />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>{editMode ? 'Editar Área' : 'Nueva Área'}</DialogTitle>
                <DialogContent>
                    <TextField autoFocus margin="dense" label="Nombre" name="name" value={form.name} onChange={handleChange} fullWidth required inputProps={{ minLength: 3, maxLength: 50 }} />
                    <TextField margin="dense" label="Descripción" name="description" value={form.description} onChange={handleChange} fullWidth />
                    <TextField margin="dense" label="Color" name="color" value={form.color} onChange={handleChange} fullWidth type="color" InputLabelProps={{ shrink: true }} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancelar</Button>
                    <Button onClick={handleSubmit} variant="contained">Guardar</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default AreaAdmin; 