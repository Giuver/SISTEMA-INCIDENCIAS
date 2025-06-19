import React, { useState } from 'react';
import { Container, Paper, Typography, TextField, Button, Alert, Box } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';

const Login = () => {
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await axios.post(API_ENDPOINTS.LOGIN, form, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (res.data.token) {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('role', res.data.role);
                localStorage.setItem('userId', res.data.userId);
                navigate('/');
            } else {
                setError('Error en la respuesta del servidor');
            }
        } catch (err) {
            console.error('Error de login:', err);
            setError(err.response?.data?.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 8 }}>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom>Iniciar Sesión</Typography>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <form onSubmit={handleSubmit}>
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
                    <Box sx={{ mt: 2 }}>
                        <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading}>
                            {loading ? 'Ingresando...' : 'Ingresar'}
                        </Button>
                    </Box>
                </form>
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Button color="secondary" onClick={() => navigate('/registro')}>¿No tienes cuenta? Regístrate</Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default Login; 