import React, { useState } from 'react';
import { Container, Paper, Typography, TextField, Button, Alert, Box, Avatar, Divider, InputAdornment, IconButton, CircularProgress } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
import sessionManager from '../utils/sessionManager';

const Login = () => {
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleClickShowPassword = () => {
        setShowPassword((show) => !show);
    };

    const handleMouseDownPassword = (event) => {
        event.preventDefault();
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
                console.log('✅ Token recibido:', res.data.token.substring(0, 50) + '...');
                console.log('✅ Role recibido:', res.data.role);
                console.log('✅ UserId recibido:', res.data.userId);

                // Usar el gestor de sesiones para guardar datos de forma independiente
                sessionManager.setAuthData({
                    token: res.data.token,
                    role: res.data.role,
                    userId: res.data.userId,
                    userName: res.data.userName || res.data.name
                });

                console.log('💾 Datos guardados en sesión independiente');
                console.log('🆔 ID de sesión:', sessionManager.sessionId);
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
        <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Paper elevation={6} sx={{ p: 5, borderRadius: 3, width: '100%', maxWidth: 420 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, mb: 1 }}>
                        <LockOutlinedIcon fontSize="large" />
                    </Avatar>
                    <Typography variant="h5" fontWeight={600} gutterBottom>
                        Bienvenido al Sistema
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="center">
                        Por favor, ingresa tus credenciales para acceder
                    </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
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
                        autoComplete="email"
                    />
                    <TextField
                        label="Contraseña"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={handleChange}
                        fullWidth
                        required
                        margin="normal"
                        autoComplete="current-password"
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                        onClick={handleClickShowPassword}
                                        onMouseDown={handleMouseDownPassword}
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                    <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2, py: 1.2, fontWeight: 600 }} disabled={loading}>
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Ingresar'}
                    </Button>
                </form>
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Button color="secondary" onClick={() => navigate('/registro')} sx={{ textTransform: 'none' }}>
                        ¿No tienes cuenta? Regístrate
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default Login; 