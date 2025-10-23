/**
 * Servicio de Dashboard
 */
const { Proceso, User, Recomendacion, ChatbotLog, ETLLog } = require('../models');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

class DashboardService {
  async getGeneralOverview() {
    try {
      const totalProcesos = await Proceso.count();
      const totalUsers = await User.count();
      const totalRecomendaciones = await Recomendacion.count();
      const totalChatQueries = await ChatbotLog.count();

      const montoTotal = await Proceso.sum('monto_referencial', {
        where: { monto_referencial: { [Op.ne]: null } }
      });

      return {
        total_procesos: totalProcesos,
        total_users: totalUsers,
        total_recomendaciones: totalRecomendaciones,
        total_chat_queries: totalChatQueries,
        monto_total: parseFloat(montoTotal || 0)
      };
    } catch (error) {
      console.error('Error en getGeneralOverview:', error);
      throw error;
    }
  }

  async getProcesosByEstado() {
    try {
      const results = await sequelize.query(
        `SELECT estado_proceso, COUNT(*) as count 
         FROM procesos 
         WHERE estado_proceso IS NOT NULL 
         GROUP BY estado_proceso 
         ORDER BY count DESC`,
        { type: sequelize.QueryTypes.SELECT }
      );

      return results;
    } catch (error) {
      console.error('Error en getProcesosByEstado:', error);
      throw error;
    }
  }

  async getProcesosByDepartamento() {
    try {
      const results = await sequelize.query(
        `SELECT departamento, COUNT(*) as count, SUM(monto_referencial) as monto_total
         FROM procesos 
         WHERE departamento IS NOT NULL 
         GROUP BY departamento 
         ORDER BY count DESC 
         LIMIT 10`,
        { type: sequelize.QueryTypes.SELECT }
      );

      return results;
    } catch (error) {
      console.error('Error en getProcesosByDepartamento:', error);
      throw error;
    }
  }

  async getMonthlyTrends() {
    try {
      const results = await sequelize.query(
        `SELECT 
          DATE_TRUNC('month', fecha_publicacion) as month,
          COUNT(*) as count,
          SUM(monto_referencial) as monto_total
         FROM procesos 
         WHERE fecha_publicacion >= NOW() - INTERVAL '12 months'
         GROUP BY DATE_TRUNC('month', fecha_publicacion)
         ORDER BY month DESC`,
        { type: sequelize.QueryTypes.SELECT }
      );

      return results;
    } catch (error) {
      console.error('Error en getMonthlyTrends:', error);
      throw error;
    }
  }

  async getTopRubros() {
    try {
      const results = await sequelize.query(
        `SELECT rubro, COUNT(*) as count, AVG(monto_referencial) as promedio_monto
         FROM procesos 
         WHERE rubro IS NOT NULL 
         GROUP BY rubro 
         ORDER BY count DESC 
         LIMIT 10`,
        { type: sequelize.QueryTypes.SELECT }
      );

      return results;
    } catch (error) {
      console.error('Error en getTopRubros:', error);
      throw error;
    }
  }

  async getUserActivity() {
    try {
      const activeUsers = await User.count({
        where: {
          last_login: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 días
          }
        }
      });

      const newUsersLastMonth = await User.count({
        where: {
          created_at: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      });

      return {
        active_users_last_30_days: activeUsers,
        new_users_last_month: newUsersLastMonth
      };
    } catch (error) {
      console.error('Error en getUserActivity:', error);
      throw error;
    }
  }

  async getETLActivity() {
    try {
      const recentJobs = await ETLLog.findAll({
        order: [['created_at', 'DESC']],
        limit: 10
      });

      const successRate = await sequelize.query(
        `SELECT 
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COUNT(*) FILTER (WHERE status = 'failed') as failed,
          COUNT(*) as total
         FROM etl_logs
         WHERE created_at >= NOW() - INTERVAL '7 days'`,
        { type: sequelize.QueryTypes.SELECT }
      );

      return {
        recent_jobs: recentJobs,
        success_rate: successRate[0] || { completed: 0, failed: 0, total: 0 }
      };
    } catch (error) {
      console.error('Error en getETLActivity:', error);
      throw error;
    }
  }
}

module.exports = new DashboardService();