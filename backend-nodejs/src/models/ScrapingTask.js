/**
 * Modelo de ScrapingTask
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const User = require('./User');

const ScrapingTask = sequelize.define('ScrapingTask', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: () => uuidv4()
  },
  task_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pending'
  },
  params: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  result: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  error: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completed_at: {
    type: DataTypes.DATE,
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
  tableName: 'scraping_tasks',
  timestamps: false
});

// Las relaciones se definen en models/index.js para evitar dependencias circulares

module.exports = ScrapingTask;