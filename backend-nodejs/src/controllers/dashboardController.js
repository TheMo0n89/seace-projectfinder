/**
 * Controlador de Dashboard
 */
const dashboardService = require('../services/dashboardService');
const logger = require('../config/logger');

class DashboardController {
  async getOverview(req, res, next) {
    try {
      const overview = await dashboardService.getGeneralOverview();
      res.json({ success: true, data: overview });
    } catch (error) {
      logger.error(`Error en getOverview: ${error.message}`);
      next(error);
    }
  }

  async getProcesosByEstado(req, res, next) {
    try {
      const data = await dashboardService.getProcesosByEstado();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getProcesosByDepartamento(req, res, next) {
    try {
      const data = await dashboardService.getProcesosByDepartamento();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getMonthlyTrends(req, res, next) {
    try {
      const data = await dashboardService.getMonthlyTrends();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getTopRubros(req, res, next) {
    try {
      const data = await dashboardService.getTopRubros();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getUserActivity(req, res, next) {
    try {
      const data = await dashboardService.getUserActivity();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getETLActivity(req, res, next) {
    try {
      const data = await dashboardService.getETLActivity();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();