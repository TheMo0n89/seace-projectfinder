/**
 * Modelo de ProcesoEmbedding
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const Proceso = require('./Proceso');

const ProcesoEmbedding = sequelize.define('ProcesoEmbedding', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: () => uuidv4()
  },
  proceso_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Proceso,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  embedding_titulo: {
    type: DataTypes.ARRAY(DataTypes.FLOAT),
    allowNull: true
  },
  embedding_descripcion: {
    type: DataTypes.ARRAY(DataTypes.FLOAT),
    allowNull: true
  },
  embedding_combined: {
    type: DataTypes.ARRAY(DataTypes.FLOAT),
    allowNull: true
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
  tableName: 'proceso_embeddings',
  timestamps: false,
  indexes: [
    {
      name: 'idx_embedding_proceso',
      fields: ['proceso_id'],
      unique: true
    }
  ]
});

// Las relaciones se definen en models/index.js para evitar dependencias circulares

module.exports = ProcesoEmbedding;