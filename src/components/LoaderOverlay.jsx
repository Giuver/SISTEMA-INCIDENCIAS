import React from 'react';
import { Box, CircularProgress } from '@mui/material';

const LoaderOverlay = ({ open }) => {
    if (!open) return null;
    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                bgcolor: 'rgba(255,255,255,0.6)',
                zIndex: 2000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <CircularProgress size={70} thickness={5} color="primary" />
        </Box>
    );
};

export default LoaderOverlay; 