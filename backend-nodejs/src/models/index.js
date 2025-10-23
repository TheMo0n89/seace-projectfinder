/**
 * Archivo de exportación de todos los modelos
 * Las relaciones se definen aquí para evitar referencias circulares
 */

const { sequelize } = require('../config/database');

// Importar modelos base (sin relaciones definidas)
const User = require('./User');
const Proceso = require('./Proceso');
const Anexo = require('./Anexo');
const ProcesoEmbedding = require('./ProcesoEmbedding');
const ScrapingTask = require('./ScrapingTask');
const ChatbotLog = require('./ChatbotLog');
const Configuracion = require('./Configuracion');
const ETLLog = require('./ETLLog');

// Importar modelos con definiciones básicas
const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

// Definir Recomendacion aquí
const Recomendacion = sequelize.define('Recomendacion', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: () => uuidv4()
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  proceso_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  score: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  visible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'recomendaciones',
  timestamps: false
});

// Los modelos Preferencia y UserInteraction ya están definidos en sus archivos
// Los importamos desde los archivos originales
const Preferencia = require('./Preferencia');
const UserInteraction = require('./UserInteraction');

// Definir relaciones centralizadas para evitar dependencias circulares
// User relationships
User.hasMany(Recomendacion, { foreignKey: 'user_id', as: 'recomendaciones' });
User.hasOne(Preferencia, { foreignKey: 'user_id', as: 'preferencia' });
User.hasMany(UserInteraction, { foreignKey: 'user_id', as: 'interacciones' });

// Proceso relationships
Proceso.hasMany(Anexo, { foreignKey: 'proceso_id', as: 'anexos' });
Proceso.hasOne(ProcesoEmbedding, { foreignKey: 'proceso_id', as: 'embedding' });
Proceso.hasMany(Recomendacion, { foreignKey: 'proceso_id', as: 'recomendaciones' });
Proceso.hasMany(UserInteraction, { foreignKey: 'proceso_id', as: 'interacciones' });

// Reverse relationships
Recomendacion.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Recomendacion.belongsTo(Proceso, { foreignKey: 'proceso_id', as: 'proceso' });

Preferencia.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

UserInteraction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
UserInteraction.belongsTo(Proceso, { foreignKey: 'proceso_id', as: 'proceso' });

Anexo.belongsTo(Proceso, { foreignKey: 'proceso_id', as: 'proceso' });
ProcesoEmbedding.belongsTo(Proceso, { foreignKey: 'proceso_id', as: 'proceso' });

// Exportar todos los modelos
module.exports = {
  User,
  Proceso,
  Anexo,
  ProcesoEmbedding,
  Recomendacion,
  Preferencia,
  UserInteraction,
  ScrapingTask,
  ChatbotLog,
  Configuracion,
  ETLLog,
  sequelize
};