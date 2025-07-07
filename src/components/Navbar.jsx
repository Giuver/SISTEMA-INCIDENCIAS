import React, { useState } from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, Typography, Box, Button, Divider, Avatar, IconButton, AppBar, useMediaQuery } from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ListAltIcon from '@mui/icons-material/ListAlt';
import CategoryIcon from '@mui/icons-material/Category';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import GroupIcon from '@mui/icons-material/Group';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import MenuIcon from '@mui/icons-material/Menu';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import NotificationCenter from './NotificationCenter';

const drawerWidth = 250;

const Sidebar = () => {
    const [open, setOpen] = useState(false);
    const isMobile = useMediaQuery('(max-width:900px)');
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
    };

    const handleDrawerOpen = () => setOpen(true);
    const handleDrawerClose = () => setOpen(false);

    // Contenido del Drawer (sidebar)
    const drawerContent = (
        <>
            <Toolbar sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', py: 3, px: 2, gap: 1 }}>
                <Avatar sx={{ bgcolor: '#fff', width: 44, height: 44 }}>
                    <BugReportIcon sx={{ color: '#43a047', fontSize: 26 }} />
                </Avatar>
                <Typography
                    variant="h6"
                    noWrap
                    component="div"
                    sx={{
                        fontWeight: 'bold',
                        letterSpacing: 1,
                        color: '#fff',
                        ml: 1,
                        maxWidth: 120,
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textAlign: 'left',
                        fontSize: { xs: '1rem', sm: '1.1rem', md: '1.15rem' }
                    }}
                >
                    Gestión de Incidencias
                </Typography>
                {/* Campanita solo en sidebar de escritorio */}
                {!isMobile && <Box ml={1}><NotificationCenter /></Box>}
            </Toolbar>
            <Divider sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} />
            <List sx={{ mt: 2 }}>
                <ListItem button component={RouterLink} to="/" sx={{ borderRadius: 2, mx: 1, mb: 1, '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }} onClick={handleDrawerClose}>
                    <ListItemIcon sx={{ color: '#fff' }}><DashboardIcon /></ListItemIcon>
                    <ListItemText primary="Dashboard" />
                </ListItem>
                <ListItem button component={RouterLink} to="/incidencias" sx={{ borderRadius: 2, mx: 1, mb: 1, '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }} onClick={handleDrawerClose}>
                    <ListItemIcon sx={{ color: '#fff' }}><ListAltIcon /></ListItemIcon>
                    <ListItemText primary="Incidencias" />
                </ListItem>
                <ListItem button component={RouterLink} to="/areas" sx={{ borderRadius: 2, mx: 1, mb: 1, '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }} onClick={handleDrawerClose}>
                    <ListItemIcon sx={{ color: '#fff' }}><CategoryIcon /></ListItemIcon>
                    <ListItemText primary="Áreas" />
                </ListItem>

                {role === 'admin' && (
                    <ListItem button component={RouterLink} to="/usuarios" sx={{ borderRadius: 2, mx: 1, mb: 1, '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }} onClick={handleDrawerClose}>
                        <ListItemIcon sx={{ color: '#fff' }}><GroupIcon /></ListItemIcon>
                        <ListItemText primary="Gestión de Usuarios" />
                    </ListItem>
                )}
                {role === 'admin' && (
                    <ListItem button component={RouterLink} to="/auditoria" sx={{ borderRadius: 2, mx: 1, mb: 1, '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }} onClick={handleDrawerClose}>
                        <ListItemIcon sx={{ color: '#fff' }}><AssignmentIndIcon /></ListItemIcon>
                        <ListItemText primary="Auditoría" />
                    </ListItem>
                )}
            </List>
            <Box sx={{ flexGrow: 1 }} />
            <Divider sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} />
            <Box sx={{ p: 3, pb: 2 }}>
                {token ? (
                    <>
                        <Typography variant="body2" sx={{ mb: 1, color: 'rgba(255,255,255,0.8)' }}>
                            Rol: <b>{role}</b>
                        </Typography>
                        <Button
                            variant="contained"
                            color="error"
                            startIcon={<ExitToAppIcon />}
                            fullWidth
                            onClick={() => { handleLogout(); handleDrawerClose(); }}
                            sx={{ fontWeight: 'bold', borderRadius: 2, boxShadow: 'none', mt: 1 }}
                        >
                            Cerrar sesión
                        </Button>
                    </>
                ) : (
                    <>
                        <Button color="inherit" component={RouterLink} to="/login" fullWidth sx={{ mb: 1, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.08)' }} onClick={handleDrawerClose}>
                            Iniciar sesión
                        </Button>
                        <Button color="inherit" component={RouterLink} to="/registro" fullWidth sx={{ borderRadius: 2, bgcolor: 'rgba(255,255,255,0.08)' }} onClick={handleDrawerClose}>
                            Registrarse
                        </Button>
                    </>
                )}
            </Box>
        </>
    );

    return (
        <>
            {/* AppBar solo en móvil/tablet */}
            {isMobile && (
                <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: '#388e3c', boxShadow: 'none' }}>
                    <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', minHeight: 64 }}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <IconButton color="inherit" edge="start" onClick={handleDrawerOpen} sx={{ mr: 1 }}>
                                <MenuIcon />
                            </IconButton>
                            <Avatar sx={{ bgcolor: '#fff', width: 36, height: 36 }}>
                                <BugReportIcon sx={{ color: '#43a047', fontSize: 22 }} />
                            </Avatar>
                            <Typography variant="h6" noWrap sx={{ fontWeight: 'bold', letterSpacing: 1, ml: 1 }}>
                                Gestión de Incidencias
                            </Typography>
                        </Box>
                        {/* Campanita solo en AppBar móvil */}
                        <NotificationCenter />
                    </Toolbar>
                </AppBar>
            )}

            {/* Drawer fijo en escritorio, desplegable en móvil/tablet */}
            <Drawer
                variant={isMobile ? 'temporary' : 'permanent'}
                open={isMobile ? open : true}
                onClose={handleDrawerClose}
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    display: { xs: 'block', sm: 'block' },
                    [`& .MuiDrawer-paper`]: {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        background: 'linear-gradient(180deg, #388e3c 0%, #43a047 100%)',
                        color: '#fff',
                        borderRight: 'none',
                        boxShadow: '2px 0 8px 0 rgba(60,60,60,0.08)'
                    },
                }}
            >
                {drawerContent}
            </Drawer>
            {/* Espaciador para el AppBar */}
            <Toolbar />
        </>
    );
};

export default Sidebar; 