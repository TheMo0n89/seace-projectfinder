/**
 * Modelo de ChatMessage - Mensajes individuales de chat
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const ChatMessage = sequelize.define('ChatMessage', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: () => uuidv4()
  },
  session_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'chat_sessions',
      key: 'id'
    },
    onDelete: 'CASCADE'
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
  tableName: 'chat_messages',
  timestamps: false,
  indexes: [
    {
      name: 'idx_chat_messages_session_id',
      fields: ['session_id']
    },
    {
      name: 'idx_chat_messages_created_at',
      fields: [['created_at', 'DESC']]
    }
  ]
});

module.exports = ChatMessage;
