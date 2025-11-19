/**
 * Controlador de Chatbot
 */
const chatbotService = require('../services/chatbotService');
const interactionService = require('../services/interactionService');
const logger = require('../config/logger');

class ChatbotController {
  async health(req, res, next) {
    try {
      res.json({
        success: true,
        data: {
          status: "healthy",
          service: "chatbot",
          rag_service: "available"
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async query(req, res, next) {
    try {
      const { query, session_id, use_personalization } = req.body;
      const userId = req.user ? req.user.id : null; // Obtener userId si está autenticado
      const usePersonalization = use_personalization === true; // Convertir a boolean

      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'El campo "query" es requerido'
        });
      }

      const response = await chatbotService.processQuery(query, session_id, userId, usePersonalization);

      // Registrar interacción de chatbot si el usuario está autenticado
      if (userId) {
        interactionService.registrarChatbot(
          userId,
          query,
          response.respuesta,
          null // proceso_id puede agregarse en el futuro si el chatbot menciona un proceso específico
        ).catch(err => {
          logger.error(`Error registrando interacción de chatbot: ${err.message}`);
        });
      }

      res.json({
        success: true,
        data: response
      });
    } catch (error) {
      logger.error(`Error en chatbot query: ${error.message}`);
      next(error);
    }
  }

  async getSuggestions(req, res, next) {
    try {
      const suggestions = await chatbotService.getQuerySuggestions();

      res.json({
        success: true,
        data: suggestions
      });
    } catch (error) {
      next(error);
    }
  }

  async getChatHistory(req, res, next) {
    try {
      const { session_id } = req.params;
      const limit = parseInt(req.query.limit) || 50;

      const history = await chatbotService.getChatHistory(session_id, limit);

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await chatbotService.getChatStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ChatbotController();