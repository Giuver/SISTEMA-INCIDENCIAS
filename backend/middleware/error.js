const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    // Errores de validación de Mongoose
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({
            message: 'Error de validación',
            errors: messages
        });
    }

    // Errores de duplicación de MongoDB
    if (err.code === 11000) {
        return res.status(400).json({
            message: 'El registro ya existe',
            field: Object.keys(err.keyPattern)[0]
        });
    }

    // Errores de JWT
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            message: 'Token inválido'
        });
    }

    // Errores de expiración de JWT
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            message: 'Token expirado'
        });
    }

    // Error por defecto
    res.status(err.status || 500).json({
        message: err.message || 'Error interno del servidor'
    });
};

module.exports = errorHandler; 