import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    TextField,
    MenuItem,
    Button,
    Grid,
    Chip,
    CircularProgress,
    Alert,
    AlertTitle
} from '@mui/material';
import { auditAPI, userAPI } from '../utils/apiService';
import sessionManager from '../utils/sessionManager';
import { apiService } from '../utils/apiService';

const actions = [
    'crear',
    'actualizar',
    'eliminar',
    'asignar',
    'cambiar_estado'
];

const entities = [
    'Incident',
    'User',
    'Category'
];

const AuditLog = () => {
    const [logs, setLogs] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [filters, setFilters] = useState({ user: '', action: '', entity: '', from: '', to: '' });
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [error, setError] = useState(null);

    // Control de permisos por rol
    const userRole = sessionManager.getAuthData()?.role || 'usuario';
    const canViewAudit = userRole === 'admin';

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        fetchLogs();
        // eslint-disable-next-line
    }, [page, rowsPerPage]);

    const fetchUsers = async () => {
        try {
            setError(null);
            const users = await userAPI.getAll();
            setUsers(users);
        } catch (e) {
            console.error('❌ Error al cargar usuarios:', e);
            setError(`Error al cargar usuarios: ${e.message}`);
            setUsers([]);
        }
    };

    const fetchLogs = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = sessionManager.getAuthData()?.token;
            const params = {
                ...filters,
                page: page + 1,
                limit: rowsPerPage
            };
            const res = await apiService.get('/audit', {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            setLogs(res.logs || []);
            setTotal(res.total || 0);
        } catch (err) {
            console.error('❌ Error al cargar auditoría:', err);
            setLogs([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        setPage(0);
        fetchLogs();
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    if (!canViewAudit) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    <AlertTitle>Acceso Denegado</AlertTitle>
                    Solo los administradores pueden acceder al historial de auditoría.
                </Alert>
            </Box>
        );
    }

    return (
        <Box p={3}>
            {/* Mostrar errores */}
            {error && (
                <Paper sx={{ p: 3, mb: 2, backgroundColor: '#fff3cd', border: '1px solid #ffeaa7' }}>
                    <Typography variant="h6" color="error" gutterBottom>
                        Error
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        {error}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Si el problema persiste, intenta recargar la página o iniciar sesión nuevamente.
                    </Typography>
                </Paper>
            )}

            {/* Verificación de permisos */}
            {canViewAudit && (
                <>
                    <Typography variant="h4" fontWeight="bold" mb={2}>
                        Historial de Auditoría
                    </Typography>
                    <Paper sx={{ p: 2, mb: 2 }}>
                        <form onSubmit={handleFilterSubmit}>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} sm={3}>
                                    <TextField
                                        select
                                        label="Usuario"
                                        name="user"
                                        value={filters.user}
                                        onChange={handleFilterChange}
                                        fullWidth
                                        size="small"
                                    >
                                        <MenuItem value="">Todos</MenuItem>
                                        {users.map((u) => (
                                            <MenuItem key={u._id} value={u._id}>{u.name} ({u.email})</MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={2}>
                                    <TextField
                                        select
                                        label="Acción"
                                        name="action"
                                        value={filters.action}
                                        onChange={handleFilterChange}
                                        fullWidth
                                        size="small"
                                    >
                                        <MenuItem value="">Todas</MenuItem>
                                        {actions.map((a) => (
                                            <MenuItem key={a} value={a}>{a}</MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={2}>
                                    <TextField
                                        select
                                        label="Entidad"
                                        name="entity"
                                        value={filters.entity}
                                        onChange={handleFilterChange}
                                        fullWidth
                                        size="small"
                                    >
                                        <MenuItem value="">Todas</MenuItem>
                                        {entities.map((e) => (
                                            <MenuItem key={e} value={e}>{e}</MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid item xs={6} sm={2}>
                                    <TextField
                                        label="Desde"
                                        name="from"
                                        type="date"
                                        value={filters.from}
                                        onChange={handleFilterChange}
                                        fullWidth
                                        size="small"
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item xs={6} sm={2}>
                                    <TextField
                                        label="Hasta"
                                        name="to"
                                        type="date"
                                        value={filters.to}
                                        onChange={handleFilterChange}
                                        fullWidth
                                        size="small"
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={1}>
                                    <Button type="submit" variant="contained" color="primary" fullWidth>
                                        Filtrar
                                    </Button>
                                </Grid>
                            </Grid>
                        </form>
                    </Paper>
                    <Paper>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Fecha</TableCell>
                                        <TableCell>Usuario</TableCell>
                                        <TableCell>Acción</TableCell>
                                        <TableCell>Entidad</TableCell>
                                        <TableCell>Detalles</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center">
                                                <CircularProgress size={28} />
                                            </TableCell>
                                        </TableRow>
                                    ) : logs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center">
                                                No hay registros de auditoría.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        logs.map((log) => (
                                            <TableRow key={log._id}>
                                                <TableCell>{new Date(log.timestamp).toLocaleString('es-ES')}</TableCell>
                                                <TableCell>
                                                    {log.user ? (
                                                        <>
                                                            <Chip label={log.user.name} size="small" color="info" />
                                                            <Typography variant="caption" color="text.secondary" display="block">{log.user.email}</Typography>
                                                        </>
                                                    ) : '—'}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={log.action} size="small" color="primary" />
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={log.entity} size="small" color="secondary" />
                                                </TableCell>
                                                <TableCell>
                                                    <pre style={{ margin: 0, fontSize: 12, background: '#f5f5f5', borderRadius: 4, padding: 6, maxWidth: 320, overflowX: 'auto' }}>{JSON.stringify(log.changes, null, 2)}</pre>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            component="div"
                            count={total}
                            page={page}
                            onPageChange={(e, newPage) => setPage(newPage)}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                            rowsPerPageOptions={[5, 10, 20, 50]}
                        />
                    </Paper>
                </>
            )}
        </Box>
    );
};

export default AuditLog; 