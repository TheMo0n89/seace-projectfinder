/**
 * Servicio para registrar interacciones de usuarios
 */
const { UserInteraction } = require('../models');
const logger = require('../config/logger');

class InteractionService {
  /**
   * Registrar una interacción de usuario
   * @param {string} userId - ID del usuario
   * @param {string} tipoInteraccion - Tipo: 'login', 'click', 'chatbot', 'view_recommendation', 'hide_recommendation'
   * @param {string} procesoId - ID del proceso (opcional)
   * @param {object} metadatos - Información adicional (opcional)
   * @param {number} valor - Valor numérico asociado (opcional)
   */
  async registrarInteraccion(userId, tipoInteraccion, procesoId = null, metadatos = {}, valor = null) {
    try {
      if (!userId || !tipoInteraccion) {
        logger.warn('Intento de registrar interacción sin userId o tipoInteraccion');
        return null;
      }

      const interaction = await UserInteraction.create({
        user_id: userId,
        proceso_id: procesoId,
        tipo_interaccion: tipoInteraccion,
        valor,
        metadatos,
        timestamp: new Date()
      });

      logger.debug(`Interacción registrada: ${tipoInteraccion} - Usuario: ${userId}`);
      return interaction;
    } catch (error) {
      logger.error(`Error al registrar interacción: ${error.message}`);
      // No lanzar error para no afectar la funcionalidad principal
      return null;
    }
  }

  /**
   * Registrar login de usuario
   */
  async registrarLogin(userId) {
    return this.registrarInteraccion(userId, 'login', null, {
      accion: 'Inicio de sesión exitoso'
    });
  }

  /**
   * Registrar click en proceso
   */
  async registrarClickProceso(userId, procesoId, nombreEntidad) {
    return this.registrarInteraccion(userId, 'click', procesoId, {
      accion: 'Click en proceso',
      entidad: nombreEntidad
    });
  }

  /**
   * Registrar consulta de chatbot
   */
  async registrarChatbot(userId, pregunta, respuesta, procesoId = null) {
    return this.registrarInteraccion(userId, 'chatbot', procesoId, {
      pregunta,
      respuesta: respuesta?.substring(0, 200) // Limitar longitud
    });
  }

  /**
   * Registrar visualización de recomendación
   */
  async registrarViewRecomendacion(userId, procesoId, score) {
    return this.registrarInteraccion(userId, 'view_recommendation', procesoId, {
      accion: 'Ver recomendación'
    }, score);
  }

  /**
   * Registrar ocultamiento de recomendación
   */
  async registrarHideRecomendacion(userId, procesoId) {
    return this.registrarInteraccion(userId, 'hide_recommendation', procesoId, {
      accion: 'Ocultar recomendación'
    });
  }

  /**
   * Obtener últimas interacciones de un usuario
   */
  async getUltimasInteracciones(userId, limit = 10) {
    try {
      const interacciones = await UserInteraction.findAll({
        where: { user_id: userId },
        order: [['timestamp', 'DESC']],
        limit,
        include: [
          {
            association: 'proceso',
            attributes: ['id', 'nombre_entidad', 'objeto_contratacion']
          }
        ]
      });

      return interacciones;
    } catch (error) {
      logger.error(`Error al obtener interacciones: ${error.message}`);
      return [];
    }
  }

  /**
   * Contar interacciones de un usuario en un período
   */
  async contarInteracciones(userId, dias = 30) {
    try {
      const fechaInicio = new Date();
      fechaInicio.setDate(fechaInicio.getDate() - dias);

      const count = await UserInteraction.count({
        where: {
          user_id: userId,
          timestamp: {
            [require('sequelize').Op.gte]: fechaInicio
          }
        }
      });

      return count;
    } catch (error) {
      logger.error(`Error al contar interacciones: ${error.message}`);
      return 0;
    }
  }
}

module.exports = new InteractionService();
