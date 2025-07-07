import React, { useState, useEffect, useRef } from 'react';
import {
    Badge,
    IconButton,
    Popover,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Typography,
    Box,
    Button,
    Divider,
    Chip,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    BugReport,
    Assignment,
    Person,
    Category,
    CheckCircle,
    Circle,
    MoreVert
} from '@mui/icons-material';
import axios from 'axios';
import { useNotification } from '../utils/notification';
import { io } from 'socket.io-client';
import sessionManager from '../utils/sessionManager';

const NotificationCenter = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [anchorEl, setAnchorEl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const notify = useNotification();
    const socketRef = useRef(null);
    const authData = sessionManager.getAuthData();
    const userId = authData?.userId;

    const open = Boolean(anchorEl);

    // Iconos por tipo de notificación
    const getNotificationIcon = (type) => {
        switch (type) {
            case 'incident_created':
            case 'incident_assigned':
            case 'incident_status_changed':
            case 'incident_resolved':
                return <BugReport color="primary" />;
            case 'user_created':
            case 'user_deleted':
                return <Person color="secondary" />;
            case 'category_created':
            case 'category_deleted':
                return <Category color="info" />;
            default:
                return <NotificationsIcon />;
        }
    };

    // Color de prioridad
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high':
                return 'error';
            case 'medium':
                return 'warning';
            case 'low':
                return 'success';
            default:
                return 'default';
        }
    };

    // Formatear fecha
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            return 'Hace unos minutos';
        } else if (diffInHours < 24) {
            return `Hace ${Math.floor(diffInHours)} horas`;
        } else {
            return date.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    };

    const fetchNotifications = async (pageNum = 1, append = false) => {
        try {
            setLoading(true);
            const authData = sessionManager.getAuthData();
            const token = authData?.token;
            const response = await axios.get(`/api/notifications?page=${pageNum}&limit=10`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const { notifications: newNotifications, total, unreadCount: newUnreadCount } = response.data;

            setUnreadCount(newUnreadCount);

            if (append) {
                setNotifications(prev => [...prev, ...newNotifications]);
            } else {
                setNotifications(newNotifications);
            }

            setHasMore(newNotifications.length === 10);
        } catch (error) {
            notify('Error al cargar notificaciones', 'error');
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            const authData = sessionManager.getAuthData();
            const token = authData?.token;
            await axios.patch(`/api/notifications/${notificationId}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setNotifications(prev =>
                prev.map(notif =>
                    notif._id === notificationId
                        ? { ...notif, read: true }
                        : notif
                )
            );

            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            notify('Error al marcar como leída', 'error');
        }
    };

    const markAllAsRead = async () => {
        try {
            const authData = sessionManager.getAuthData();
            const token = authData?.token;
            await axios.patch('/api/notifications/read-all', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setNotifications(prev =>
                prev.map(notif => ({ ...notif, read: true }))
            );

            setUnreadCount(0);
            notify('Todas las notificaciones marcadas como leídas', 'success');
        } catch (error) {
            notify('Error al marcar todas como leídas', 'error');
        }
    };

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchNotifications(nextPage, true);
    };

    // Socket.io: conexión y recepción de notificaciones en tiempo real
    useEffect(() => {
        if (!userId) return;
        if (!socketRef.current) {
            const authData = sessionManager.getAuthData();
            const token = authData?.token;
            socketRef.current = io('http://localhost:5000', {
                auth: {
                    token: token
                }
            });
            socketRef.current.on('connect', () => {
                console.log('WebSocket conectado');
                socketRef.current.emit('authenticate', userId);
            });
            socketRef.current.on('connect_error', (error) => {
                console.error('Error de conexión WebSocket:', error);
            });
            socketRef.current.on('newNotification', (notification) => {
                notify(notification.title + ': ' + notification.message, notification.priority === 'high' ? 'error' : notification.priority === 'medium' ? 'warning' : 'info');
                // Refrescar notificaciones solo si el popover está cerrado
                if (!open) {
                    fetchNotifications(1, false);
                } else {
                    // Si está abierto, solo sumar el contador
                    setUnreadCount(prev => prev + 1);
                }
            });
        }
        // Cleanup
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
        // eslint-disable-next-line
    }, [userId]);

    useEffect(() => {
        if (open) {
            fetchNotifications(1, false);
        }
    }, [open]);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <>
            <IconButton
                color="inherit"
                onClick={handleClick}
                sx={{ position: 'relative' }}
            >
                <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                </Badge>
            </IconButton>

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                PaperProps={{
                    sx: {
                        width: 400,
                        maxHeight: 500,
                        mt: 1
                    }
                }}
            >
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">Notificaciones</Typography>
                        {unreadCount > 0 && (
                            <Button size="small" onClick={markAllAsRead}>
                                Marcar todas como leídas
                            </Button>
                        )}
                    </Box>
                </Box>

                <List sx={{ p: 0 }}>
                    {notifications.length === 0 && !loading ? (
                        <ListItem>
                            <ListItemText
                                primary="No hay notificaciones"
                                secondary="Todas las notificaciones aparecerán aquí"
                            />
                        </ListItem>
                    ) : (
                        notifications.map((notification) => (
                            <React.Fragment key={notification._id || notification.id}>
                                <ListItem
                                    sx={{
                                        cursor: 'pointer',
                                        bgcolor: notification.read ? 'transparent' : 'action.hover',
                                        '&:hover': { bgcolor: 'action.selected' }
                                    }}
                                    onClick={() => !notification.read && markAsRead(notification._id || notification.id)}
                                >
                                    <ListItemIcon>
                                        {notification.read ? (
                                            <Circle sx={{ fontSize: 16, color: 'text.disabled' }} />
                                        ) : (
                                            <CheckCircle sx={{ fontSize: 16, color: 'primary.main' }} />
                                        )}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <Typography component="span" variant="subtitle2" sx={{ fontWeight: notification.read ? 'normal' : 'bold' }}>
                                                {notification.title}
                                                <Chip
                                                    label={notification.priority}
                                                    size="small"
                                                    color={getPriorityColor(notification.priority)}
                                                    variant="outlined"
                                                    sx={{ ml: 1 }}
                                                />
                                            </Typography>
                                        }
                                        secondary={
                                            <Typography component="span" variant="body2" color="text.secondary">
                                                {notification.message}
                                                <br />
                                                <Typography component="span" variant="caption" color="text.disabled">
                                                    {formatDate(notification.createdAt)}
                                                </Typography>
                                            </Typography>
                                        }
                                    />
                                    <ListItemIcon>
                                        {getNotificationIcon(notification.type)}
                                    </ListItemIcon>
                                </ListItem>
                                <Divider />
                            </React.Fragment>
                        ))
                    )}

                    {loading && (
                        <ListItem>
                            <Box display="flex" justifyContent="center" width="100%" py={2}>
                                <CircularProgress size={24} />
                            </Box>
                        </ListItem>
                    )}

                    {hasMore && !loading && notifications.length > 0 && (
                        <ListItem>
                            <Button
                                fullWidth
                                onClick={loadMore}
                                variant="outlined"
                                size="small"
                            >
                                Cargar más
                            </Button>
                        </ListItem>
                    )}
                </List>
            </Popover>
        </>
    );
};

export default NotificationCenter; 