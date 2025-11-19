/**
 * Modelo de Proceso
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const Proceso = sequelize.define('Proceso', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: () => uuidv4()
  },
  id_proceso: {
    type: DataTypes.STRING(255),
    unique: true,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  url_proceso: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  numero_convocatoria: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  entidad_nombre: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  entidad_ruc: {
    type: DataTypes.STRING(11),
    allowNull: true
  },
  objeto_contratacion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  descripcion_objeto: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  nomenclatura: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  nombre_entidad: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  reiniciado_desde: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  codigo_snip: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  codigo_cui: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  version_seace: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: '3'
  },
  source_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  pagina_scraping: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fecha_scraping: {
    type: DataTypes.DATE,
    allowNull: true
  },
  tipo_proceso: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  estado_proceso: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  fecha_publicacion: {
    type: DataTypes.DATE,
    allowNull: true
  },
  fecha_limite_presentacion: {
    type: DataTypes.DATE,
    allowNull: true
  },
  monto_referencial: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  moneda: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  rubro: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  departamento: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  provincia: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  distrito: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  requiere_visita_previa: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  datos_ocds: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  fecha_extraccion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  fecha_actualizacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: true
  },
  procesado_nlp: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  complejidad_estimada: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  categoria_proyecto: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'procesos',
  timestamps: false,  // Desabilitar porque la BD no tiene created_at/updated_at, usa fecha_actualizacion en trigger
  indexes: [
    {
      name: 'idx_proceso_id_proceso',
      fields: ['id_proceso']
    },
    {
      name: 'idx_proceso_estado',
      fields: ['estado_proceso']
    },
    {
      name: 'idx_proceso_fecha',
      fields: ['fecha_publicacion']
    },
    {
      name: 'idx_proceso_monto',
      fields: ['monto_referencial']
    },
    {
      name: 'idx_proceso_rubro',
      fields: ['rubro']
    }
  ]
});

module.exports = Proceso;