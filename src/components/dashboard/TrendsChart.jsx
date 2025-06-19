import React from 'react';
import { Paper, Typography, Box, useTheme } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const TrendsChart = ({ data, loading }) => {
    const theme = useTheme();

    if (loading) {
        return (
            <Paper sx={{ p: 3, minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography>Cargando tendencias...</Typography>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3, minHeight: 300 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>
                Tendencia de Incidencias (Últimos 7 días)
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8} />
                            <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0.1} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis
                        dataKey="date"
                        stroke={theme.palette.text.secondary}
                        fontSize={12}
                    />
                    <YAxis
                        allowDecimals={false}
                        stroke={theme.palette.text.secondary}
                        fontSize={12}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 8
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="count"
                        stroke={theme.palette.primary.main}
                        fillOpacity={1}
                        fill="url(#colorCount)"
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </Paper>
    );
};

export default TrendsChart; 