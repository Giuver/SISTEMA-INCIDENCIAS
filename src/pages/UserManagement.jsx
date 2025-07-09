import React, { useEffect, useState } from 'react';
import {
    Container, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Alert, Box, DialogContentText
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import axios from 'axios';
import { useNotification } from '../utils/notification';
import sessionManager from '../utils/sessionManager';
import { API_ENDPOINTS } from '../config/api';

const roles = [
    { value: 'usuario', label: 'Usuario' },
    { value: 'soporte', label: 'Soporte' },
    { value: 'admin', label: 'Administrador' }
];

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [open, setOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [form, setForm] = useState({ name: '', email: '', role: 'usuario', department: '', password: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const notify = useNotification();
    const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null });

    // Control de permisos por rol
    // Solo admin puede gestionar usuarios
    const userRole = sessionManager.getAuthData()?.role || 'usuario';
    const canManageUsers = userRole === 'admin';

    const fetchUsers = async () => {
        try {
            const token = sessionManager.getAuthData()?.token;
            const res = await axios.get(API_ENDPOINTS.USERS, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data);
        } catch (err) {
            setError('Error al cargar usuarios');
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleOpen = (user = null) => {
        setEditingUser(user);
        if (user) {
            setForm({
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department || '',
                password: ''
            });
        } else {
            setForm({ name: '', email: '', role: 'usuario', department: '', password: '' });
        }
        setError('');
        setSuccess('');
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setEditingUser(null);
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        const token = sessionManager.getAuthData()?.token;
        try {
            if (editingUser) {
                // Editar usuario
                const updateData = { ...form };
                if (!form.password) delete updateData.password;
                await axios.patch(`${API_ENDPOINTS.USERS}/${editingUser._id}`, updateData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSuccess('Usuario actualizado');
                notify('Usuario actualizado', 'success');
            } else {
                // Crear usuario
                await axios.post(`${API_ENDPOINTS.USERS}/register`, form, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSuccess('Usuario creado');
                notify('Usuario creado', 'success');
            }
            fetchUsers();
            setOpen(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al guardar usuario');
            notify(err.response?.data?.message || 'Error al guardar usuario', 'error');
        }
    };

    const handleDeleteClick = (user) => {
        setDeleteDialog({ open: true, user });
    };

    const handleDeleteCancel = () => {
        setDeleteDialog({ open: false, user: null });
    };

    const handleDeleteConfirm = async () => {
        const id = deleteDialog.user._id;
        setDeleteDialog({ open: false, user: null });
        const token = sessionManager.getAuthData()?.token;
        try {
            await axios.delete(`${API_ENDPOINTS.USERS}/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Usuario eliminado');
            notify('Usuario eliminado', 'success');
            fetchUsers();
        } catch (err) {
            setError('Error al eliminar usuario');
            notify('Error al eliminar usuario', 'error');
        }
    };

    // Solo permitir acceso a admin
    if (!canManageUsers) {
        return <Alert severity="error">Acceso denegado. Solo para administradores.</Alert>;
    }

    return (
        <Container maxWidth="md" sx={{ mt: 6 }}>
            <Paper sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h4" fontWeight="bold" mb={2}>
                        Gestión de Usuarios
                    </Typography>
                    <Typography variant="body1" color="text.secondary" mb={3}>
                        Administra usuarios del sistema. Solo los administradores pueden gestionar usuarios.
                    </Typography>
                    <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>Nuevo usuario</Button>
                </Box>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Nombre</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Rol</TableCell>
                                <TableCell>Departamento</TableCell>
                                <TableCell align="right">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user._id}>
                                    <TableCell>{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.role}</TableCell>
                                    <TableCell>{user.department || '-'}</TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            onClick={() => handleOpen(user)}
                                            title="Editar usuario"
                                            size="small"
                                        >
                                            <Edit />
                                        </IconButton>
                                        <IconButton
                                            onClick={() => handleDeleteClick(user)}
                                            title="Eliminar usuario"
                                            size="small"
                                            color="error"
                                        >
                                            <Delete />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>{editingUser ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                        <TextField
                            label="Nombre"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            fullWidth
                            required
                            margin="normal"
                        />
                        <TextField
                            label="Email"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            fullWidth
                            required
                            margin="normal"
                            disabled={!!editingUser}
                        />
                        <TextField
                            label="Rol"
                            name="role"
                            select
                            value={form.role}
                            onChange={handleChange}
                            fullWidth
                            required
                            margin="normal"
                        >
                            {roles.map((option) => (
                                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            label="Departamento"
                            name="department"
                            value={form.department}
                            onChange={handleChange}
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            label="Contraseña"
                            name="password"
                            type="password"
                            value={form.password}
                            onChange={handleChange}
                            fullWidth
                            margin="normal"
                            helperText={editingUser ? 'Dejar en blanco para no cambiar la contraseña' : ''}
                        />
                        <DialogActions>
                            <Button onClick={handleClose}>Cancelar</Button>
                            <Button type="submit" variant="contained">{editingUser ? 'Guardar cambios' : 'Crear usuario'}</Button>
                        </DialogActions>
                    </Box>
                </DialogContent>
            </Dialog>
            <Dialog open={deleteDialog.open} onClose={handleDeleteCancel}>
                <DialogTitle>Confirmar eliminación</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Seguro que deseas eliminar al usuario <b>{deleteDialog.user?.name}</b>? Esta acción no se puede deshacer.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel}>Cancelar</Button>
                    <Button color="error" variant="contained" onClick={handleDeleteConfirm}>Eliminar</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default UserManagement; 