import React, { useState } from 'react';
import { Container, Paper, Typography, TextField, Button, Alert, Box, MenuItem } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
import { apiService } from '../utils/apiService';

const Register = () => {
    const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'usuario' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showRole, setShowRole] = useState(false);
    const navigate = useNavigate();

    React.useEffect(() => {
        // Consultar si hay usuarios para mostrar el selector de rol solo si no hay ninguno (primer registro)
        const fetchUserCount = async () => {
            try {
                const res = await apiService.get('/users/count');
                if (res.count === 0) setShowRole(true);
            } catch (err) {
                // setUserCount(0); // This line was removed from the new_code, so it's removed here.
            }
        };
        fetchUserCount();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await apiService.post('/users/register', form);
            // setSuccess('Usuario registrado correctamente'); // This line was removed from the new_code, so it's removed here.
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('role', res.data.rol || form.rol);
            navigate('/');
        } catch (err) {
            setError('Error al registrar usuario');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 8 }}>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom>Registro de Usuario</Typography>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <form onSubmit={handleRegister}>
                    <TextField
                        label="Nombre"
                        name="nombre"
                        value={form.nombre}
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
                    />
                    <TextField
                        label="Contraseña"
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange}
                        fullWidth
                        required
                        margin="normal"
                    />
                    {showRole && (
                        <TextField
                            select
                            label="Rol"
                            name="rol"
                            value={form.rol}
                            onChange={handleChange}
                            fullWidth
                            required
                            margin="normal"
                        >
                            <MenuItem value="admin">Administrador</MenuItem>
                            <MenuItem value="usuario">Usuario</MenuItem>
                        </TextField>
                    )}
                    <Box sx={{ mt: 2 }}>
                        <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading}>
                            {loading ? 'Registrando...' : 'Registrarse'}
                        </Button>
                    </Box>
                </form>
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Button color="secondary" onClick={() => navigate('/login')}>¿Ya tienes cuenta? Inicia sesión</Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default Register; 