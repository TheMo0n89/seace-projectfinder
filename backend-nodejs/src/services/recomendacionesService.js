/**
 * Servicio de recomendaciones
 */
const { Recomendacion, Proceso } = require('../models');
const logger = require('../config/logger');

class RecomendacionesService {
  /**
   * Obtener recomendaciones de un proceso
   */
  async getProcesoRecomendaciones(procesoId) {
    try {
      // Verificar que el proceso existe
      const proceso = await Proceso.findByPk(procesoId);
      if (!proceso) {
        throw new Error('Proceso no encontrado');
      }

      // Obtener recomendaciones
      const recomendaciones = await Recomendacion.findAll({
        where: { proceso_id: procesoId },
        include: [
          {
            model: Proceso,
            as: 'proceso'
          }
        ],
        order: [['created_at', 'DESC']]
      });

      return recomendaciones;
    } catch (error) {
      logger.error(`Error en getProcesoRecomendaciones: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generar recomendaciones para un proceso
   */
  async generateRecomendaciones(procesoId, forceRegenerate = false) {
    try {
      // Verificar que el proceso existe
      const proceso = await Proceso.findByPk(procesoId);
      if (!proceso) {
        throw new Error('Proceso no encontrado');
      }

      // Verificar si ya tiene recomendaciones
      const existingCount = await Recomendacion.count({
        where: { proceso_id: procesoId }
      });

      if (existingCount > 0 && !forceRegenerate) {
        return {
          message: 'El proceso ya tiene recomendaciones. Use force_regenerate=true para regenerar.',
          existing_count: existingCount
        };
      }

      // Si es regeneración, eliminar las existentes
      if (forceRegenerate && existingCount > 0) {
        await Recomendacion.destroy({
          where: { proceso_id: procesoId }
        });
      }

      // Aquí se integraría con un servicio de IA (Gemini, OpenAI, etc.)
      // Por ahora, crear recomendaciones de ejemplo
      const recomendaciones = await this.generateDummyRecomendaciones(proceso);

      return {
        message: 'Recomendaciones generadas exitosamente',
        proceso_id: procesoId,
        status: 'completed',
        count: recomendaciones.length
      };
    } catch (error) {
      logger.error(`Error en generateRecomendaciones: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generar recomendaciones de ejemplo (dummy)
   */
  async generateDummyRecomendaciones(proceso) {
    const recomendaciones = [];

    // MVP
    const mvp = await Recomendacion.create({
      proceso_id: proceso.id,
      user_id: null,
      score: 0.85,
      visible: true
    });
    recomendaciones.push(mvp);

    // Sprint 1
    const sprint1 = await Recomendacion.create({
      proceso_id: proceso.id,
      user_id: null,
      score: 0.80,
      visible: true
    });
    recomendaciones.push(sprint1);

    // Stack Tech
    const stackTech = await Recomendacion.create({
      proceso_id: proceso.id,
      user_id: null,
      score: 0.90,
      visible: true
    });
    recomendaciones.push(stackTech);

    return recomendaciones;
  }

  /**
   * Obtener recomendación específica por tipo
   */
  async getRecomendacionByType(procesoId, type) {
    try {
      const recomendacion = await Recomendacion.findOne({
        where: {
          proceso_id: procesoId,
          // tipo_recomendacion: type // Descomentar cuando se agregue campo
        }
      });

      if (!recomendacion) {
        throw new Error(`Recomendación de tipo ${type} no encontrada`);
      }

      return recomendacion;
    } catch (error) {
      logger.error(`Error en getRecomendacionByType: ${error.message}`);
      throw error;
    }
  }

  /**
   * Eliminar recomendaciones de un proceso
   */
  async clearProcesoRecomendaciones(procesoId) {
    try {
      const deleted = await Recomendacion.destroy({
        where: { proceso_id: procesoId }
      });

      return {
        message: 'Recomendaciones eliminadas exitosamente',
        deleted_count: deleted
      };
    } catch (error) {
      logger.error(`Error en clearProcesoRecomendaciones: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener recomendaciones para un usuario
   */
  async getUserRecomendaciones(userId, filters = {}) {
    try {
      const { page = 1, size = 20, visible = true } = filters;
      const offset = (page - 1) * size;

      const whereClause = { user_id: userId };
      if (visible !== undefined) {
        whereClause.visible = visible;
      }

      const { count, rows } = await Recomendacion.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Proceso,
            as: 'proceso'
          }
        ],
        offset: offset,
        limit: size,
        order: [['score', 'DESC'], ['created_at', 'DESC']]
      });

      return {
        items: rows,
        total: count,
        page: parseInt(page),
        size: parseInt(size),
        pages: Math.ceil(count / size)
      };
    } catch (error) {
      logger.error(`Error en getUserRecomendaciones: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualizar visibilidad de una recomendación
   */
  async updateRecomendacionVisibility(recomendacionId, visible) {
    try {
      const recomendacion = await Recomendacion.findByPk(recomendacionId);
      
      if (!recomendacion) {
        throw new Error('Recomendación no encontrada');
      }

      await recomendacion.update({ visible: visible });

      return recomendacion;
    } catch (error) {
      logger.error(`Error en updateRecomendacionVisibility: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new RecomendacionesService();