const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        // Escribir todos los logs con nivel 'error' y menores a 'error.log'
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/error.log'),
            level: 'error',
        }),
        // Escribir todos los logs con nivel 'info' y menores a 'combined.log'
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/combined.log'),
        }),
    ],
});

// Si no estamos en producción, también mostramos los logs en la consola
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        ),
    }));
}

// Función para registrar eventos del sistema
const logSystemEvent = (event, details) => {
    logger.info({
        event,
        details,
        timestamp: new Date().toISOString(),
    });
};

// Función para registrar errores
const logError = (error, context) => {
    logger.error({
        error: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
    });
};

// Función para registrar acciones de usuario
const logUserAction = (userId, action, details) => {
    logger.info({
        type: 'user_action',
        userId,
        action,
        details,
        timestamp: new Date().toISOString(),
    });
};

module.exports = {
    logger,
    logSystemEvent,
    logError,
    logUserAction,
}; 