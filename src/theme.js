import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: '#4CAF50', // Verde principal
            light: '#81C784', // Verde claro
            dark: '#388E3C', // Verde oscuro
        },
        secondary: {
            main: '#2196F3', // Azul para acentos
            light: '#64B5F6',
            dark: '#1976D2',
        },
        background: {
            default: '#F5F5F5', // Gris muy claro para el fondo
            paper: '#FFFFFF', // Blanco para tarjetas y contenedores
        },
        text: {
            primary: '#333333', // Gris oscuro para texto principal
            secondary: '#666666', // Gris medio para texto secundario
        },
        success: {
            main: '#4CAF50', // Verde para estados exitosos
        },
        warning: {
            main: '#FFC107', // Amarillo para advertencias
        },
        error: {
            main: '#F44336', // Rojo para errores
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontSize: '2.5rem',
            fontWeight: 500,
        },
        h2: {
            fontSize: '2rem',
            fontWeight: 500,
        },
        h3: {
            fontSize: '1.75rem',
            fontWeight: 500,
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    textTransform: 'none',
                    fontWeight: 500,
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                },
            },
        },
    },
});

export default theme; 