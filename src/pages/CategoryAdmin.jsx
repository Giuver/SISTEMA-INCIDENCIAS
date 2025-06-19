import React, { useEffect, useState } from 'react';
import {
    Container, Paper, Typography, Button, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip, Tooltip, Alert
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import axios from 'axios';

const emptyCategory = { name: '', description: '', color: '#4CAF50' };

const CategoryAdmin = () => {
    const [categories, setCategories] = useState([]);
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState(emptyCategory);
    const [selectedId, setSelectedId] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [incidents, setIncidents] = useState([]);

    const fetchCategories = async () => {
        try {
            const res = await axios.get('/api/categories');
            setCategories(res.data);
        } catch (err) {
            setError('Error al cargar categorías');
        }
    };

    const fetchIncidents = async () => {
        try {
            const res = await axios.get('/api/incidents');
            setIncidents(res.data);
        } catch (err) {
            // No bloquear por error aquí
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchIncidents();
    }, []);

    const handleOpen = (cat = emptyCategory, id = null) => {
        setForm(cat);
        setSelectedId(id);
        setEditMode(!!id);
        setOpen(true);
        setError('');
        setSuccess('');
    };

    const handleClose = () => {
        setOpen(false);
        setForm(emptyCategory);
        setSelectedId(null);
        setEditMode(false);
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const validate = () => {
        if (!form.name || form.name.length < 3) return 'El nombre es obligatorio y debe tener al menos 3 caracteres';
        if (!form.color) return 'El color es obligatorio';
        if (categories.some(cat => cat.name === form.name && (!editMode || cat._id !== selectedId))) return 'El nombre de la categoría ya existe';
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
                await axios.put(`/api/categories/${selectedId}`, form, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
                setSuccess('Categoría actualizada');
            } else {
                await axios.post('/api/categories', form, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
                setSuccess('Categoría creada');
            }
            fetchCategories();
            handleClose();
        } catch (err) {
            setError('Error al guardar la categoría');
        }
    };

    const handleDelete = async (id) => {
        // Bloquear eliminación si la categoría está en uso
        const cat = categories.find(c => c._id === id);
        const used = incidents.some(i => i.category === cat.name);
        if (used) {
            setError('No se puede eliminar una categoría que está en uso por incidencias.');
            return;
        }
        if (!window.confirm('¿Seguro que deseas eliminar esta categoría?')) return;
        try {
            await axios.delete(`/api/categories/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            setSuccess('Categoría eliminada');
            fetchCategories();
        } catch (err) {
            setError('Error al eliminar la categoría');
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Paper sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h4">Administrar Categorías</Typography>
                    <Button variant="contained" color="primary" startIcon={<Add />} onClick={() => handleOpen()}>Nueva Categoría</Button>
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
                            {categories.map((cat) => (
                                <TableRow key={cat._id}>
                                    <TableCell>{cat.name}</TableCell>
                                    <TableCell>{cat.description}</TableCell>
                                    <TableCell>
                                        <Chip label={cat.color} style={{ backgroundColor: cat.color, color: '#fff' }} />
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title="Editar">
                                            <IconButton onClick={() => handleOpen(cat, cat._id)} color="primary"><Edit /></IconButton>
                                        </Tooltip>
                                        <Tooltip title="Eliminar">
                                            <span>
                                                <IconButton onClick={() => handleDelete(cat._id)} color="error" disabled={incidents.some(i => i.category === cat.name)}>
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
                <DialogTitle>{editMode ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
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

export default CategoryAdmin; 