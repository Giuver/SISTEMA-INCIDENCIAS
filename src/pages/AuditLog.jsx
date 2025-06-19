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
    CircularProgress
} from '@mui/material';
import axios from 'axios';

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
    const [audits, setAudits] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [filters, setFilters] = useState({ user: '', action: '', entity: '', from: '', to: '' });
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        fetchAudits();
        // eslint-disable-next-line
    }, [page, rowsPerPage]);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data);
        } catch (e) {
            setUsers([]);
        }
    };

    const fetchAudits = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = {
                ...filters,
                page: page + 1,
                limit: rowsPerPage
            };
            const res = await axios.get('/api/audit', {
                params,
                headers: { Authorization: `Bearer ${token}` }
            });
            setAudits(res.data.audits);
            setTotal(res.data.total);
        } catch (e) {
            setAudits([]);
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
        fetchAudits();
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <Box p={3}>
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
                            ) : audits.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        No hay registros de auditoría.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                audits.map((a) => (
                                    <TableRow key={a._id}>
                                        <TableCell>{new Date(a.timestamp).toLocaleString('es-ES')}</TableCell>
                                        <TableCell>
                                            {a.user ? (
                                                <>
                                                    <Chip label={a.user.name} size="small" color="info" />
                                                    <Typography variant="caption" color="text.secondary" display="block">{a.user.email}</Typography>
                                                </>
                                            ) : '—'}
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={a.action} size="small" color="primary" />
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={a.entity} size="small" color="secondary" />
                                        </TableCell>
                                        <TableCell>
                                            <pre style={{ margin: 0, fontSize: 12, background: '#f5f5f5', borderRadius: 4, padding: 6, maxWidth: 320, overflowX: 'auto' }}>{JSON.stringify(a.changes, null, 2)}</pre>
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
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[5, 10, 20, 50]}
                />
            </Paper>
        </Box>
    );
};

export default AuditLog; 