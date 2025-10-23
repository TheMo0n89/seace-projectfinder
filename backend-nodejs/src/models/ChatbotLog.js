/**
 * Modelo de ChatbotLog
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const ChatbotLog = sequelize.define('ChatbotLog', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: () => uuidv4()
  },
  session_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  user_query: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ai_response: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  relevant_processes: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    allowNull: true,
    defaultValue: []
  },
  response_time_ms: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  model_used: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'chatbot_logs',
  timestamps: false
});

module.exports = ChatbotLog;