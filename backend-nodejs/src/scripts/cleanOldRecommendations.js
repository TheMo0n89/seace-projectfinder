/**
 * Script para limpiar recomendaciones antiguas vistas
 * Elimina recomendaciones marcadas como vistas con más de 90 días de antigüedad
 * 
 * Uso:
 * node src/scripts/cleanOldRecommendations.js
 * 
 * Con docker-compose:
 * docker-compose exec backend-nodejs node src/scripts/cleanOldRecommendations.js
 */

const { UserRecommendation } = require('../models');
const logger = require('../config/logger');
const { Op } = require('sequelize');

async function main() {
  try {
    logger.info('=== INICIO DE LIMPIEZA DE RECOMENDACIONES ANTIGUAS ===');
    const startTime = Date.now();

    // Fecha límite: 90 días atrás
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    logger.info(`Eliminando recomendaciones vistas antes de: ${ninetyDaysAgo.toISOString()}`);

    // Eliminar recomendaciones antiguas vistas
    const result = await UserRecommendation.destroy({
      where: {
        seen: true,
        created_at: {
          [Op.lt]: ninetyDaysAgo
        }
      }
    });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    logger.info('=== RESUMEN DE LIMPIEZA ===');
    logger.info(`Recomendaciones eliminadas: ${result}`);
    logger.info(`Duración: ${duration}s`);
    logger.info('=== FIN DE LIMPIEZA DE RECOMENDACIONES ANTIGUAS ===');

    process.exit(0);

  } catch (error) {
    logger.error('Error fatal en script de limpieza:');
    logger.error(error.message);
    logger.error(error.stack);
    process.exit(1);
  }
}

// Ejecutar script
if (require.main === module) {
  main();
}

module.exports = { main };
