/**
 * Servicio de Chatbot
 */
const { ChatbotLog } = require('../models');
const logger = require('../config/logger');

class ChatbotService {
  async processQuery(query, sessionId = null) {
    try {
      const startTime = Date.now();
      
      // Generar session_id si no se proporciona
      if (!sessionId) {
        sessionId = require('uuid').v4();
      }

      // Validar consulta relacionada con SEACE
      if (!this.isValidSeaceQuery(query)) {
        return {
          response: "Lo siento, solo puedo responder preguntas relacionadas con contratación pública peruana y oportunidades de TI en el SEACE.",
          relevant_processes: [],
          session_id: sessionId,
          response_time_ms: Date.now() - startTime,
          model_used: "filter",
          sources_cited: []
        };
      }

      // Generar respuesta (aquí se integraría con servicio de IA)
      const response = await this.generateResponse(query);
      const responseTime = Date.now() - startTime;

      // Guardar log
      await ChatbotLog.create({
        session_id: sessionId,
        user_query: query,
        ai_response: response.response,
        relevant_processes: response.relevant_processes || [],
        response_time_ms: responseTime,
        model_used: response.model_used || 'gemini-2.5-flash'
      });

      return {
        ...response,
        session_id: sessionId,
        response_time_ms: responseTime
      };
    } catch (error) {
      logger.error(`Error en processQuery: ${error.message}`);
      throw error;
    }
  }

  isValidSeaceQuery(query) {
    const keywords = [
      'seace', 'contratación', 'licitación', 'proceso', 'adjudicación',
      'software', 'sistema', 'desarrollo', 'tecnología', 'ti', 'informática'
    ];
    
    const lowerQuery = query.toLowerCase();
    return keywords.some(keyword => lowerQuery.includes(keyword));
  }

  async generateResponse(query) {
    // Simulación de respuesta de IA
    // Aquí se integraría con Gemini, OpenAI, etc.
    return {
      response: `Respuesta generada para: "${query}". Este es un servicio de prueba. Integrar con servicio de IA para producción.`,
      relevant_processes: [],
      model_used: 'gemini-2.5-flash',
      sources_cited: []
    };
  }

  async getQuerySuggestions() {
    return [
      "¿Qué procesos de desarrollo de software están disponibles?",
      "Muéstrame licitaciones de tecnología",
      "¿Cuáles son los montos promedio de los procesos de TI?",
      "Necesito información sobre contrataciones en Lima",
      "¿Qué requisitos debo cumplir para participar?"
    ];
  }

  async getChatHistory(sessionId, limit = 50) {
    try {
      const history = await ChatbotLog.findAll({
        where: { session_id: sessionId },
        order: [['created_at', 'DESC']],
        limit: limit
      });

      return history;
    } catch (error) {
      logger.error(`Error en getChatHistory: ${error.message}`);
      throw error;
    }
  }

  async getChatStats() {
    try {
      const totalQueries = await ChatbotLog.count();
      const avgResponseTime = await ChatbotLog.average('response_time_ms');

      return {
        total_queries: totalQueries,
        avg_response_time_ms: Math.round(avgResponseTime || 0)
      };
    } catch (error) {
      logger.error(`Error en getChatStats: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new ChatbotService();