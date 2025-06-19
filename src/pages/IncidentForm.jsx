import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
    Box,
    Alert,
    Stack,
    Divider,
    useTheme
} from '@mui/material';
import { AttachFile as AttachFileIcon } from '@mui/icons-material';
import axios from 'axios';
import { useNotification } from '../utils/notification';

const prioridades = ['Baja', 'Media', 'Alta', 'Crítica'];

const IncidentForm = ({ id: propId, onClose, isModal }) => {
    const theme = useTheme();
    const params = useParams();
    const id = propId || params.id;
    const navigate = useNavigate();
    const [form, setForm] = useState({
        asunto: '',
        descripcion: '',
        prioridad: 'Media',
        categoria: '',
        adjunto: null
    });
    const [categorias, setCategorias] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const notify = useNotification();

    const fetchCategorias = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/categories', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCategorias(res.data);
        } catch (err) {
            setCategorias([]);
        }
    };

    const fetchIncidencia = async () => {
        if (!id) return;
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`/api/incidents/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setForm({
                asunto: res.data.subject,
                descripcion: res.data.description,
                prioridad: res.data.priority,
                categoria: res.data.category,
                adjunto: null
            });
        } catch (err) {
            setError('No se pudo cargar la incidencia');
        }
    };

    useEffect(() => {
        fetchCategorias();
        fetchIncidencia();
    }, [id]);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'adjunto') {
            setForm({ ...form, adjunto: files[0] });
        } else {
            setForm({ ...form, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('subject', form.asunto);
            formData.append('description', form.descripcion);
            formData.append('category', form.categoria);
            formData.append('priority', form.prioridad);
            formData.append('status', 'pendiente'); // Estado por defecto
            if (form.adjunto) formData.append('attachment', form.adjunto);

            let res;
            if (id) {
                res = await axios.patch(`/api/incidents/${id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSuccess('Incidencia actualizada');
                notify('Incidencia actualizada', 'success');
            } else {
                res = await axios.post('/api/incidents', formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSuccess('Incidencia creada');
                notify('Incidencia creada', 'success');
            }
            if (isModal && onClose) {
                setTimeout(() => onClose(), 800);
            } else {
                setTimeout(() => navigate('/incidencias'), 1000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error al guardar la incidencia');
            notify(err.response?.data?.message || 'Error al guardar la incidencia', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper
                elevation={3}
                sx={{
                    p: 4,
                    borderRadius: 2,
                    background: `linear-gradient(to right bottom, ${theme.palette.background.paper}, ${theme.palette.background.default})`
                }}
            >
                <Typography
                    variant="h4"
                    gutterBottom
                    sx={{
                        color: theme.palette.primary.main,
                        fontWeight: 600,
                        mb: 3
                    }}
                >
                    {id ? 'Editar Incidencia' : 'Nueva Incidencia'}
                </Typography>

                <Divider sx={{ mb: 4 }} />

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

                <Box component="form" onSubmit={handleSubmit} encType="multipart/form-data">
                    <Stack spacing={3}>
                        <TextField
                            label="Asunto"
                            name="asunto"
                            value={form.asunto}
                            onChange={handleChange}
                            fullWidth
                            required
                            variant="outlined"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '&:hover fieldset': {
                                        borderColor: theme.palette.primary.main,
                                    }
                                }
                            }}
                        />

                        <TextField
                            label="Descripción"
                            name="descripcion"
                            value={form.descripcion}
                            onChange={handleChange}
                            fullWidth
                            required
                            multiline
                            minRows={4}
                            variant="outlined"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '&:hover fieldset': {
                                        borderColor: theme.palette.primary.main,
                                    }
                                }
                            }}
                        />

                        <FormControl fullWidth>
                            <InputLabel>Prioridad</InputLabel>
                            <Select
                                name="prioridad"
                                value={form.prioridad}
                                label="Prioridad"
                                onChange={handleChange}
                                required
                            >
                                {prioridades.map(p => (
                                    <MenuItem key={p} value={p}>{p}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Categoría</InputLabel>
                            <Select
                                name="categoria"
                                value={form.categoria}
                                label="Categoría"
                                onChange={handleChange}
                                required
                            >
                                {categorias.map(c => (
                                    <MenuItem key={c._id} value={c.name}>{c.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Button
                            variant="outlined"
                            component="label"
                            startIcon={<AttachFileIcon />}
                            sx={{
                                mt: 2,
                                borderColor: theme.palette.primary.main,
                                color: theme.palette.primary.main,
                                '&:hover': {
                                    borderColor: theme.palette.primary.dark,
                                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                }
                            }}
                        >
                            {form.adjunto ? form.adjunto.name : 'Adjuntar archivo'}
                            <input
                                type="file"
                                name="adjunto"
                                hidden
                                onChange={handleChange}
                            />
                        </Button>

                        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                            <Button
                                type="button"
                                variant="outlined"
                                onClick={() => navigate('/incidencias')}
                                sx={{
                                    flex: 1,
                                    py: 1.5,
                                    borderColor: theme.palette.grey[300],
                                    color: theme.palette.text.primary,
                                    '&:hover': {
                                        borderColor: theme.palette.grey[400],
                                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                    }
                                }}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={loading}
                                sx={{
                                    flex: 2,
                                    py: 1.5,
                                    backgroundColor: theme.palette.primary.main,
                                    '&:hover': {
                                        backgroundColor: theme.palette.primary.dark
                                    }
                                }}
                            >
                                {loading ? 'Guardando...' : id ? 'Actualizar Incidencia' : 'Crear Incidencia'}
                            </Button>
                        </Box>
                    </Stack>
                </Box>
            </Paper>
        </Container>
    );
};

export default IncidentForm; 