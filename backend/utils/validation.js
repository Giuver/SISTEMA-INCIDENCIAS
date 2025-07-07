const Joi = require('joi');

// Esquemas de validación
const validationSchemas = {
    // Usuario
    user: {
        register: Joi.object({
            name: Joi.string().min(2).max(50).required().messages({
                'string.min': 'El nombre debe tener al menos 2 caracteres',
                'string.max': 'El nombre no puede exceder 50 caracteres',
                'any.required': 'El nombre es requerido'
            }),
            email: Joi.string().email().required().messages({
                'string.email': 'El email debe ser válido',
                'any.required': 'El email es requerido'
            }),
            password: Joi.string().min(6).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required().messages({
                'string.min': 'La contraseña debe tener al menos 6 caracteres',
                'string.pattern.base': 'La contraseña debe contener al menos una minúscula, una mayúscula y un número',
                'any.required': 'La contraseña es requerida'
            }),
            role: Joi.string().valid('admin', 'soporte', 'usuario').default('usuario')
        }),

        login: Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().required()
        }),

        update: Joi.object({
            name: Joi.string().min(2).max(50),
            email: Joi.string().email(),
            role: Joi.string().valid('admin', 'soporte', 'usuario'),
            isActive: Joi.boolean()
        })
    },

    // Incidencia
    incident: {
        create: Joi.object({
            subject: Joi.string().min(5).max(200).required().messages({
                'string.min': 'El asunto debe tener al menos 5 caracteres',
                'string.max': 'El asunto no puede exceder 200 caracteres',
                'any.required': 'El asunto es requerido'
            }),
            description: Joi.string().min(20).max(2000).required().messages({
                'string.min': 'La descripción debe tener al menos 20 caracteres',
                'string.max': 'La descripción no puede exceder 2000 caracteres',
                'any.required': 'La descripción es requerida'
            }),
            area: Joi.string().required(),
            priority: Joi.string().valid('Baja', 'Media', 'Alta', 'Crítica').default('Media'),
            attachment: Joi.any().optional()
        }),

        update: Joi.object({
            subject: Joi.string().min(5).max(200),
            description: Joi.string().min(20).max(2000),
            area: Joi.string(),
            priority: Joi.string().valid('Baja', 'Media', 'Alta', 'Crítica'),
            status: Joi.string().valid('pendiente', 'en_proceso', 'resuelto', 'cerrado'),
            assignedTo: Joi.string().hex().length(24).allow(null),
            solution: Joi.string().max(2000)
        }),

        statusUpdate: Joi.object({
            status: Joi.string().valid('pendiente', 'en_proceso', 'resuelto', 'cerrado').required(),
            solution: Joi.string().max(2000).when('status', {
                is: 'resuelto',
                then: Joi.required(),
                otherwise: Joi.optional()
            }),
            comment: Joi.string().max(500)
        })
    },

    // Área
    area: {
        create: Joi.object({
            name: Joi.string().min(2).max(50).required(),
            description: Joi.string().max(200),
            color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).default('#2196F3')
        }),

        update: Joi.object({
            name: Joi.string().min(2).max(50),
            description: Joi.string().max(200),
            color: Joi.string().pattern(/^#[0-9A-F]{6}$/i)
        })
    },

    // Filtros
    filters: {
        incidents: Joi.object({
            status: Joi.string().valid('pendiente', 'en_proceso', 'resuelto', 'cerrado'),
            priority: Joi.string().valid('Baja', 'Media', 'Alta', 'Crítica'),
            area: Joi.string(),
            assignedTo: Joi.string().hex().length(24),
            search: Joi.string().max(100),
            startDate: Joi.date().iso(),
            endDate: Joi.date().iso().min(Joi.ref('startDate')),
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(10)
        })
    }
};

// Middleware de validación
const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                message: 'Error de validación',
                errors,
                error: 'VALIDATION_ERROR'
            });
        }

        // Reemplazar datos con datos validados
        req[property] = value;
        next();
    };
};

// Sanitización de datos
const sanitize = {
    string: (value) => {
        if (typeof value !== 'string') return value;
        return value
            .trim()
            .replace(/[<>]/g, '') // Remover caracteres peligrosos
            .replace(/\s+/g, ' '); // Normalizar espacios
    },

    email: (value) => {
        if (typeof value !== 'string') return value;
        return value.toLowerCase().trim();
    },

    object: (obj) => {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                sanitized[key] = sanitize.string(value);
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = sanitize.object(value);
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
};

// Middleware de sanitización
const sanitizeData = (req, res, next) => {
    if (req.body) {
        req.body = sanitize.object(req.body);
    }
    if (req.query) {
        req.query = sanitize.object(req.query);
    }
    next();
};

module.exports = {
    validationSchemas,
    validate,
    sanitize,
    sanitizeData
}; 