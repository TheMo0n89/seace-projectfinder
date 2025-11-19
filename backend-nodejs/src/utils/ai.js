/**
 * Utilidad de IA (Gemini) para el chatbot
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../config/logger');

function getModelName() {
  // Permite usar configuración desde DB en el futuro; por ahora default estable
  const envModel = process.env.GEMINI_MODEL || process.env.GOOGLE_GEMINI_MODEL;
  // Usar gemini-1.5-pro o gemini-pro como fallback
  return envModel || 'gemini-2.5-flash';
}

function getClient() {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Falta la API key de Google Gemini (GOOGLE_API_KEY)');
  }
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Genera una respuesta usando Gemini con contexto de procesos y perfil de usuario
 * @param {string} userQuery
 * @param {{ processes: Array, metadata: Object, userContext: Object }} context
 * @returns {Promise<string>} respuesta del modelo
 */
async function generateChatResponse(userQuery, context = {}) {
  try {
    const client = getClient();
    const model = client.getGenerativeModel({ model: getModelName() });

    const processes = Array.isArray(context.processes) ? context.processes : [];
    const metadata = context.metadata || {};
    const userContext = context.userContext || null;

    const processesText = processes.map((p, i) => {
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const procesoUrl = `${baseUrl}/process/${p.id}`;
      const montoDisplay = p.montoFormateado ? p.montoFormateado : `${p.monto || 'N/A'} ${p.moneda || 'Soles'}`;
      const escalaInfo = p.escala ? ` [ESCALA: ${p.escala.toUpperCase()}]` : '';
      return `(${i + 1}) ${p.nomenclatura || p.descripcion || 'Proceso'} | entidad: ${p.entidad} | tipo: ${p.tipo} | objeto: ${p.objeto_contratacion || 'N/A'} | monto: ${montoDisplay}${escalaInfo} | fecha: ${p.fecha || ''} | URL_COMPLETA: ${procesoUrl}`;
    }).join('\n');

    // Construir contexto del usuario si está disponible
    const userContextText = userContext ? [
      '',
      '[CONTEXTO DEL USUARIO]',
      `- Especialidad: ${userContext.especialidad}`,
      `- Tecnologías: ${userContext.tecnologias}`,
      `- Tamaño empresa: ${userContext.tamano_empresa}`,
      `- Regiones foco: ${userContext.regiones_foco}`,
      `- Monto preferido: ${userContext.monto_preferido}`,
      `- Proyectos preferidos: ${userContext.proyectos_preferidos}`,
      '',
      'Usa este contexto para personalizar la respuesta, destacando procesos que coincidan con el expertise del usuario.',
      'Si encuentras procesos que requieren tecnologías que el usuario domina, menciónalo explícitamente.',
      ''
    ].join('\n') : '';

    // Detectar si se usó fallback o búsqueda por patrón
    const usedFallback = metadata.usedFallback || false;
    const fallbackMessage = metadata.fallbackMessage || '';
    const busquedaPorPatron = metadata.busquedaPorPatron || false;
    const procesosAgrupados = metadata.procesosAgrupados || null;

    // Construir sección especial para búsqueda por patrón de monto
    let patronSection = '';
    if (busquedaPorPatron && procesosAgrupados) {
      patronSection = [
        '⚠️ **IMPORTANTE:** Se encontraron procesos en diferentes escalas monetarias:',
        procesosAgrupados.millones > 0 ? `- 💰 ${procesosAgrupados.millones} proceso(s) en **MILLONES** (más probable)` : '',
        procesosAgrupados.miles > 0 ? `- 💵 ${procesosAgrupados.miles} proceso(s) en **MILES**` : '',
        procesosAgrupados.cientos > 0 ? `- 💳 ${procesosAgrupados.cientos} proceso(s) en **CIENTOS**` : '',
        procesosAgrupados.unidades > 0 ? `- 🪙 ${procesosAgrupados.unidades} proceso(s) en **UNIDADES**` : '',
        '',
        '**Agrupé los resultados por escala. Los procesos en MILLONES suelen ser los más comunes en SEACE.**',
        ''
      ].filter(line => line !== '').join('\n');
    }

    const prompt = [
      'Actúa como asistente experto en contratación pública peruana (SEACE).',
      'Responde de forma estructurada y profesional usando este formato:',
      '',
      '## 🔍 Resultado de Búsqueda',
      busquedaPorPatron ? '[Indica que encontraste procesos en diferentes escalas monetarias]' : (usedFallback ? fallbackMessage : '[Breve resumen de lo encontrado]'),
      '',
      patronSection,
      usedFallback && !busquedaPorPatron ? '⚠️ **Nota importante:** Los criterios completos no arrojaron resultados, por lo que se muestran procesos basados únicamente en tu especialidad.' : '',
      '',
      busquedaPorPatron ? '### 📊 Procesos Agrupados por Escala (ordenados por relevancia):' : '### 📄 Procesos Relevantes:',
      busquedaPorPatron ? 'Agrupa los procesos por escala (MILLONES primero, luego MILES, etc.) y para cada uno usa este formato:' : 'Para cada proceso relevante, usa este formato:',
      '• **[Nomenclatura]** - [Breve descripción]',
      '  - Entidad: [nombre]',
      busquedaPorPatron ? '  - Monto: [monto formateado con su escala - ej: "12.70 millones de Soles"]' : '  - Monto: [monto] [moneda]',
      '  - Tipo: [tipo]',
      '  - [Ver proceso](URL_COMPLETA)',
      '',
      busquedaPorPatron ? '💡 **Consejo:** Revisa primero los procesos en MILLONES, ya que son los más comunes en contratación pública.' : '',
      '',
      '⚠️ IMPORTANTE: Usa los URLS EXACTOS de los procesos listados abajo. NO los modifiques.',
      '',
      userContextText,
      'Si el usuario tiene perfil completado, SIEMPRE prioriza procesos que coincidan con su especialidad y regiones.',
      'Si la consulta es genérica, muestra procesos variados pero relevantes.',
      usedFallback && !busquedaPorPatron ? 'IMPORTANTE: Indica claramente al usuario que la búsqueda se realizó SOLO por especialidad debido a que no hubo coincidencias con todos los criterios.' : '',
      '',
      `Consulta del usuario: ${userQuery}`,
      '',
      'Contexto de procesos disponibles:',
      processesText || '(Sin procesos relevantes encontrados)',
      '',
      '### 💡 Recomendaciones',
      busquedaPorPatron ? '[Sugiere al usuario que especifique mejor la escala si busca algo más específico]' : (usedFallback ? '[Sugiere al usuario ampliar criterios o revisar sus preferencias]' : '[Consejos para participar o afinar la búsqueda]')
    ].join('\n');

    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.() || result?.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text) {
      throw new Error('Gemini no generó respuesta válida');
    }

    return text.trim();
  } catch (error) {
    logger.error(`❌ Gemini ERROR: ${error.message}`);
    // Propagar el error con detalles específicos
    throw new Error(`[GEMINI FALLÓ] ${error.message}`);
  }
}

module.exports = {
  generateChatResponse,
  getModelName
};