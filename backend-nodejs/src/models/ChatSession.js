/**
 * Modelo de ChatSession - Sesiones de chat del usuario
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const ChatSession = sequelize.define('ChatSession', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: () => uuidv4()
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  title: {
    type: DataTypes.STRING(255),
    defaultValue: 'Nuevo Chat'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'chat_sessions',
  timestamps: false,
  indexes: [
    {
      name: 'idx_chat_sessions_user_id',
      fields: ['user_id']
    },
    {
      name: 'idx_chat_sessions_active',
      fields: ['is_active']
    }
  ]
});

module.exports = ChatSession;
