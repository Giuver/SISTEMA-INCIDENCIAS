import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Alert, CircularProgress, Box } from '@mui/material';
import { API_ENDPOINTS } from '../config/api';

const PrivateRoute = ({ children, roles }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(API_ENDPOINTS.VERIFY, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Error al verificar el token');
                }

                const data = await response.json();
                if (data && data.user) {
                    setIsAuthenticated(true);
                    setUserRole(data.user.role);
                    localStorage.setItem('role', data.user.role);
                    localStorage.setItem('userId', data.user._id);
                } else {
                    throw new Error('Respuesta inválida del servidor');
                }
            } catch (error) {
                console.error('Error verificando token:', error);
                setError(error.message);
                localStorage.removeItem('token');
                localStorage.removeItem('role');
                localStorage.removeItem('userId');
                setIsAuthenticated(false);
                setUserRole(null);
                navigate('/login', { replace: true });
            } finally {
                setIsLoading(false);
            }
        };

        verifyToken();
    }, [token, navigate]);

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={3}>
                <Alert severity="error">
                    {error}
                </Alert>
            </Box>
        );
    }

    if (!token || !isAuthenticated) {
        return <Navigate to="/login" state={{ from: window.location.pathname }} replace />;
    }

    if (roles && !roles.includes(userRole)) {
        return (
            <Box p={3}>
                <Alert severity="error">
                    Acceso denegado. No tienes los permisos necesarios para ver esta página.
                </Alert>
            </Box>
        );
    }

    return children;
};

export default PrivateRoute; 