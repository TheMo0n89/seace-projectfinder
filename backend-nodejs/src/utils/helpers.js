/**
 * Utilidades de formateo y validación
 */

/**
 * Formatear fecha a ISO string
 */
function formatDateToISO(date) {
  if (!date) return null;
  if (date instanceof Date) {
    return date.toISOString();
  }
  return new Date(date).toISOString();
}

/**
 * Validar UUID
 */
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Sanitizar texto
 */
function sanitizeText(text) {
  if (!text) return '';
  return text.trim().replace(/\s+/g, ' ');
}

/**
 * Truncar texto
 */
function truncateText(text, maxLength = 100) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Validar email
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generar ID único
 */
function generateUniqueId(prefix = '') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}${timestamp}_${random}`;
}

/**
 * Parsear filtros de query
 */
function parseQueryFilters(query) {
  const filters = {};
  
  if (query.estado) filters.estado = query.estado;
  if (query.departamento) filters.departamento = query.departamento;
  if (query.entidad) filters.entidad = query.entidad;
  if (query.tipo_proceso) filters.tipo_proceso = query.tipo_proceso;
  if (query.categoria_proyecto) filters.categoria_proyecto = query.categoria_proyecto;
  
  if (query.monto_min) filters.monto_min = parseFloat(query.monto_min);
  if (query.monto_max) filters.monto_max = parseFloat(query.monto_max);
  
  if (query.fecha_desde) filters.fecha_desde = new Date(query.fecha_desde);
  if (query.fecha_hasta) filters.fecha_hasta = new Date(query.fecha_hasta);
  
  return filters;
}

/**
 * Construir opciones de paginación
 */
function buildPaginationOptions(query) {
  const page = parseInt(query.page) || 1;
  const size = parseInt(query.size) || 10;
  
  const limit = Math.min(size, 100); // Máximo 100
  const offset = (page - 1) * limit;
  
  return { limit, offset, page, size: limit };
}

/**
 * Formatear respuesta paginada
 */
function formatPaginatedResponse(data, count, page, size) {
  const totalPages = Math.ceil(count / size);
  
  return {
    data,
    pagination: {
      total: count,
      page,
      size,
      total_pages: totalPages,
      has_next: page < totalPages,
      has_prev: page > 1
    }
  };
}

/**
 * Calcular similitud entre textos (Levenshtein distance)
 */
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function getEditDistance(s1, s2) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();
  
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

/**
 * Sleep/delay asíncrono
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry con backoff exponencial
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = baseDelay * Math.pow(2, i);
      await sleep(delay);
    }
  }
}

/**
 * Agrupar array por clave
 */
function groupBy(array, key) {
  return array.reduce((result, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
}

/**
 * Remover duplicados de array
 */
function removeDuplicates(array, key) {
  const seen = new Set();
  return array.filter(item => {
    const itemKey = typeof key === 'function' ? key(item) : item[key];
    if (seen.has(itemKey)) {
      return false;
    }
    seen.add(itemKey);
    return true;
  });
}

module.exports = {
  formatDateToISO,
  isValidUUID,
  sanitizeText,
  truncateText,
  isValidEmail,
  generateUniqueId,
  parseQueryFilters,
  buildPaginationOptions,
  formatPaginatedResponse,
  calculateSimilarity,
  sleep,
  retryWithBackoff,
  groupBy,
  removeDuplicates
};