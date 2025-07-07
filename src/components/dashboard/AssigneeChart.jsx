import React from 'react';
import { Paper, Typography, Box, useTheme, Skeleton } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

const AssigneeChart = ({ data, loading }) => {
    const theme = useTheme();

    const colors = [
        theme.palette.primary.main,
        theme.palette.secondary.main,
        theme.palette.success.main,
        theme.palette.warning.main,
        theme.palette.error.main
    ];

    if (loading) {
        return (
            <Paper sx={{ p: 3, minHeight: 300 }}>
                <Typography variant="h6" fontWeight={700} mb={2}>
                    Incidencias por Asignado (Top 5)
                </Typography>
                <Skeleton variant="rectangular" height={250} />
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3, minHeight: 300 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>
                Incidencias por Asignado (Top 5)
            </Typography>
            {data && data.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar
                            dataKey="value"
                            fill={theme.palette.primary.main}
                            label={{ position: 'top' }}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <Box display="flex" alignItems="center" justifyContent="center" height={250}>
                    <Typography color="text.secondary">
                        No hay datos de asignados disponibles
                    </Typography>
                </Box>
            )}
        </Paper>
    );
};

export default AssigneeChart; 