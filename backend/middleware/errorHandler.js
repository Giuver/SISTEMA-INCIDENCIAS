const { logger } = require('../utils/logger');

// Clases de errores personalizadas
class AppError extends Error {
    constructor(message, statusCode, errorCode = null) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message, errors = []) {
        super(message, 400, 'VALIDATION_ERROR');
        this.errors = errors;
    }
}

class AuthenticationError extends AppError {
    constructor(message = 'Error de autenticación') {
        super(message, 401, 'AUTHENTICATION_ERROR');
    }
}

class AuthorizationError extends AppError {
    constructor(message = 'Acceso denegado') {
        super(message, 403, 'AUTHORIZATION_ERROR');
    }
}

class NotFoundError extends AppError {
    constructor(resource = 'Recurso') {
        super(`${resource} no encontrado`, 404, 'NOT_FOUND');
    }
}

class DatabaseError extends AppError {
    constructor(message = 'Error de base de datos') {
        super(message, 500, 'DATABASE_ERROR');
    }
}

// Middleware de manejo de errores
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log del error
    logger.error('Error:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id || 'anonymous'
    });

    // Error de Mongoose - ID inválido
    if (err.name === 'CastError') {
        const message = 'ID de formato inválido';
        error = new ValidationError(message);
    }

    // Error de Mongoose - Validación
    if (err.name === 'ValidationError') {
        const message = 'Error de validación';
        const errors = Object.values(err.errors).map(val => ({
            field: val.path,
            message: val.message
        }));
        error = new ValidationError(message, errors);
    }

    // Error de Mongoose - Duplicado
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const message = `${field} ya existe`;
        error = new ValidationError(message);
    }

    // Error de JWT
    if (err.name === 'JsonWebTokenError') {
        error = new AuthenticationError('Token inválido');
    }

    if (err.name === 'TokenExpiredError') {
        error = new AuthenticationError('Token expirado');
    }

    // Error de archivo
    if (err.code === 'LIMIT_FILE_SIZE') {
        error = new ValidationError('El archivo es demasiado grande');
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        error = new ValidationError('Tipo de archivo no permitido');
    }

    // Error de rate limiting
    if (err.status === 429) {
        error = new AppError('Demasiadas solicitudes', 429, 'RATE_LIMIT_EXCEEDED');
    }

    // Respuesta de error
    const errorResponse = {
        success: false,
        message: error.message || 'Error interno del servidor',
        error: error.errorCode || 'INTERNAL_ERROR',
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            details: err
        })
    };

    // Agregar errores de validación si existen
    if (error.errors) {
        errorResponse.errors = error.errors;
    }

    // Status code
    const statusCode = error.statusCode || 500;

    // Envío de respuesta
    res.status(statusCode).json(errorResponse);
};

// Middleware para capturar errores asíncronos
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// Middleware para rutas no encontradas
const notFound = (req, res, next) => {
    const error = new NotFoundError('Ruta');
    next(error);
};

// Middleware para validar conexión a base de datos
const checkDatabaseConnection = (req, res, next) => {
    const mongoose = require('mongoose');

    if (mongoose.connection.readyState !== 1) {
        const error = new DatabaseError('Base de datos no disponible');
        return next(error);
    }

    next();
};

module.exports = {
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    DatabaseError,
    errorHandler,
    asyncHandler,
    notFound,
    checkDatabaseConnection
}; 