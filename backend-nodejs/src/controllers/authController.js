/**
 * Controlador de autenticación
 */
const authService = require('../services/authService');
const interactionService = require('../services/interactionService');
const { User } = require('../models');
const logger = require('../config/logger');

class AuthController {
  /**
   * Registrar nuevo usuario
   */
  async register(req, res, next) {
    try {
      console.log('=== AUTH CONTROLLER REGISTER START ===');
      console.log('req.body:', req.body);
      console.log('req.body type:', typeof req.body);
      
      const { username, email, password, full_name } = req.body;
      console.log('Datos recibidos en register:', { username, email, password: '[HIDDEN]', full_name });

      // Validar datos requeridos
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username, email y password son requeridos'
        });
      }

      // Validar longitud de contraseña
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 6 caracteres'
        });
      }

      console.log('Llamando a authService.registerUser con:', { username, email, password: '[HIDDEN]', full_name });
      // Registrar usuario
      const user = await authService.registerUser({
        username,
        email,
        password,
        full_name
      });

      logger.info(`👤 Usuario creado: ${user.username} (${user.email})`);

      res.status(201).json({
        success: true,
        data: user.toJSON()
      });
    } catch (error) {
      console.error('Error completo en register:', error);
      logger.error(`Error en registro: ${error.message}`);
      
      if (error.message.includes('ya está registrado')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Iniciar sesión
   */
  async login(req, res, next) {
    try {
      const { username, password } = req.body;

      // Validar datos requeridos
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username y password son requeridos'
        });
      }

      // Autenticar usuario
      const user = await authService.authenticateUser(username, password);

      if (!user) {
        logger.warn(`❌ Intento de login fallido para usuario: ${username}`);
        return res.status(401).json({
          success: false,
          message: 'Credenciales incorrectas'
        });
      }

      if (!user.is_active) {
        logger.warn(`❌ Intento de login con usuario inactivo: ${username}`);
        return res.status(401).json({
          success: false,
          message: 'Usuario inactivo'
        });
      }

      // Crear token de acceso
      const accessToken = authService.createAccessToken({
        sub: user.username,
        user_id: user.id,
        role: user.role
      });

      // Actualizar último login en segundo plano
      authService.updateLastLogin(user.id).catch(err => {
        logger.error(`Error actualizando último login: ${err.message}`);
      });

      // Registrar interacción de login
      interactionService.registrarLogin(user.id).catch(err => {
        logger.error(`Error registrando interacción de login: ${err.message}`);
      });

      logger.info(`🔑 Usuario '${user.username}' (${user.role}) ha iniciado sesión`);

      // Calcular tiempo de expiración en segundos
      const expiresIn = 30 * 60; // 30 minutos en segundos

      res.json({
        success: true,
        data: {
          access_token: accessToken,
          token_type: 'bearer',
          expires_in: expiresIn,
          user: user.toJSON()
        }
      });
    } catch (error) {
      logger.error(`Error en login: ${error.message}`);
      next(error);
    }
  }

  /**
   * Cerrar sesión
   */
  async logout(req, res, next) {
    try {
      const user = req.user;
      
      logger.info(`🚪 Usuario '${user.username}' ha cerrado sesión`);

      res.json({
        success: true,
        message: 'Sesión cerrada exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error(`Error en logout: ${error.message}`);
      next(error);
    }
  }

  /**
   * Obtener información del usuario actual
   */
  async getCurrentUser(req, res, next) {
    try {
      const user = req.user;

      res.json({
        success: true,
        data: user.toJSON()
      });
    } catch (error) {
      logger.error(`Error obteniendo usuario actual: ${error.message}`);
      next(error);
    }
  }

  /**
   * Actualizar información del usuario actual
   */
  async updateCurrentUser(req, res, next) {
    try {
      const user = req.user;
      const updateData = req.body;

      // Campos permitidos para actualizar
      const allowedFields = ['email', 'full_name'];
      const filteredData = {};

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      }

      if (Object.keys(filteredData).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No hay campos válidos para actualizar'
        });
      }

      // Actualizar usuario
      const updatedUser = await authService.updateUser(user.id, filteredData);

      logger.info(`👤 Usuario '${user.username}' actualizó su perfil: ${Object.keys(filteredData).join(', ')}`);

      res.json({
        success: true,
        data: updatedUser.toJSON()
      });
    } catch (error) {
      logger.error(`Error actualizando usuario: ${error.message}`);
      
      if (error.message.includes('ya está en uso')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Cambiar contraseña del usuario actual
   */
  async changePassword(req, res, next) {
    try {
      const user = req.user;
      const { current_password, new_password } = req.body;

      // Validar datos requeridos
      if (!current_password || !new_password) {
        return res.status(400).json({
          success: false,
          message: 'current_password y new_password son requeridos'
        });
      }

      // Validar longitud de nueva contraseña
      if (new_password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La nueva contraseña debe tener al menos 6 caracteres'
        });
      }

      // Cambiar contraseña
      await authService.changePassword(user.id, current_password, new_password);

      logger.info(`🔒 Usuario '${user.username}' cambió su contraseña`);

      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      });
    } catch (error) {
      logger.error(`Error cambiando contraseña: ${error.message}`);
      
      if (error.message.includes('incorrecta')) {
        return res.status(401).json({
          success: false,
          message: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Obtener lista de usuarios (solo administradores)
   */
  async getAllUsers(req, res, next) {
    try {
      const { skip = 0, limit = 100 } = req.query;

      const { count, rows: users } = await User.findAndCountAll({
        offset: parseInt(skip),
        limit: parseInt(limit),
        order: [['created_at', 'DESC']]
      });

      const usersData = users.map(user => user.toJSON());

      res.json({
        success: true,
        data: usersData,
        meta: {
          total: count,
          skip: parseInt(skip),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      logger.error(`Error obteniendo usuarios: ${error.message}`);
      next(error);
    }
  }
}

module.exports = new AuthController();