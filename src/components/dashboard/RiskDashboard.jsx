import React, { useState, useEffect } from 'react';
import {
    Paper,
    Typography,
    Box,
    Grid,
    Card,
    CardContent,
    Chip,
    LinearProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Security,
    BugReport,
    Notifications,
    People,
    Category,
    Dashboard as DashboardIcon,
    CheckCircle,
    Error,
    Warning,
    Info
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const RiskDashboard = () => {
    const [riskData, setRiskData] = useState(null);
    const [testResults, setTestResults] = useState(null);
    const [loading, setLoading] = useState(true);

    // Datos de ejemplo - en producción vendrían de la API
    const mockRiskData = {
        summary: {
            totalFunctionalities: 6,
            criticalFunctions: 1,
            highRiskFunctions: 2,
            totalRiskScore: 29
        },
        testPlan: {
            immediate: [
                {
                    functionality: 'auth',
                    riskScore: 9,
                    description: 'Autenticación y Autorización',
                    testCases: ['login_validation', 'token_verification', 'role_based_access']
                }
            ],
            high: [
                {
                    functionality: 'incidents',
                    riskScore: 6,
                    description: 'Gestión de Incidencias',
                    testCases: ['incident_creation', 'incident_update', 'file_upload']
                },
                {
                    functionality: 'users',
                    riskScore: 5,
                    description: 'Gestión de Usuarios',
                    testCases: ['user_creation', 'user_update', 'role_management']
                }
            ],
            medium: [
                {
                    functionality: 'notifications',
                    riskScore: 4,
                    description: 'Notificaciones en Tiempo Real',
                    testCases: ['websocket_connection', 'notification_delivery']
                },
                {
                    functionality: 'dashboard',
                    riskScore: 3,
                    description: 'Dashboard y Reportes',
                    testCases: ['data_visualization', 'chart_rendering']
                }
            ],
            low: [
                {
                    functionality: 'areas',
                    riskScore: 2,
                    description: 'Gestión de Áreas',
                    testCases: ['area_creation', 'area_update']
                }
            ]
        }
    };

    const mockTestResults = {
        critical: { passed: 4, failed: 0, total: 4 },
        high: { passed: 6, failed: 1, total: 7 },
        medium: { passed: 4, failed: 0, total: 4 },
        low: { passed: 2, failed: 0, total: 2 },
        total: { passed: 16, failed: 1, total: 17 }
    };

    useEffect(() => {
        // Simular carga de datos
        setTimeout(() => {
            setRiskData(mockRiskData);
            setTestResults(mockTestResults);
            setLoading(false);
        }, 1000);
    }, []);

    const getRiskColor = (riskScore) => {
        if (riskScore >= 8) return '#d32f2f'; // Rojo - Crítico
        if (riskScore >= 5) return '#f57c00'; // Naranja - Alto
        if (riskScore >= 3) return '#fbc02d'; // Amarillo - Medio
        return '#388e3c'; // Verde - Bajo
    };

    const getRiskIcon = (functionality) => {
        const icons = {
            auth: <Security />,
            incidents: <BugReport />,
            notifications: <Notifications />,
            users: <People />,
            areas: <Category />,
            dashboard: <DashboardIcon />
        };
        return icons[functionality] || <Info />;
    };

    const getTestStatusIcon = (passed, failed) => {
        if (failed === 0) return <CheckCircle color="success" />;
        if (failed > 0 && passed > 0) return <Warning color="warning" />;
        return <Error color="error" />;
    };

    const pieData = [
        { name: 'Crítico', value: mockRiskData.testPlan.immediate.length, color: '#d32f2f' },
        { name: 'Alto', value: mockRiskData.testPlan.high.length, color: '#f57c00' },
        { name: 'Medio', value: mockRiskData.testPlan.medium.length, color: '#fbc02d' },
        { name: 'Bajo', value: mockRiskData.testPlan.low.length, color: '#388e3c' }
    ];

    const barData = [
        { name: 'Crítico', pasaron: mockTestResults.critical.passed, fallaron: mockTestResults.critical.failed },
        { name: 'Alto', pasaron: mockTestResults.high.passed, fallaron: mockTestResults.high.failed },
        { name: 'Medio', pasaron: mockTestResults.medium.passed, fallaron: mockTestResults.medium.failed },
        { name: 'Bajo', pasaron: mockTestResults.low.passed, fallaron: mockTestResults.low.failed }
    ];

    if (loading) {
        return (
            <Paper sx={{ p: 3, minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography>Cargando análisis de riesgos...</Typography>
            </Paper>
        );
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                Dashboard de Riesgos y Pruebas
            </Typography>

            {/* Resumen de Riesgos */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={1}>
                                <Security color="error" />
                                <Typography variant="h6">Crítico</Typography>
                            </Box>
                            <Typography variant="h4" color="error">
                                {mockRiskData.testPlan.immediate.length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Funcionalidades críticas
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={1}>
                                <Warning color="warning" />
                                <Typography variant="h6">Alto</Typography>
                            </Box>
                            <Typography variant="h4" color="warning.main">
                                {mockRiskData.testPlan.high.length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Funcionalidades de alto riesgo
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={1}>
                                <Info color="info" />
                                <Typography variant="h6">Medio</Typography>
                            </Box>
                            <Typography variant="h4" color="info.main">
                                {mockRiskData.testPlan.medium.length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Funcionalidades de riesgo medio
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={1}>
                                <CheckCircle color="success" />
                                <Typography variant="h6">Bajo</Typography>
                            </Box>
                            <Typography variant="h4" color="success.main">
                                {mockRiskData.testPlan.low.length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Funcionalidades de bajo riesgo
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Gráficos */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Distribución de Riesgos
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Resultados de Pruebas por Riesgo
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={barData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <RechartsTooltip />
                                <Bar dataKey="pasaron" fill="#4caf50" name="Pasaron" />
                                <Bar dataKey="fallaron" fill="#f44336" name="Fallaron" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>

            {/* Detalle de Funcionalidades */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Detalle de Funcionalidades por Riesgo
                </Typography>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Funcionalidad</TableCell>
                                <TableCell>Descripción</TableCell>
                                <TableCell>Puntuación de Riesgo</TableCell>
                                <TableCell>Estado de Pruebas</TableCell>
                                <TableCell>Casos de Prueba</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {[
                                ...mockRiskData.testPlan.immediate.map(item => ({ ...item, priority: 'Crítico' })),
                                ...mockRiskData.testPlan.high.map(item => ({ ...item, priority: 'Alto' })),
                                ...mockRiskData.testPlan.medium.map(item => ({ ...item, priority: 'Medio' })),
                                ...mockRiskData.testPlan.low.map(item => ({ ...item, priority: 'Bajo' }))
                            ].map((item) => (
                                <TableRow key={item.functionality}>
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            {getRiskIcon(item.functionality)}
                                            <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                                {item.functionality}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>{item.description}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={`${item.riskScore}/9`}
                                            sx={{
                                                backgroundColor: getRiskColor(item.riskScore),
                                                color: 'white'
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            {getTestStatusIcon(
                                                mockTestResults[item.priority.toLowerCase()]?.passed || 0,
                                                mockTestResults[item.priority.toLowerCase()]?.failed || 0
                                            )}
                                            <Typography variant="body2">
                                                {mockTestResults[item.priority.toLowerCase()]?.passed || 0}/
                                                {mockTestResults[item.priority.toLowerCase()]?.total || 0}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary">
                                            {item.testCases.length} casos
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Alertas */}
            {mockTestResults.total.failed > 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                    Hay {mockTestResults.total.failed} prueba(s) fallida(s).
                    Revisar los resultados y corregir los problemas identificados.
                </Alert>
            )}

            {mockTestResults.total.failed === 0 && (
                <Alert severity="success" sx={{ mt: 2 }}>
                    ¡Excelente! Todas las pruebas han pasado exitosamente.
                </Alert>
            )}
        </Box>
    );
};

export default RiskDashboard; 