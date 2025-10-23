/**
 * Configuración de base de datos
 */
const { Sequelize } = require('sequelize');
const config = require('./index');
const logger = require('./logger');

const sequelize = new Sequelize(
  config.database.name,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    logging: config.database.logging ? (msg) => logger.debug(msg) : false,
    dialectOptions: config.database.dialectOptions,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Función para probar la conexión a la base de datos
async function testConnection() {
  try {
    await sequelize.authenticate();
    logger.info('Conexión a la base de datos establecida correctamente.');
    return true;
  } catch (error) {
    logger.error('Error al conectar con la base de datos:', error);
    return false;
  }
}

module.exports = {
  sequelize,
  testConnection
};