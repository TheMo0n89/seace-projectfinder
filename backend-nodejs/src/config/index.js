/**
 * Configuración principal para la aplicación
 */
require('dotenv').config();

// Importamos logger aquí para evitar dependencias circulares
const logger = require('./logger');

const config = {
  // Servidor
  server: {
    port: process.env.PORT || 8000
  },
  env: process.env.NODE_ENV || 'development',
  
  // Base de datos
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    dialect: 'postgres',
    logging: process.env.NODE_ENV !== 'production',
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  
  // Logging
  logger: {
    level: process.env.LOG_LEVEL || 'info'
  },
  
  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
  },
  
  // Scraping
  scraper: {
    executablePath: process.env.CHROME_EXECUTABLE_PATH,
    headless: process.env.HEADLESS_MODE === 'true',
    timeout: parseInt(process.env.SCRAPE_TIMEOUT || '60000')
  },
  
  // API
  api: {
    prefix: process.env.API_PREFIX || '/api/v1',
    title: 'SEACE ProjectFinder API',
    description: 'API para transformar procesos públicos SEACE en oportunidades de software',
    version: '1.0.0'
  }
};

module.exports = config;