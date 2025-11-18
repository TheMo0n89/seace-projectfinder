/**
 * Servicio de Gestión de Sesiones de Chat
 * Maneja creación, consulta y eliminación de chats con límite de 5 activos
 */

const { ChatSession, ChatMessage } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

class ChatSessionService {
  /**
   * Obtener todas las sesiones activas de un usuario
   */
  async getUserSessions(userId) {
    try {
      const sessions = await ChatSession.findAll({
        where: {
          user_id: userId,
          is_active: true
        },
        include: [{
          model: ChatMessage,
          as: 'messages',
          attributes: ['id', 'created_at'],
          limit: 1,
          order: [['created_at', 'DESC']],
          required: false
        }],
        order: [['updated_at', 'DESC']]
      });

      return sessions.map(session => ({
        id: session.id,
        title: session.title,
        created_at: session.created_at,
        updated_at: session.updated_at,
        message_count: session.messages?.length || 0,
        is_active: session.is_active
      }));
    } catch (error) {
      logger.error(`Error en getUserSessions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear nueva sesión de chat
   * Verifica límite de 5 chats activos
   */
  async createSession(userId, title = 'Nuevo Chat') {
    try {
      // Verificar cantidad de chats activos
      const activeCount = await ChatSession.count({
        where: {
          user_id: userId,
          is_active: true
        }
      });

      if (activeCount >= 5) {
        throw new Error('No puedes tener más de 5 chats activos. Elimina uno antes de crear un nuevo chat.');
      }

      const session = await ChatSession.create({
        user_id: userId,
        title: title
      });

      logger.info(`Nueva sesión de chat creada: ${session.id} para usuario ${userId}`);

      return {
        id: session.id,
        title: session.title,
        created_at: session.created_at,
        updated_at: session.updated_at,
        is_active: session.is_active
      };
    } catch (error) {
      logger.error(`Error en createSession: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener una sesión específica con sus mensajes
   */
  async getSessionWithMessages(sessionId, userId) {
    try {
      const session = await ChatSession.findOne({
        where: {
          id: sessionId,
          user_id: userId,
          is_active: true
        },
        include: [{
          model: ChatMessage,
          as: 'messages',
          order: [['created_at', 'ASC']]
        }]
      });

      if (!session) {
        throw new Error('Sesión no encontrada o no tienes permisos para acceder a ella');
      }

      return {
        id: session.id,
        title: session.title,
        created_at: session.created_at,
        updated_at: session.updated_at,
        messages: session.messages.map(msg => ({
          id: msg.id,
          user_query: msg.user_query,
          ai_response: msg.ai_response,
          relevant_processes: msg.relevant_processes,
          created_at: msg.created_at
        }))
      };
    } catch (error) {
      logger.error(`Error en getSessionWithMessages: ${error.message}`);
      throw error;
    }
  }

  /**
   * Agregar mensaje a una sesión
   */
  async addMessage(sessionId, userId, messageData) {
    try {
      // Verificar que la sesión pertenece al usuario
      const session = await ChatSession.findOne({
        where: {
          id: sessionId,
          user_id: userId,
          is_active: true
        }
      });

      if (!session) {
        throw new Error('Sesión no encontrada o no tienes permisos');
      }

      // Crear mensaje
      const message = await ChatMessage.create({
        session_id: sessionId,
        user_query: messageData.user_query,
        ai_response: messageData.ai_response,
        relevant_processes: messageData.relevant_processes || [],
        response_time_ms: messageData.response_time_ms,
        model_used: messageData.model_used || 'gemini-1.5-flash'
      });

      // Actualizar timestamp de la sesión
      await session.update({ updated_at: new Date() });

      // Generar título automático si es el primer mensaje
      if (!session.title || session.title === 'Nuevo Chat') {
        const autoTitle = this.generateTitle(messageData.user_query);
        await session.update({ title: autoTitle });
      }

      logger.info(`Mensaje agregado a sesión ${sessionId}`);

      return {
        id: message.id,
        user_query: message.user_query,
        ai_response: message.ai_response,
        relevant_processes: message.relevant_processes,
        created_at: message.created_at
      };
    } catch (error) {
      logger.error(`Error en addMessage: ${error.message}`);
      throw error;
    }
  }

  /**
   * Eliminar sesión (soft delete)
   */
  async deleteSession(sessionId, userId) {
    try {
      const session = await ChatSession.findOne({
        where: {
          id: sessionId,
          user_id: userId
        }
      });

      if (!session) {
        throw new Error('Sesión no encontrada o no tienes permisos');
      }

      await session.update({ is_active: false });

      logger.info(`Sesión ${sessionId} eliminada por usuario ${userId}`);

      return { success: true, message: 'Chat eliminado correctamente' };
    } catch (error) {
      logger.error(`Error en deleteSession: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualizar título de sesión
   */
  async updateSessionTitle(sessionId, userId, newTitle) {
    try {
      const session = await ChatSession.findOne({
        where: {
          id: sessionId,
          user_id: userId,
          is_active: true
        }
      });

      if (!session) {
        throw new Error('Sesión no encontrada');
      }

      await session.update({ title: newTitle });

      return { success: true, title: newTitle };
    } catch (error) {
      logger.error(`Error en updateSessionTitle: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generar título automático basado en la primera consulta
   */
  generateTitle(query) {
    if (!query) return 'Nuevo Chat';
    
    // Tomar las primeras 5 palabras o 50 caracteres
    const words = query.trim().split(/\s+/).slice(0, 5).join(' ');
    return words.length > 50 ? words.substring(0, 47) + '...' : words;
  }

  /**
   * Obtener estadísticas de uso de chats
   */
  async getUserChatStats(userId) {
    try {
      const totalSessions = await ChatSession.count({
        where: { user_id: userId, is_active: true }
      });

      const totalMessages = await ChatMessage.count({
        include: [{
          model: ChatSession,
          as: 'session',
          where: { user_id: userId, is_active: true },
          attributes: []
        }]
      });

      return {
        total_sessions: totalSessions,
        total_messages: totalMessages,
        remaining_slots: Math.max(0, 5 - totalSessions)
      };
    } catch (error) {
      logger.error(`Error en getUserChatStats: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new ChatSessionService();
