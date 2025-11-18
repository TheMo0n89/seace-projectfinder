/**
 * Servicio de Administración
 */
const { User, Proceso, ScrapingTask, Configuracion } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

class AdminService {
  // Gestión de usuarios
  async getAllUsers(filters = {}) {
    try {
      const { page = 1, size = 50, role, is_active, search } = filters;
      const whereClause = {};

      if (role) whereClause.role = role;
      if (is_active !== undefined) whereClause.is_active = is_active;
      if (search) {
        whereClause[Op.or] = [
          { username: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { full_name: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const offset = (page - 1) * size;
      const { count, rows } = await User.findAndCountAll({
        where: whereClause,
        offset,
        limit: size,
        order: [['created_at', 'DESC']],
        attributes: {
          include: [
            [
              // Subconsulta para contar recomendaciones
              require('sequelize').literal(`(
                SELECT COUNT(*)::int
                FROM user_recommendations
                WHERE user_recommendations.user_id = "User".id
              )`),
              'recommendations_count'
            ]
          ]
        }
      });

      return {
        items: rows.map(user => user.toJSON()),
        total: count,
        page: parseInt(page),
        size: parseInt(size),
        pages: Math.ceil(count / size)
      };
    } catch (error) {
      logger.error(`Error en getAllUsers: ${error.message}`);
      throw error;
    }
  }

  async updateUser(userId, updateData) {
    try {
      const user = await User.findByPk(userId);
      if (!user) throw new Error('Usuario no encontrado');

      const allowedFields = ['email', 'full_name', 'role', 'is_active'];
      const filteredData = {};
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      }

      await user.update(filteredData);
      return user.toJSON();
    } catch (error) {
      logger.error(`Error en updateUser: ${error.message}`);
      throw error;
    }
  }

  async deleteUser(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) throw new Error('Usuario no encontrado');
      
      await user.destroy();
      return { message: 'Usuario eliminado exitosamente' };
    } catch (error) {
      logger.error(`Error en deleteUser: ${error.message}`);
      throw error;
    }
  }

  // Gestión de configuración
  async getAllConfig() {
    try {
      const configs = await Configuracion.findAll({
        order: [['clave', 'ASC']]
      });
      return configs;
    } catch (error) {
      logger.error(`Error en getAllConfig: ${error.message}`);
      throw error;
    }
  }

  async getConfig(clave) {
    try {
      const config = await Configuracion.findOne({ where: { clave } });
      if (!config) throw new Error('Configuración no encontrada');
      return config;
    } catch (error) {
      logger.error(`Error en getConfig: ${error.message}`);
      throw error;
    }
  }

  async setConfig(clave, valor, descripcion = null) {
    try {
      const [config, created] = await Configuracion.findOrCreate({
        where: { clave },
        defaults: { clave, valor, descripcion }
      });

      if (!created) {
        await config.update({ valor, descripcion, updated_at: new Date() });
      }

      return config;
    } catch (error) {
      logger.error(`Error en setConfig: ${error.message}`);
      throw error;
    }
  }

  async deleteConfig(clave) {
    try {
      const deleted = await Configuracion.destroy({ where: { clave } });
      if (deleted === 0) throw new Error('Configuración no encontrada');
      return { message: 'Configuración eliminada exitosamente' };
    } catch (error) {
      logger.error(`Error en deleteConfig: ${error.message}`);
      throw error;
    }
  }

  // Estadísticas del sistema
  async getSystemStats() {
    try {
      const totalUsers = await User.count();
      const activeUsers = await User.count({ where: { is_active: true } });
      const totalProcesos = await Proceso.count();
      const recentProcesos = await Proceso.count({
        where: {
          fecha_extraccion: {
            [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Últimos 7 días
          }
        }
      });

      return {
        total_users: totalUsers,
        active_users: activeUsers,
        total_procesos: totalProcesos,
        recent_procesos_7_days: recentProcesos
      };
    } catch (error) {
      logger.error(`Error en getSystemStats: ${error.message}`);
      throw error;
    }
  }

  // Mantenimiento de base de datos
  async cleanOldData(days = 90) {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      // Eliminar procesos antiguos sin actividad
      const deletedProcesos = await Proceso.destroy({
        where: {
          fecha_extraccion: { [Op.lt]: cutoffDate },
          procesado_nlp: false
        }
      });

      return {
        message: 'Limpieza completada',
        deleted_procesos: deletedProcesos
      };
    } catch (error) {
      logger.error(`Error en cleanOldData: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new AdminService();