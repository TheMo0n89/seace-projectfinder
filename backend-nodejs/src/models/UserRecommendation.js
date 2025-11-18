/**
 * Modelo de Recomendación Personalizada de Usuario
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const UserRecommendation = sequelize.define('UserRecommendation', {
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
  proceso_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'procesos',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  score: {
    type: DataTypes.FLOAT,
    allowNull: false,
    comment: 'Score total de coincidencia (0-100)'
  },
  match_region: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    comment: 'Score parcial de coincidencia en región (40%)'
  },
  match_tipo_proyecto: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    comment: 'Score parcial de coincidencia en tipo de proyecto (40%)'
  },
  match_monto: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    comment: 'Score parcial de coincidencia en rango de monto (20% o 0% si no hay monto)'
  },
  match_carrera: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    comment: 'Score parcial de coincidencia en carrera (30% cuando no hay monto disponible)'
  },
  seen: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Si el usuario ya vio esta recomendación'
  },
  notified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Si el usuario ya fue notificado de esta recomendación'
  },
  notified_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha y hora de la notificación'
  },
  recommendation_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Tipo de recomendación: MVP, Sprint1, Stack'
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
  tableName: 'user_recommendations',
  timestamps: false,
  indexes: [
    {
      name: 'idx_user_recommendations_user',
      fields: ['user_id']
    },
    {
      name: 'idx_user_recommendations_proceso',
      fields: ['proceso_id']
    },
    {
      name: 'idx_user_recommendations_score',
      fields: ['score']
    },
    {
      name: 'idx_user_recommendations_seen',
      fields: ['seen']
    },
    {
      name: 'idx_user_recommendations_notified',
      fields: ['notified']
    },
    {
      unique: true,
      fields: ['user_id', 'proceso_id']
    }
  ]
});

module.exports = UserRecommendation;
