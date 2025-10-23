/**
 * Modelo de Anexo
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const Proceso = require('./Proceso');

const Anexo = sequelize.define('Anexo', {
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
  nombre_archivo: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  url_descarga: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tipo_documento: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  tamaño_kb: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  fecha_subida: {
    type: DataTypes.DATE,
    allowNull: true
  },
  procesado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  contenido_extraido: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'anexos',
  timestamps: false,
  indexes: [
    {
      name: 'idx_anexo_proceso',
      fields: ['proceso_id']
    }
  ]
});

// Las relaciones se definen en models/index.js para evitar dependencias circulares

module.exports = Anexo;