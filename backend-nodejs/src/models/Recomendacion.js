/**
 * Modelo de Recomendacion
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const User = require('./User');
const Proceso = require('./Proceso');

const Recomendacion = sequelize.define('Recomendacion', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: () => uuidv4()
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    }
  },
  proceso_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Proceso,
      key: 'id'
    }
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

// Las relaciones se definen en models/index.js para evitar dependencias circulares

module.exports = Recomendacion;