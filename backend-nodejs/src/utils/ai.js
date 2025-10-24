/**
 * Utilidad de IA (Gemini) para el chatbot
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../config/logger');

function getModelName() {
  // Permite usar configuración desde DB en el futuro; por ahora default estable
  const envModel = process.env.GEMINI_MODEL || process.env.GOOGLE_GEMINI_MODEL;
  return envModel || 'gemini-1.5-flash';
}

function getClient() {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Falta la API key de Google Gemini (GOOGLE_API_KEY)');
  }
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Genera una respuesta usando Gemini con contexto de procesos
 * @param {string} userQuery
 * @param {{ processes: Array, metadata: Object }} context
 * @returns {Promise<string>} respuesta del modelo
 */
async function generateChatResponse(userQuery, context = {}) {
  try {
    const client = getClient();
    const model = client.getGenerativeModel({ model: getModelName() });

    const processes = Array.isArray(context.processes) ? context.processes : [];
    const metadata = context.metadata || {};

    const processesText = processes.map((p, i) => (
      `(${i + 1}) ${p.nomenclatura || p.descripcion || 'Proceso'} | entidad: ${p.entidad} | tipo: ${p.tipo} | monto: ${p.monto || 'N/A'} ${p.moneda || ''} | fecha: ${p.fecha || ''} | url: ${p.url}`
    )).join('\n');

    const prompt = [
      'Actúa como asistente experto en contratación pública peruana (SEACE).',
      'Responde de forma breve y clara. Si hay procesos relevantes, resume hallazgos y destaca criterios.',
      'Cita hasta 2 fuentes referenciando los procesos listados con su título y URL.',
      'No inventes datos; si no hay procesos relevantes, explica cómo afinar la búsqueda.',
      '',
      `Consulta del usuario: ${userQuery}`,
      '',
      'Contexto de procesos (si disponible):',
      processesText || '(Sin procesos relevantes encontrados)'
    ].join('\n');

    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.() || result?.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return (text || '').trim();
  } catch (error) {
    logger.warn(`Gemini: fallo al generar respuesta: ${error.message}`);
    return '';
  }
}

module.exports = {
  generateChatResponse,
  getModelName
};