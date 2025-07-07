import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Alert, CircularProgress, Box, Typography } from '@mui/material';

const PrivateRoute = ({ children, roles }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [error, setError] = useState(null);
    const [redirecting, setRedirecting] = useState(false);
    const [redirectReason, setRedirectReason] = useState('');

    useEffect(() => {
        const checkAuth = async () => {
            console.log('🔍 PrivateRoute - Iniciando verificación de autenticación');

            const token = localStorage.getItem('token');
            const storedRole = localStorage.getItem('role');
            const storedUserId = localStorage.getItem('userId');

            console.log('🔍 Token en localStorage:', token ? 'Presente' : 'Ausente');
            console.log('🔍 Rol en localStorage:', storedRole);
            console.log('🔍 UserId en localStorage:', storedUserId);

            // Si no hay token, redirigir después de 5 segundos
            if (!token) {
                console.log('❌ No hay token, redirigiendo a login en 5 segundos');
                setRedirectReason('No hay token en localStorage. Serás redirigido al login.');
                setRedirecting(true);
                setIsLoading(false);
                setTimeout(() => setRedirecting(false), 5000);
                return;
            }

            // Si tenemos todos los datos en localStorage, confiar en ellos
            if (token && storedRole && storedUserId) {
                console.log('✅ Datos completos en localStorage, confiando en ellos');
                console.log('✅ Rol del usuario:', storedRole);

                setIsAuthenticated(true);
                setUserRole(storedRole);
                setIsLoading(false);

                // Verificar roles requeridos
                if (roles && !roles.includes(storedRole)) {
                    console.log('❌ Rol no autorizado:', storedRole, 'Roles requeridos:', roles);
                    setError(`Acceso denegado. Rol: ${storedRole}, Roles requeridos: ${roles.join(', ')}`);
                }
                return;
            }

            // Si faltan datos, verificar con el backend
            console.log('🔍 Verificando token con el backend...');
            try {
                const response = await fetch('http://localhost:5000/api/users/verify', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                console.log('🔍 Respuesta del backend:', response.status);

                if (response.ok) {
                    const data = await response.json();
                    console.log('✅ Token válido, datos del usuario:', data.user);

                    setIsAuthenticated(true);
                    setUserRole(data.user.role);

                    // Actualizar localStorage
                    localStorage.setItem('role', data.user.role);
                    localStorage.setItem('userId', data.user._id);

                    console.log('✅ Estado de autenticación actualizado correctamente');

                    // Verificar roles requeridos
                    if (roles && !roles.includes(data.user.role)) {
                        console.log('❌ Rol no autorizado:', data.user.role, 'Roles requeridos:', roles);
                        setError(`Acceso denegado. Rol: ${data.user.role}, Roles requeridos: ${roles.join(', ')}`);
                    }
                } else {
                    console.log('❌ Token inválido, redirigiendo a login en 5 segundos');
                    setRedirectReason('Token inválido o expirado. Serás redirigido al login.');
                    setRedirecting(true);
                    setIsAuthenticated(false);
                    localStorage.removeItem('token');
                    localStorage.removeItem('role');
                    localStorage.removeItem('userId');
                    setTimeout(() => setRedirecting(false), 5000);
                }
            } catch (error) {
                console.log('❌ Error de red:', error.message);
                setRedirectReason('Error de red. Serás redirigido al login.');
                setRedirecting(true);
                setIsAuthenticated(false);
                setTimeout(() => setRedirecting(false), 5000);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    // Mostrar loading mientras verifica
    if (isLoading) {
        console.log('⏳ PrivateRoute - Cargando...');
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    // Mostrar error de acceso denegado
    if (error) {
        console.log('❌ PrivateRoute - Error de acceso:', error);
        return (
            <Box p={3}>
                <Alert severity="error">
                    {error}
                </Alert>
            </Box>
        );
    }

    // Si está en proceso de redirección, mostrar mensaje y esperar 5 segundos
    if (redirecting) {
        return (
            <Box p={3} display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh">
                <Alert severity="warning" sx={{ mb: 2 }}>
                    {redirectReason}
                </Alert>
                <Typography variant="body2" color="text.secondary">
                    Redirigiendo en 5 segundos...
                </Typography>
            </Box>
        );
    }

    // Si no está autenticado y ya pasó el retardo, redirigir
    if (!isAuthenticated && !isLoading && !redirecting) {
        console.log('❌ PrivateRoute - No autenticado, redirigiendo a login');
        return <Navigate to="/login" replace />;
    }

    // Si está autenticado pero no tiene el rol requerido
    if (roles && userRole && !roles.includes(userRole)) {
        console.log('❌ PrivateRoute - Rol no autorizado:', userRole, 'Roles requeridos:', roles);
        return (
            <Box p={3}>
                <Alert severity="error">
                    Acceso denegado. No tienes los permisos necesarios para ver esta página.<br />
                    Tu rol: {userRole}<br />
                    Roles requeridos: {roles.join(', ')}
                </Alert>
            </Box>
        );
    }

    // Todo bien, renderizar el contenido
    console.log('✅ PrivateRoute - Acceso autorizado, renderizando contenido');
    return children;
};

export default PrivateRoute; 