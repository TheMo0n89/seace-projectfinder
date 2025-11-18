/**
 * Modelo para Analytics de clicks en recomendaciones
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RecommendationClick = sequelize.define('RecommendationClick', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
  recommendation_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'user_recommendations',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  proceso_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'procesos',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  clicked_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  session_id: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  referrer: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'recommendation_clicks',
  timestamps: false,
  indexes: [
    {
      fields: ['user_id', 'clicked_at']
    },
    {
      fields: ['recommendation_id']
    },
    {
      fields: ['proceso_id']
    }
  ]
});

module.exports = RecommendationClick;
