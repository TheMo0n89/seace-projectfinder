/**
 * Controlador de Administración
 */
const adminService = require('../services/adminService');
const logger = require('../config/logger');

class AdminController {
  // Usuarios
  async getAllUsers(req, res, next) {
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        size: parseInt(req.query.size) || 50,
        role: req.query.role,
        is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined,
        search: req.query.search
      };

      const result = await adminService.getAllUsers(filters);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error(`Error en getAllUsers: ${error.message}`);
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const { user_id } = req.params;
      const updateData = req.body;

      const user = await adminService.updateUser(user_id, updateData);
      logger.info(`Usuario actualizado: ${user_id}`);
      res.json({ success: true, data: user });
    } catch (error) {
      if (error.message.includes('no encontrado')) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const { user_id } = req.params;
      const result = await adminService.deleteUser(user_id);
      logger.info(`Usuario eliminado: ${user_id}`);
      res.json({ success: true, data: result });
    } catch (error) {
      if (error.message.includes('no encontrado')) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  // Configuración
  async getAllConfig(req, res, next) {
    try {
      const configs = await adminService.getAllConfig();
      res.json({ success: true, data: configs });
    } catch (error) {
      next(error);
    }
  }

  async getConfig(req, res, next) {
    try {
      const { clave } = req.params;
      const config = await adminService.getConfig(clave);
      res.json({ success: true, data: config });
    } catch (error) {
      if (error.message.includes('no encontrada')) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  async setConfig(req, res, next) {
    try {
      const { clave, valor, descripcion } = req.body;
      
      if (!clave || !valor) {
        return res.status(400).json({
          success: false,
          message: 'Los campos clave y valor son requeridos'
        });
      }

      const config = await adminService.setConfig(clave, valor, descripcion);
      logger.info(`Configuración actualizada: ${clave}`);
      res.json({ success: true, data: config });
    } catch (error) {
      next(error);
    }
  }

  async deleteConfig(req, res, next) {
    try {
      const { clave } = req.params;
      const result = await adminService.deleteConfig(clave);
      logger.info(`Configuración eliminada: ${clave}`);
      res.json({ success: true, data: result });
    } catch (error) {
      if (error.message.includes('no encontrada')) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  // Estadísticas
  async getSystemStats(req, res, next) {
    try {
      const stats = await adminService.getSystemStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  // Mantenimiento
  async cleanOldData(req, res, next) {
    try {
      const days = parseInt(req.query.days) || 90;
      const result = await adminService.cleanOldData(days);
      logger.info(`Limpieza de datos antiguos completada (${days} días)`);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();