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
    references: {
      model: User,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  keywords: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: []
  },
  embedding: {
    type: DataTypes.ARRAY(DataTypes.FLOAT),
    allowNull: true
  },
  profile_data: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
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