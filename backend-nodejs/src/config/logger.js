/**
 * Configuración del sistema de logs
 */
const winston = require('winston');
require('dotenv').config();

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const requestId = meta.requestId ? ` [${meta.requestId}]` : '';
    const metaData = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp}${requestId} [${level.toUpperCase()}]: ${message}${metaData}`;
  })
);

// Crear instancia de logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'seace-api' },
  transports: [
    // Escribir logs a consola
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),
    // Escribir logs a archivos
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Si estamos en producción, también guardar logs en un servicio como Loggly o similar
// if (process.env.NODE_ENV === 'production') {
//   logger.add(new winston.transports.Loggly({...}));
// }

module.exports = logger;