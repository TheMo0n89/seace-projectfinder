/**
 * Modelo de UserInteraction
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const User = require('./User');
const Proceso = require('./Proceso');

const UserInteraction = sequelize.define('UserInteraction', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: () => uuidv4()
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  proceso_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Proceso,
      key: 'id'
    }
  },
  tipo_interaccion: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  valor: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  metadatos: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'user_interactions',
  timestamps: false,
  indexes: [
    {
      name: 'idx_interaction_user',
      fields: ['user_id']
    },
    {
      name: 'idx_interaction_proceso',
      fields: ['proceso_id']
    },
    {
      name: 'idx_interaction_tipo',
      fields: ['tipo_interaccion']
    }
  ]
});

// Las relaciones se definen en models/index.js para evitar dependencias circulares

module.exports = UserInteraction;