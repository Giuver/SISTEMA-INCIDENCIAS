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
    useTheme,
    Autocomplete,
    Chip
} from '@mui/material';
import { AttachFile as AttachFileIcon } from '@mui/icons-material';
import axios from 'axios';
import { useNotification } from '../utils/notification';
import LoaderOverlay from '../components/LoaderOverlay';
import sessionManager from '../utils/sessionManager';

const prioridades = ['Baja', 'Media', 'Alta', 'Crítica'];

const IncidentForm = ({ id: propId, onClose, isModal }) => {
    const theme = useTheme();
    const params = useParams();
    const id = propId || params.id;
    const navigate = useNavigate();

    const authData = sessionManager.getAuthData();
    const token = authData?.token;
    const userRole = authData?.role || 'usuario';
    const userId = authData?.userId || '';

    // Control de permisos por rol
    // Solo admin y soporte pueden editar incidencias existentes
    const canManageIncidents = userRole === 'admin' || userRole === 'soporte';
    const isReadOnly = id && !canManageIncidents; // Solo lectura si es edición y no tiene permisos

    const [form, setForm] = useState({
        asunto: '',
        descripcion: '',
        prioridad: 'Media',
        categoria: '',
        adjunto: null,
        tags: []
    });
    const [categorias, setCategorias] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const notify = useNotification();
    const [touched, setTouched] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const [preview, setPreview] = useState(null);
    const [usuarios, setUsuarios] = useState([]);
    const [asignados, setAsignados] = useState([]);
    const [tagInput, setTagInput] = useState('');

    // Validación de campos
    const validate = (field, value) => {
        switch (field) {
            case 'asunto':
                if (!value || value.trim().length < 5) return 'El asunto debe tener al menos 5 caracteres';
                if (value.length > 200) return 'El asunto no puede exceder 200 caracteres';
                break;
            case 'descripcion':
                if (!value || value.trim().length < 20) return 'La descripción debe tener al menos 20 caracteres';
                if (value.length > 2000) return 'La descripción no puede exceder 2000 caracteres';
                break;
            case 'categoria':
                if (!value) return 'El área es requerida';
                break;
            case 'prioridad':
                if (!value) return 'La prioridad es requerida';
                break;
            default:
                break;
        }
        return '';
    };

    // Validación de archivos adjuntos
    const validateFile = (file) => {
        if (!file) return '';

        // Validar tipos de archivo permitidos
        const allowedTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'text/csv'
        ];

        // Validar extensiones permitidas
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv'];
        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

        // Validar tamaño (5MB máximo)
        const maxSize = 5 * 1024 * 1024; // 5MB

        // Validar nombre de archivo
        const dangerousChars = /[<>:"/\\|?*]/;

        if (!allowedTypes.includes(file.type)) {
            return `Tipo de archivo no permitido: ${file.type}. Tipos permitidos: ${allowedTypes.join(', ')}`;
        }

        if (!allowedExtensions.includes(fileExtension)) {
            return `Extensión de archivo no permitida: ${fileExtension}. Extensiones permitidas: ${allowedExtensions.join(', ')}`;
        }

        if (file.size > maxSize) {
            return 'El archivo es demasiado grande (máximo 5MB)';
        }

        if (dangerousChars.test(file.name)) {
            return 'El nombre del archivo contiene caracteres no permitidos';
        }

        if (file.name.length > 100) {
            return 'El nombre del archivo es demasiado largo (máximo 100 caracteres)';
        }

        return '';
    };

    const fetchAreas = async () => {
        try {
            const res = await axios.get('/api/areas', {
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
            const res = await axios.get(`/api/incidents/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setForm({
                asunto: res.data.subject,
                descripcion: res.data.description,
                prioridad: res.data.priority,
                categoria: res.data.area || '',
                adjunto: null,
                tags: res.data.tags || []
            });
            // Cargar usuarios asignados
            setAsignados(res.data.assignedTo || []);
        } catch (err) {
            setError('No se pudo cargar la incidencia');
        }
    };

    useEffect(() => {
        fetchAreas();
        fetchIncidencia();
        // Cargar usuarios solo si es admin o soporte
        if (userRole === 'admin' || userRole === 'soporte') {
            axios.get('/api/users', { headers: { Authorization: `Bearer ${token}` } })
                .then(res => setUsuarios(res.data))
                .catch(() => setUsuarios([]));
        } else {
            setUsuarios([]);
        }
    }, [id]);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'adjunto') {
            const file = files[0];

            // Validar archivo antes de procesarlo
            const fileError = validateFile(file);
            if (fileError) {
                notify(fileError, 'error');
                return;
            }

            setForm({ ...form, adjunto: file });
            setTouched({ ...touched, adjunto: true });
            setFieldErrors({ ...fieldErrors, adjunto: '' });

            if (file) {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onloadend = () => setPreview(reader.result);
                    reader.readAsDataURL(file);
                } else {
                    setPreview(null);
                }
            } else {
                setPreview(null);
            }
        } else if (name === 'tagInput') {
            setTagInput(value);
            return;
        }
        else {
            setForm({ ...form, [name]: value });
            setTouched({ ...touched, [name]: true });
            setFieldErrors({ ...fieldErrors, [name]: validate(name, value) });
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched({ ...touched, [name]: true });
        setFieldErrors({ ...fieldErrors, [name]: validate(name, value) });
    };

    const handleRemoveAttachment = () => {
        setForm({ ...form, adjunto: null });
        setPreview(null);
        setTouched({ ...touched, adjunto: false });
    };

    const handleAsignadosChange = (event, value) => {
        setAsignados(value);
    };

    const isFormValid = () => {
        const errors = {
            asunto: validate('asunto', form.asunto),
            descripcion: validate('descripcion', form.descripcion),
            categoria: validate('categoria', form.categoria),
            prioridad: validate('prioridad', form.prioridad)
        };
        setFieldErrors(errors);
        return Object.values(errors).every(e => !e);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        if (!isFormValid()) {
            setLoading(false);
            return;
        }
        try {
            const formData = new FormData();
            formData.append('subject', form.asunto);
            formData.append('description', form.descripcion);
            formData.append('area', form.categoria);
            formData.append('priority', form.prioridad);
            formData.append('status', 'pendiente'); // Estado por defecto
            if (form.adjunto) formData.append('attachment', form.adjunto);
            if (asignados.length > 0) {
                asignados.forEach(u => formData.append('assignedTo', u._id));
            }
            if (form.tags && form.tags.length > 0) {
                form.tags.forEach(t => formData.append('tags', t));
            }

            let res;
            if (id) {
                res = await axios.patch(`/api/incidents/${id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                notify('Incidencia actualizada correctamente', 'success');
            } else {
                res = await axios.post('/api/incidents', formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                notify('Incidencia creada correctamente', 'success');
            }
            if (isModal && onClose) {
                setTimeout(() => onClose(), 800);
            } else {
                setTimeout(() => navigate('/incidencias'), 1000);
            }
        } catch (err) {
            notify(err.response?.data?.message || 'Error al guardar la incidencia', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <LoaderOverlay open={loading} />
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

                {/* Eliminar Alert redundante, solo usar notificación tipo snackbar */}

                <Box component="form" onSubmit={handleSubmit} encType="multipart/form-data" role="form" aria-label={id ? 'Editar incidencia' : 'Nueva incidencia'}>
                    <Stack spacing={3}>
                        <TextField
                            label="Asunto"
                            name="asunto"
                            value={form.asunto}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            fullWidth
                            required
                            error={Boolean(touched.asunto && fieldErrors.asunto)}
                            helperText={touched.asunto && fieldErrors.asunto}
                            variant="outlined"
                            disabled={isReadOnly}
                            title={isReadOnly ?
                                'No tienes permisos para editar incidencias existentes. Solo puedes crear nuevas incidencias.' :
                                'Asunto de la incidencia'
                            }
                            inputProps={{ 'aria-label': 'Asunto de la incidencia' }}
                            sx={{
                                '& .Mui-disabled': {
                                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                    color: 'text.disabled'
                                }
                            }}
                        />

                        <TextField
                            label="Descripción"
                            name="descripcion"
                            value={form.descripcion}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            fullWidth
                            required
                            multiline
                            minRows={4}
                            error={Boolean(touched.descripcion && fieldErrors.descripcion)}
                            helperText={touched.descripcion && fieldErrors.descripcion}
                            variant="outlined"
                            disabled={isReadOnly}
                            inputProps={{ 'aria-label': 'Descripción de la incidencia' }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '&:hover fieldset': {
                                        borderColor: theme.palette.primary.main,
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: theme.palette.secondary.main,
                                        boxShadow: '0 0 0 2px #1976d2',
                                    }
                                }
                            }}
                        />

                        <FormControl fullWidth error={Boolean(touched.prioridad && fieldErrors.prioridad)}>
                            <InputLabel id="prioridad-label">Prioridad</InputLabel>
                            <Select
                                labelId="prioridad-label"
                                name="prioridad"
                                value={form.prioridad}
                                label="Prioridad"
                                onChange={handleChange}
                                onBlur={handleBlur}
                                disabled={isReadOnly}
                                inputProps={{ 'aria-label': 'Prioridad de la incidencia' }}
                            >
                                {prioridades.map(p => (
                                    <MenuItem key={p} value={p}>{p}</MenuItem>
                                ))}
                            </Select>
                            {touched.prioridad && fieldErrors.prioridad && (
                                <Typography color="error" variant="caption">{fieldErrors.prioridad}</Typography>
                            )}
                        </FormControl>

                        <FormControl fullWidth error={Boolean(touched.categoria && fieldErrors.categoria)}>
                            <InputLabel id="categoria-label">Área</InputLabel>
                            <Select
                                labelId="categoria-label"
                                name="categoria"
                                value={form.categoria}
                                label="Área"
                                onChange={handleChange}
                                onBlur={handleBlur}
                                disabled={isReadOnly}
                                inputProps={{ 'aria-label': 'Área de la incidencia' }}
                            >
                                {categorias.map(c => (
                                    <MenuItem key={c._id} value={c.name}>{c.name}</MenuItem>
                                ))}
                            </Select>
                            {touched.categoria && fieldErrors.categoria && (
                                <Typography color="error" variant="caption">{fieldErrors.categoria}</Typography>
                            )}
                        </FormControl>

                        {/* Adjuntos */}
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                                Archivo Adjunto
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                Tipos permitidos: JPG, PNG, GIF, PDF, DOC, DOCX, XLS, XLSX, TXT, CSV.
                                Tamaño máximo: 5MB. Solo un archivo por incidencia.
                            </Typography>
                            <Button
                                variant="outlined"
                                component="label"
                                startIcon={<AttachFileIcon />}
                                title={form.adjunto ? 'Cambiar archivo adjunto' : 'Adjuntar archivo'}
                                aria-label={form.adjunto ? 'Cambiar archivo adjunto' : 'Adjuntar archivo'}
                                tabIndex={0}
                                disabled={isReadOnly}
                                sx={{ '&:focus': { outline: '2px solid #1976d2' } }}
                            >
                                {form.adjunto ? 'Cambiar archivo' : 'Adjuntar archivo'}
                                <input
                                    type="file"
                                    name="adjunto"
                                    hidden
                                    onChange={handleChange}
                                    accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                                    disabled={isReadOnly}
                                />
                            </Button>
                            {form.adjunto && (
                                <Box mt={2} display="flex" alignItems="center" gap={2}>
                                    {preview && (
                                        <img src={preview} alt="Vista previa del archivo adjunto" style={{ maxWidth: 80, maxHeight: 80, borderRadius: 4, border: '1px solid #ccc' }} />
                                    )}
                                    {!preview && (
                                        <>
                                            {form.adjunto.type === 'application/pdf' ? (
                                                <span style={{ fontWeight: 'bold', color: '#d32f2f' }}>PDF</span>
                                            ) : (
                                                <span style={{ fontWeight: 'bold' }}>{form.adjunto.name}</span>
                                            )}
                                        </>
                                    )}
                                    <Button color="error" size="small" onClick={handleRemoveAttachment} disabled={isReadOnly} title="Eliminar archivo adjunto" aria-label="Eliminar archivo adjunto" tabIndex={0} sx={{ '&:focus': { outline: '2px solid #d32f2f' } }}>Eliminar</Button>
                                </Box>
                            )}
                        </Box>

                        {/* Asignar a */}
                        <Autocomplete
                            multiple
                            id="asignados"
                            options={usuarios}
                            getOptionLabel={option => option.name}
                            value={asignados}
                            onChange={handleAsignadosChange}
                            isOptionEqualToValue={(option, value) => option._id === value._id}
                            disabled={isReadOnly}
                            renderInput={params => (
                                <TextField {...params} label="Asignar a" placeholder="Seleccionar usuarios" variant="outlined" />
                            )}
                            sx={{ mb: 2 }}
                        />

                        {/* Etiquetas */}
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>Etiquetas (tags)</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                Escribe una palabra y presiona <b>Enter</b> o <b>coma</b> para añadir una etiqueta. Puedes agregar varias.
                            </Typography>
                            <TextField
                                label="Agregar etiqueta"
                                name="tagInput"
                                value={tagInput}
                                onChange={handleChange}
                                onKeyDown={e => {
                                    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                                        e.preventDefault();
                                        if (!form.tags) form.tags = [];
                                        if (!form.tags.includes(tagInput.trim())) {
                                            setForm({ ...form, tags: [...(form.tags || []), tagInput.trim()] });
                                        }
                                        setTagInput('');
                                    }
                                }}
                                variant="outlined"
                                size="small"
                                sx={{ mb: 1, width: 300 }}
                                placeholder="Presiona Enter o coma para añadir"
                            />
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                                {(form.tags || []).map((tag, idx) => (
                                    <Chip
                                        key={idx}
                                        label={tag}
                                        onDelete={() => setForm({ ...form, tags: form.tags.filter((t, i) => i !== idx) })}
                                        color="secondary"
                                        variant="filled"
                                    />
                                ))}
                            </Box>
                        </Box>

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
                                disabled={loading || isReadOnly}
                                title={isReadOnly ?
                                    'No tienes permisos para editar incidencias existentes' :
                                    'Guardar incidencia'
                                }
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