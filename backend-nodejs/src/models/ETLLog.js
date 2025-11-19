/**
 * Modelo de ETLLog
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const ETLLog = sequelize.define('ETLLog', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: () => uuidv4()
  },
  operation_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  operation_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'running'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  details: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  process_count: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  error_count: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  inserted_count: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  updated_count: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  duration_ms: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  search_params: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  max_processes: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  paso_actual: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  paso_total: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  porcentaje: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  mensaje_actual: {
    type: DataTypes.TEXT,
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
  tableName: 'etl_logs',
  timestamps: false,
  indexes: [
    {
      name: 'idx_etl_operation_type',
      fields: ['operation_type']
    },
    {
      name: 'idx_etl_operation_id',
      fields: ['operation_id']
    }
  ]
});

module.exports = ETLLog;