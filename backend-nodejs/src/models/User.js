/**
 * Modelo de Usuario
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  hashed_password: {
    type: DataTypes.STRING(128),
    allowNull: false
  },
  full_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  role: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'guest'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  profile_completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  last_recommendations_generated_at: {
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
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: false
});

// Método para validar la contraseña
User.prototype.validPassword = async function(password) {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(password, this.hashed_password);
};

// Método para crear un objeto JSON sin la contraseña
User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.hashed_password;
  return values;
};

module.exports = User;