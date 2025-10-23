/**
 * Script para migrar los modelos a la base de datos
 */
const { sequelize } = require('../config/database');
const models = require('../models');

// Función para sincronizar los modelos con la base de datos
async function migrateModels() {
  try {
    console.log('✓ Migración de modelos omitida - Las tablas ya están creadas por scripts SQL.');
    console.log('  Las definiciones SQL en init.sql y migrate-recomendaciones.sql son la fuente de verdad.');
    console.log('  Los modelos Sequelize se usan solo para operaciones ORM, no para sincronización.');
    
    // Verificar que la conexión funciona
    await sequelize.authenticate();
    console.log('✓ Conexión a la base de datos verificada correctamente.');
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Error al verificar la conexión a la base de datos:', error.message);
    process.exit(1);
  }
}

// Ejecutar la migración
migrateModels();