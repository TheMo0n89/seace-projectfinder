/**
 * Servicio de autenticación
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { Op } = require('sequelize');
const config = require('../config');

class AuthService {
  /**
   * Verificar contraseña
   */
  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Generar hash de contraseña
   */
  async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  /**
   * Crear token JWT
   */
  createAccessToken(data, expiresIn = null) {
    const payload = { ...data };
    const options = {
      expiresIn: expiresIn || config.jwt.expiresIn
    };
    
    return jwt.sign(payload, config.jwt.secret, options);
  }

  /**
   * Verificar token JWT
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      return null;
    }
  }

  /**
   * Autenticar usuario
   */
  async authenticateUser(username, password) {
    try {
      const user = await User.findOne({ where: { username } });
      
      if (!user) {
        return null;
      }

      const isValidPassword = await this.verifyPassword(password, user.hashed_password);
      
      if (!isValidPassword) {
        return null;
      }

      return user;
    } catch (error) {
      console.error('Error authenticating user:', error);
      return null;
    }
  }

  /**
   * Registrar nuevo usuario
   */
  async registerUser(userData) {
    try {
      // Verificar si el usuario ya existe
      const existingUsername = await User.findOne({
        where: { username: userData.username }
      });
      
      const existingEmail = await User.findOne({
        where: { email: userData.email }
      });

      if (existingUsername) {
        throw new Error('El nombre de usuario ya está registrado');
      }
      
      if (existingEmail) {
        throw new Error('El email ya está registrado');
      }

      // Crear usuario
      const hashedPassword = await this.hashPassword(userData.password);
      
      const user = await User.create({
        username: userData.username,
        email: userData.email,
        hashed_password: hashedPassword,
        full_name: userData.full_name || null,
        role: userData.role || 'guest',
        is_active: true
      });

      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener usuario por ID
   */
  async getUserById(userId) {
    try {
      const user = await User.findByPk(parseInt(userId));
      return user;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  /**
   * Actualizar usuario
   */
  async updateUser(userId, updateData) {
    try {
      const user = await User.findByPk(parseInt(userId));
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Campos permitidos para actualizar
      const allowedFields = ['email', 'full_name'];
      const updateFields = {};

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          updateFields[field] = updateData[field];
        }
      }

      // Verificar si el email ya existe (si se está actualizando)
      if (updateFields.email) {
        const existingUsers = await User.findAll({
          where: { email: updateFields.email }
        });
        
        const existingUser = existingUsers.find(u => u.id !== parseInt(userId));
        
        if (existingUser) {
          throw new Error('El email ya está en uso por otro usuario');
        }
      }

      updateFields.updated_at = new Date();

      await user.update(updateFields);
      await user.reload();

      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findByPk(parseInt(userId));
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Verificar contraseña actual
      const isValidPassword = await this.verifyPassword(currentPassword, user.hashed_password);
      
      if (!isValidPassword) {
        throw new Error('Contraseña actual incorrecta');
      }

      // Actualizar contraseña
      const hashedPassword = await this.hashPassword(newPassword);
      await user.update({
        hashed_password: hashedPassword,
        updated_at: new Date()
      });

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verificar permisos
   */
  checkPermission(user, permission) {
    // Los administradores tienen todos los permisos
    if (user.role === 'admin') {
      return true;
    }

    // Permisos para invitados
    if (user.role === 'guest') {
      const basicPermissions = ['view_processes', 'use_chatbot'];
      return basicPermissions.includes(permission);
    }

    return false;
  }

  /**
   * Actualizar último login
   */
  async updateLastLogin(userId) {
    try {
      // Validar que userId esté presente (UUID string o cualquier ID)
      if (!userId) {
        console.warn('updateLastLogin: userId inválido', { userId });
        return;
      }
      
      // Buscar usuario directamente con el ID (UUID)
      const user = await User.findByPk(userId);
      if (user) {
        await user.update({ last_login: new Date() });
      }
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }
}

module.exports = new AuthService();