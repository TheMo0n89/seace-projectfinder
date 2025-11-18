/**
 * Servicio de Chatbot
 */
const { ChatbotLog, Preferencia } = require('../models');
const logger = require('../config/logger');

class ChatbotService {
  async processQuery(query, sessionId = null, userId = null, usePersonalization = false) {
    try {
      const startTime = Date.now();

      // Generar session_id si no se proporciona
      if (!sessionId) {
        sessionId = require('uuid').v4();
      }

      // Cargar preferencias del usuario solo si está autenticado Y tiene personalización activada
      let userContext = null;
      if (userId && usePersonalization) {
        userContext = await this.loadUserContext(userId);
      }

      // Procesar consulta con servicio de procesos para obtener contexto
      const chatbotProcessService = require('./chatbotProcessService');
      const procResult = await chatbotProcessService.processQuery(query, userContext);

      // Construir fuentes a partir de procesos
      const sources = (procResult.processes || []).map(p => ({
        title: p.nomenclatura || p.descripcion,
        url: p.url
      }));

      // Validar dominio de la consulta (SEACE/contratación pública)
      const isSeace = this.isValidSeaceQuery(query);
      const baseResponse = isSeace ? (procResult.response || '') :
        "Lo siento, solo puedo responder preguntas relacionadas con contratación pública peruana y oportunidades de TI en el SEACE.";

      // Generar respuesta con Gemini usando contexto (incluyendo perfil de usuario)
      const { generateChatResponse, getModelName } = require('../utils/ai');
      
      let aiText;
      let modelUsed = getModelName();
      
      try {
        aiText = await generateChatResponse(query, {
          processes: procResult.processes || [],
          metadata: procResult.metadata || {},
          userContext: userContext
        });
      } catch (geminiError) {
        // Mostrar error específico de Gemini en la respuesta
        aiText = `## ⚠️ Error de Gemini AI\n\n` +
          `**Error específico:** ${geminiError.message}\n\n` +
          `**Modelo configurado:** ${modelUsed}\n\n` +
          `### 🔧 Posibles causas:\n` +
          `1. ❌ API Key de Gemini no configurada o inválida\n` +
          `2. ❌ Modelo '${modelUsed}' no disponible en tu región\n` +
          `3. ❌ Límite de cuota excedido\n` +
          `4. ❌ Problemas de conectividad con Google AI\n\n` +
          `### 📋 Procesos encontrados: ${procResult.processes?.length || 0}\n\n` +
          `**Nota:** La IA no está activa. Verifica la configuración de GOOGLE_API_KEY en el backend.`;
        
        logger.error(`Chatbot error: ${geminiError.message}`);
      }

      // Respuesta compuesta compatible con el frontend (useChatbot)
      const responseObj = {
        response: (aiText && isSeace) ? aiText : baseResponse,
        metadata: procResult.metadata || {},
        sources,
        relevant_processes: (procResult.processes || []).map(p => p.id),
        model_used: modelUsed,
        personalized: !!userContext
      };

      const responseTime = Date.now() - startTime;

      // Guardar log
      await ChatbotLog.create({
        session_id: sessionId,
        user_query: query,
        ai_response: responseObj.response,
        relevant_processes: responseObj.relevant_processes || [],
        response_time_ms: responseTime,
        model_used: responseObj.model_used
      });

      return {
        ...responseObj,
        session_id: sessionId,
        response_time_ms: responseTime
      };
    } catch (error) {
      logger.error(`Error en processQuery: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cargar contexto del perfil de usuario para personalización
   */
  async loadUserContext(userId) {
    try {
      const preferencia = await Preferencia.findOne({
        where: { user_id: userId }
      });

      if (!preferencia) {
        return {
          especialidad: 'no especificada',
          tecnologias: 'no especificadas',
          tamano_empresa: 'no especificado',
          regiones_foco: 'todas',
          monto_preferido: 'cualquiera',
          proyectos_preferidos: 'todos'
        };
      }

      return {
        especialidad: preferencia.carrera || 'no especificada',
        tecnologias: preferencia.tecnologias && preferencia.tecnologias.length > 0 
          ? preferencia.tecnologias.join(', ') 
          : 'no especificadas',
        tamano_empresa: preferencia.tamano_empresa || 'no especificado',
        regiones_foco: preferencia.regiones_interes && preferencia.regiones_interes.length > 0
          ? preferencia.regiones_interes.join(', ')
          : 'todas',
        monto_preferido: (preferencia.monto_min && preferencia.monto_max)
          ? `${preferencia.monto_min} - ${preferencia.monto_max} soles`
          : 'cualquiera',
        proyectos_preferidos: preferencia.tipos_proyecto && preferencia.tipos_proyecto.length > 0
          ? preferencia.tipos_proyecto.join(', ')
          : 'todos'
      };
    } catch (error) {
      logger.error(`Error en loadUserContext: ${error.message}`);
      return null;
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