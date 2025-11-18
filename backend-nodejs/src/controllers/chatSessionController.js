/**
 * Controlador de Sesiones de Chat
 */
const chatSessionService = require('../services/chatSessionService');
const logger = require('../config/logger');

class ChatSessionController {
  /**
   * GET /api/v1/chat/sessions
   * Obtener todas las sesiones del usuario
   */
  async getUserSessions(req, res) {
    try {
      const userId = req.user.id;
      const sessions = await chatSessionService.getUserSessions(userId);

      return res.status(200).json({
        status: 'success',
        data: { sessions }
      });
    } catch (error) {
      logger.error(`Error en getUserSessions: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'Error al obtener sesiones de chat',
        error: error.message
      });
    }
  }

  /**
   * POST /api/v1/chat/sessions
   * Crear nueva sesión de chat
   */
  async createSession(req, res) {
    try {
      const userId = req.user.id;
      const { title } = req.body;

      const session = await chatSessionService.createSession(userId, title);

      return res.status(201).json({
        status: 'success',
        message: 'Sesión de chat creada exitosamente',
        data: { session }
      });
    } catch (error) {
      logger.error(`Error en createSession: ${error.message}`);
      
      // Error específico de límite de chats
      if (error.message.includes('más de 5 chats')) {
        return res.status(400).json({
          status: 'error',
          message: error.message,
          code: 'MAX_SESSIONS_REACHED'
        });
      }

      return res.status(500).json({
        status: 'error',
        message: 'Error al crear sesión de chat',
        error: error.message
      });
    }
  }

  /**
   * GET /api/v1/chat/sessions/:sessionId
   * Obtener sesión específica con mensajes
   */
  async getSession(req, res) {
    try {
      const userId = req.user.id;
      const { sessionId } = req.params;

      const session = await chatSessionService.getSessionWithMessages(sessionId, userId);

      return res.status(200).json({
        status: 'success',
        data: { session }
      });
    } catch (error) {
      logger.error(`Error en getSession: ${error.message}`);
      
      if (error.message.includes('no encontrada')) {
        return res.status(404).json({
          status: 'error',
          message: error.message
        });
      }

      return res.status(500).json({
        status: 'error',
        message: 'Error al obtener sesión',
        error: error.message
      });
    }
  }

  /**
   * POST /api/v1/chat/sessions/:sessionId/messages
   * Agregar mensaje a sesión
   */
  async addMessage(req, res) {
    try {
      const userId = req.user.id;
      const { sessionId } = req.params;
      const messageData = req.body;

      const message = await chatSessionService.addMessage(sessionId, userId, messageData);

      return res.status(201).json({
        status: 'success',
        data: { message }
      });
    } catch (error) {
      logger.error(`Error en addMessage: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'Error al agregar mensaje',
        error: error.message
      });
    }
  }

  /**
   * DELETE /api/v1/chat/sessions/:sessionId
   * Eliminar sesión
   */
  async deleteSession(req, res) {
    try {
      const userId = req.user.id;
      const { sessionId } = req.params;

      const result = await chatSessionService.deleteSession(sessionId, userId);

      return res.status(200).json({
        status: 'success',
        message: result.message
      });
    } catch (error) {
      logger.error(`Error en deleteSession: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'Error al eliminar sesión',
        error: error.message
      });
    }
  }

  /**
   * PATCH /api/v1/chat/sessions/:sessionId/title
   * Actualizar título de sesión
   */
  async updateTitle(req, res) {
    try {
      const userId = req.user.id;
      const { sessionId } = req.params;
      const { title } = req.body;

      if (!title || title.trim().length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'El título no puede estar vacío'
        });
      }

      const result = await chatSessionService.updateSessionTitle(sessionId, userId, title);

      return res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      logger.error(`Error en updateTitle: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'Error al actualizar título',
        error: error.message
      });
    }
  }

  /**
   * GET /api/v1/chat/stats
   * Obtener estadísticas de uso de chats
   */
  async getUserStats(req, res) {
    try {
      const userId = req.user.id;
      const stats = await chatSessionService.getUserChatStats(userId);

      return res.status(200).json({
        status: 'success',
        data: stats
      });
    } catch (error) {
      logger.error(`Error en getUserStats: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'Error al obtener estadísticas',
        error: error.message
      });
    }
  }
}

module.exports = new ChatSessionController();
