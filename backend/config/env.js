require('dotenv').config();

const config = {
    // Servidor
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || 5000,

    // Base de datos
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/incident-management',

    // JWT
    JWT_SECRET: process.env.JWT_SECRET || 'default_jwt_secret_change_in_production',
    JWT_EXPIRE: process.env.JWT_EXPIRE || '24h',

    // CORS
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,

    // File Upload
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
    UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',

    // Logging
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    LOG_FILE_PATH: process.env.LOG_FILE_PATH || './logs',

    // Security
    BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    SESSION_SECRET: process.env.SESSION_SECRET || 'default_session_secret_change_in_production',

    // Email
    SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    SMTP_PORT: parseInt(process.env.SMTP_PORT) || 587,
    SMTP_USER: process.env.SMTP_USER || '',
    SMTP_PASS: process.env.SMTP_PASS || '',

    // Redis
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

    // Monitoring
    ENABLE_MONITORING: process.env.ENABLE_MONITORING === 'true',
    METRICS_PORT: parseInt(process.env.METRICS_PORT) || 9090
};

// Validar configuración crítica
const validateConfig = () => {
    const required = ['JWT_SECRET', 'MONGODB_URI'];
    const missing = required.filter(key => !config[key]);

    if (missing.length > 0) {
        console.error('❌ Variables de entorno faltantes:', missing);
        process.exit(1);
    }

    if (config.NODE_ENV === 'production' && config.JWT_SECRET === 'default_jwt_secret_change_in_production') {
        console.error('❌ JWT_SECRET debe ser cambiado en producción');
        process.exit(1);
    }

    console.log('✅ Configuración validada correctamente');
};

module.exports = { config, validateConfig }; 