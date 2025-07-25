const winston = require('winston');
const path = require('path');

// Configuración del logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'incident-management' },
    transports: [
        // Logs de error
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // Logs combinados
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
    ],
});

// Si no estamos en producción, también log a la consola
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// Función helper para logs de auditoría
logger.audit = (message, meta = {}) => {
    logger.info(message, { ...meta, type: 'audit' });
};

// Función helper para logs de seguridad
logger.security = (message, meta = {}) => {
    logger.warn(message, { ...meta, type: 'security' });
};

module.exports = logger; 