/**
 * Controlador de recomendaciones
 */
const recomendacionesService = require('../services/recomendacionesService');
const logger = require('../config/logger');

class RecomendacionesController {
  async getProcesoRecomendaciones(req, res, next) {
    try {
      const { proceso_id } = req.params;
      const recomendaciones = await recomendacionesService.getProcesoRecomendaciones(proceso_id);
      
      res.json({
        success: true,
        data: recomendaciones
      });
    } catch (error) {
      if (error.message.includes('no encontrado')) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  async generateRecomendaciones(req, res, next) {
    try {
      const { proceso_id } = req.params;
      const { force_regenerate = false } = req.body;
      
      const result = await recomendacionesService.generateRecomendaciones(proceso_id, force_regenerate);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async clearProcesoRecomendaciones(req, res, next) {
    try {
      const { proceso_id } = req.params;
      const result = await recomendacionesService.clearProcesoRecomendaciones(proceso_id);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserRecomendaciones(req, res, next) {
    try {
      const userId = req.user.id;
      const filters = {
        page: parseInt(req.query.page) || 1,
        size: parseInt(req.query.size) || 20,
        visible: req.query.visible !== undefined ? req.query.visible === 'true' : true
      };
      
      const result = await recomendacionesService.getUserRecomendaciones(userId, filters);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async updateRecomendacionVisibility(req, res, next) {
    try {
      const { recomendacion_id } = req.params;
      const { visible } = req.body;
      
      const recomendacion = await recomendacionesService.updateRecomendacionVisibility(recomendacion_id, visible);
      
      res.json({
        success: true,
        data: recomendacion
      });
    } catch (error) {
      if (error.message.includes('no encontrada')) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  }
}

module.exports = new RecomendacionesController();