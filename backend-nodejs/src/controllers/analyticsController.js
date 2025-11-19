/**
 * Controlador de Analytics para tracking de interacciones y estadísticas
 */
const RecommendationClick = require('../models/RecommendationClick');
const { sequelize } = require('../config/database');
const logger = require('../config/logger');
const analyticsService = require('../services/analyticsService');

const analyticsController = {
  /**
   * Obtener estadísticas del dashboard principal
   * @route GET /api/v1/analytics/dashboard
   * @access Admin
   */
  async getDashboardStats(req, res, next) {
    try {
      const stats = await analyticsService.getDashboardStats();
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error(`Error en getDashboardStats: ${error.message}`);
      next(error);
    }
  },

  /**
   * Obtener estadísticas de perfil de usuario
   * @route GET /api/v1/analytics/users/:userId
   * @access Admin o el mismo usuario
   */
  async getUserProfileStats(req, res, next) {
    try {
      const { userId } = req.params;
      
      // Verificar que el usuario está autorizado
      if (req.user.role !== 'admin' && req.user.id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'No autorizado para ver este perfil'
        });
      }

      const stats = await analyticsService.getUserProfileStats(userId);
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error(`Error en getUserProfileStats: ${error.message}`);
      next(error);
    }
  },

  /**
   * Obtener estadísticas del usuario autenticado
   * @route GET /api/v1/analytics/users/me/stats
   * @access Authenticated
   */
  async getMyStats(req, res, next) {
    try {
      const userId = req.user.id;
      const stats = await analyticsService.getUserProfileStats(userId);
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error(`Error en getMyStats: ${error.message}`);
      next(error);
    }
  },

  /**
   * Registrar click en recomendación
   */
  async trackRecommendationClick(req, res, next) {
    try {
      const { recommendation_id, proceso_id, session_id } = req.body;
      const userId = req.user.id;

      if (!recommendation_id || !proceso_id) {
        return res.status(400).json({
          success: false,
          message: 'recommendation_id y proceso_id son requeridos'
        });
      }

      // Registrar click
      const click = await RecommendationClick.create({
        user_id: userId,
        recommendation_id,
        proceso_id,
        session_id: session_id || null,
        user_agent: req.headers['user-agent'] || null,
        referrer: req.headers['referer'] || null,
        clicked_at: new Date()
      });

      logger.info(`Click registrado: user=${userId}, recommendation=${recommendation_id}, proceso=${proceso_id}`);

      res.json({
        success: true,
        data: {
          click_id: click.id,
          tracked_at: click.clicked_at
        }
      });

    } catch (error) {
      logger.error(`Error registrando click: ${error.message}`);
      next(error);
    }
  },

  /**
   * Obtener estadísticas de clicks del usuario
   */
  async getUserClickStats(req, res, next) {
    try {
      const userId = req.user.id;

      const stats = await RecommendationClick.findAll({
        where: { user_id: userId },
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'total_clicks'],
          [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('proceso_id'))), 'unique_processes'],
          [sequelize.fn('MIN', sequelize.col('clicked_at')), 'first_click'],
          [sequelize.fn('MAX', sequelize.col('clicked_at')), 'last_click']
        ],
        raw: true
      });

      res.json({
        success: true,
        data: stats[0]
      });

    } catch (error) {
      logger.error(`Error obteniendo estadísticas: ${error.message}`);
      next(error);
    }
  },

  /**
   * Obtener procesos más clickeados
   */
  async getTopClickedProcesses(req, res, next) {
    try {
      const { limit = 10 } = req.query;

      const topProcesses = await RecommendationClick.findAll({
        attributes: [
          'proceso_id',
          [sequelize.fn('COUNT', sequelize.col('id')), 'click_count']
        ],
        group: ['proceso_id'],
        order: [[sequelize.literal('click_count'), 'DESC']],
        limit: parseInt(limit),
        raw: true
      });

      res.json({
        success: true,
        data: topProcesses
      });

    } catch (error) {
      logger.error(`Error obteniendo top procesos: ${error.message}`);
      next(error);
    }
  }
};

module.exports = analyticsController;
