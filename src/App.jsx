import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import theme from './theme';
import Sidebar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import IncidentForm from './pages/IncidentForm';
import IncidentList from './pages/IncidentList';
import IncidentDetail from './pages/IncidentDetail';
import AreaAdmin from './pages/AreaAdmin';
import Login from './pages/Login';
import Register from './pages/Register';
import UserManagement from './pages/UserManagement';
import { SnackbarProvider } from 'notistack';

import { useEffect } from 'react';
import PrivateRoute from './components/PrivateRoute';
import { Box } from '@mui/material';
import AuditLog from './pages/AuditLog';
import { NotificationProvider } from './utils/notification.jsx';
import { testAuthentication, clearTestData } from './utils/testAuth';
import DebugAuth from './components/DebugAuth';

// Función de debug temporal - disponible en la consola del navegador
window.debugAuth = {
    test: testAuthentication,
    clear: clearTestData,
    getToken: () => localStorage.getItem('token'),
    getRole: () => localStorage.getItem('role'),
    getUserId: () => localStorage.getItem('userId'),
    getAll: () => ({
        token: localStorage.getItem('token'),
        role: localStorage.getItem('role'),
        userId: localStorage.getItem('userId')
    })
};

function AppRoutes() {
    const location = useLocation();
    const hideNavbar = location.pathname === '/login' || location.pathname === '/registro' || location.pathname === '/debug';
    return (
        <Box sx={{ display: 'flex' }}>
            {!hideNavbar && <Sidebar />}
            <Box sx={{ flexGrow: 1 }}>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/registro" element={<Register />} />
                    <Route path="/debug" element={<DebugAuth />} />

                    <Route path="/" element={
                        <PrivateRoute>
                            <Dashboard />
                        </PrivateRoute>
                    } />

                    <Route path="/incidencias" element={
                        <PrivateRoute>
                            <IncidentList />
                        </PrivateRoute>
                    } />

                    <Route path="/incidencia/:id" element={
                        <PrivateRoute>
                            <IncidentDetail />
                        </PrivateRoute>
                    } />

                    <Route path="/areas" element={
                        <PrivateRoute roles={['admin']}>
                            <AreaAdmin />
                        </PrivateRoute>
                    } />

                    <Route path="/usuarios" element={
                        <PrivateRoute roles={['admin']}>
                            <UserManagement />
                        </PrivateRoute>
                    } />

                    <Route path="/auditoria" element={
                        <PrivateRoute roles={['admin']}>
                            <AuditLog />
                        </PrivateRoute>
                    } />
                </Routes>
            </Box>
        </Box>
    );
}

function App() {
    return (
        <NotificationProvider>
            <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <Router future={{
                        v7_startTransition: true,
                        v7_relativeSplatPath: true
                    }}>
                        <AppRoutes />
                    </Router>
                </ThemeProvider>
            </SnackbarProvider>
        </NotificationProvider>
    );
}

export default App; 