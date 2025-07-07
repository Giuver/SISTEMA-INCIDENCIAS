import { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, AlertTitle } from '@mui/material';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification debe ser usado dentro de NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const addNotification = useCallback((message, severity = 'info', options = {}) => {
        const id = Date.now() + Math.random();
        const notification = {
            id,
            message,
            severity,
            ...options,
            timestamp: new Date()
        };

        setNotifications(prev => [...prev, notification]);

        // Auto-remove notification after duration
        const duration = options.duration || (severity === 'error' ? 6000 : 4000);
        setTimeout(() => {
            removeNotification(id);
        }, duration);

        return id;
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const success = useCallback((message, options = {}) => {
        return addNotification(message, 'success', options);
    }, [addNotification]);

    const error = useCallback((message, options = {}) => {
        return addNotification(message, 'error', options);
    }, [addNotification]);

    const warning = useCallback((message, options = {}) => {
        return addNotification(message, 'warning', options);
    }, [addNotification]);

    const info = useCallback((message, options = {}) => {
        return addNotification(message, 'info', options);
    }, [addNotification]);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    const value = {
        notifications,
        addNotification,
        removeNotification,
        success,
        error,
        warning,
        info,
        clearAll
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
            <NotificationStack />
        </NotificationContext.Provider>
    );
};

const NotificationStack = () => {
    const { notifications, removeNotification } = useNotification();

    return (
        <>
            {notifications.map((notification) => (
                <Snackbar
                    key={notification.id}
                    open={true}
                    autoHideDuration={notification.duration || (notification.severity === 'error' ? 6000 : 4000)}
                    onClose={() => removeNotification(notification.id)}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                    sx={{
                        '& .MuiSnackbarContent-root': {
                            minWidth: '300px',
                            maxWidth: '500px'
                        }
                    }}
                >
                    <Alert
                        onClose={() => removeNotification(notification.id)}
                        severity={notification.severity}
                        variant="filled"
                        sx={{
                            width: '100%',
                            '& .MuiAlert-message': {
                                width: '100%'
                            }
                        }}
                    >
                        {notification.title && (
                            <AlertTitle sx={{ fontWeight: 'bold' }}>
                                {notification.title}
                            </AlertTitle>
                        )}
                        {notification.message}
                    </Alert>
                </Snackbar>
            ))}
        </>
    );
};

export default useNotification; 