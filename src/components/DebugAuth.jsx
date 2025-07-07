import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Alert, Paper } from '@mui/material';

const DebugAuth = () => {
    const [debugInfo, setDebugInfo] = useState({});

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        const userId = localStorage.getItem('userId');

        setDebugInfo({
            token: token ? 'Presente' : 'Ausente',
            role: role || 'No encontrado',
            userId: userId || 'No encontrado',
            shouldHaveAccess: !!(token && role === 'admin' && userId)
        });
    }, []);

    const testBackend = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('No hay token');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/users/verify', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                alert(`✅ Token válido\nUsuario: ${data.user.role}\nID: ${data.user._id}`);
            } else {
                alert(`❌ Token inválido\nStatus: ${response.status}`);
            }
        } catch (error) {
            alert(`❌ Error: ${error.message}`);
        }
    };

    const clearAuth = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        window.location.reload();
    };

    return (
        <Box p={3}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                    🔍 Debug de Autenticación
                </Typography>

                <Box sx={{ mb: 2 }}>
                    <Typography variant="h6">📋 Estado Actual:</Typography>
                    <Typography>Token: {debugInfo.token}</Typography>
                    <Typography>Role: {debugInfo.role}</Typography>
                    <Typography>UserId: {debugInfo.userId}</Typography>
                    <Typography>¿Debería tener acceso?: {debugInfo.shouldHaveAccess ? 'SÍ' : 'NO'}</Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={testBackend}
                        sx={{ mr: 1 }}
                    >
                        🔍 Probar Backend
                    </Button>
                    <Button
                        variant="outlined"
                        color="error"
                        onClick={clearAuth}
                    >
                        🗑️ Limpiar Auth
                    </Button>
                </Box>

                {debugInfo.shouldHaveAccess ? (
                    <Alert severity="success">
                        ✅ Tienes todos los datos necesarios. Deberías poder acceder a Auditoría.
                    </Alert>
                ) : (
                    <Alert severity="error">
                        ❌ Faltan datos de autenticación. No podrás acceder a Auditoría.
                    </Alert>
                )}
            </Paper>
        </Box>
    );
};

export default DebugAuth; 