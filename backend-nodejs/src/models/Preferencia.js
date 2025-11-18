/**
 * Modelo de Preferencia
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const User = require('./User');

const Preferencia = sequelize.define('Preferencia', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: () => uuidv4()
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: User,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  // Campos del perfil simplificado
  carrera: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  regiones_interes: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: []
  },
  monto_min: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  monto_max: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  tipos_proyecto: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: []
  },
  notification_frequency: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'semanal'
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
  tableName: 'preferencias',
  timestamps: false,
  indexes: [
    {
      name: 'idx_preferencia_user',
      fields: ['user_id'],
      unique: true
    }
  ]
});

// Las relaciones se definen en models/index.js para evitar dependencias circulares

module.exports = Preferencia;