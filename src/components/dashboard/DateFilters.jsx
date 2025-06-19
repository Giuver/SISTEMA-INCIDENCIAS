import React from 'react';
import {
    Paper,
    Box,
    Button,
    Typography,
    useTheme,
    Chip
} from '@mui/material';
import {
    Today,
    DateRange,
    TrendingUp,
    Refresh
} from '@mui/icons-material';

const DateFilters = ({ selectedRange, onRangeChange, onRefresh }) => {
    const theme = useTheme();

    const ranges = [
        { label: 'Hoy', value: 'today', days: 1 },
        { label: 'Últimos 7 días', value: 'week', days: 7 },
        { label: 'Últimos 30 días', value: 'month', days: 30 },
        { label: 'Últimos 90 días', value: 'quarter', days: 90 }
    ];

    return (
        <Paper sx={{ p: 2, mb: 3, bgcolor: theme.palette.grey[50] }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                <Box display="flex" alignItems="center" gap={2}>
                    <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                        <DateRange sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Período de análisis:
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                        {ranges.map((range) => (
                            <Chip
                                key={range.value}
                                label={range.label}
                                onClick={() => onRangeChange(range)}
                                variant={selectedRange?.value === range.value ? "filled" : "outlined"}
                                color={selectedRange?.value === range.value ? "primary" : "default"}
                                sx={{
                                    cursor: 'pointer',
                                    '&:hover': {
                                        bgcolor: theme.palette.primary.light,
                                        color: theme.palette.primary.contrastText
                                    }
                                }}
                            />
                        ))}
                    </Box>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={onRefresh}
                    size="small"
                >
                    Actualizar
                </Button>
            </Box>
            {selectedRange && (
                <Box mt={2}>
                    <Typography variant="body2" color="text.secondary">
                        Mostrando datos de los últimos {selectedRange.days} días
                    </Typography>
                </Box>
            )}
        </Paper>
    );
};

export default DateFilters; 