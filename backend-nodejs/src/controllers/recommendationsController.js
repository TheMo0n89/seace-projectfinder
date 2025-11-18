/**
 * Controlador de Recomendaciones Personalizadas
 */
const recommendationsService = require('../services/recommendationsService');
const logger = require('../config/logger');

class RecommendationsController {
  /**
   * GET /api/v1/users/me/recommendations
   * Obtener recomendaciones del usuario autenticado
   */
  async getRecommendations(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, only_unseen = 'false' } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        onlyUnseen: only_unseen === 'true'
      };

      const recommendations = await recommendationsService.getUserRecommendations(userId, options);

      return res.status(200).json({
        status: 'success',
        data: recommendations
      });
    } catch (error) {
      logger.error(`Error en getRecommendations: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'Error al obtener recomendaciones',
        error: error.message
      });
    }
  }

  /**
   * POST /api/v1/users/me/recommendations/generate
   * Generar recomendaciones manualmente
   */
  async generateRecommendations(req, res) {
    try {
      const userId = req.user.id;
      const { force_regenerate = false, limit = 10 } = req.body;

      const result = await recommendationsService.generateRecommendations(userId, {
        forceRegenerate: force_regenerate,
        limit: parseInt(limit)
      });

      return res.status(200).json({
        status: 'success',
        message: result.message,
        data: result
      });
    } catch (error) {
      logger.error(`Error en generateRecommendations: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'Error al generar recomendaciones',
        error: error.message
      });
    }
  }

  /**
   * POST /api/v1/users/me/recommendations/seen
   * Marcar recomendaciones como vistas
   */
  async markAsSeen(req, res) {
    try {
      const userId = req.user.id;
      const { recommendation_ids } = req.body;

      if (!recommendation_ids || !Array.isArray(recommendation_ids)) {
        return res.status(400).json({
          status: 'error',
          message: 'recommendation_ids debe ser un array de IDs'
        });
      }

      const result = await recommendationsService.markAsSeen(userId, recommendation_ids);

      return res.status(200).json({
        status: 'success',
        message: `${result.updated_count} recomendaciones marcadas como vistas`,
        data: result
      });
    } catch (error) {
      logger.error(`Error en markAsSeen: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'Error al marcar recomendaciones como vistas',
        error: error.message
      });
    }
  }

  /**
   * GET /api/v1/users/me/recommendations/stats
   * Obtener estadísticas de recomendaciones
   */
  async getRecommendationStats(req, res) {
    try {
      const userId = req.user.id;

      const stats = await recommendationsService.getRecommendationStats(userId);

      return res.status(200).json({
        status: 'success',
        data: stats
      });
    } catch (error) {
      logger.error(`Error en getRecommendationStats: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'Error al obtener estadísticas de recomendaciones',
        error: error.message
      });
    }
  }
}

module.exports = new RecommendationsController();
