import api from './api';
import logger from './logger';

// Servicios para procesos
export const procesosService = {
  // Obtener lista de procesos con filtros y paginación
  getList: async (params = {}) => {
    const startTime = performance.now();
    try {
      logger.debug('Fetching processes list', { params });
      const response = await api.get('/procesos/', { params });
      
      const duration = performance.now() - startTime;
      logger.apiCall('GET', '/procesos/', response.status, duration, { 
        params, 
        count: response.data?.length || 0 
      });
      
      return response.data;
    } catch (error) {
      const duration = performance.now() - startTime;
      const status = error.response?.status || 0;
      
      logger.apiCall('GET', '/procesos/', status, duration, { 
        params, 
        error: error.message 
      });
      
      throw new Error(error.response?.data?.message || 'Error obteniendo procesos');
    }
  },

  // Obtener detalle de un proceso
  getById: async (procesoId) => {
    try {
      const response = await api.get(`/procesos/${procesoId}`);
      // El backend ahora retorna directamente el proceso sin wrapping
      // Si viene envuelto en { data: proceso }, extraer solo el proceso
      return response.data?.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error obteniendo proceso');
    }
  },

  // Obtener anexos de un proceso (no implementado aún)
  getAnexos: async (procesoId) => {
    try {
      return [];
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error obteniendo anexos');
    }
  },

  // Búsqueda de texto en procesos
  search: async (query, params = {}) => {
    try {
      const response = await api.get('/procesos/search/text', {
        params: { q: query, ...params }
      });
      // El backend retorna directamente { items, total, page, size, pages }
      // Si viene envuelto, extraer
      return response.data?.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error en búsqueda');
    }
  },

  // Obtener estadísticas de procesos
  getStats: async () => {
    try {
      const response = await api.get('/procesos/stats/overview');
      // El backend retorna directamente las stats
      return response.data?.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error obteniendo estadísticas');
    }
  },

  // Obtener procesos TI más recientes (simplificado)
  getLatestTI: async (limit = 10) => {
    try {
      const response = await api.get('/procesos/', {
        params: { 
          limit,
          categoria_proyecto: 'TI',
          sort_by: 'fecha_publicacion',
          sort_order: 'desc'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error obteniendo procesos TI');
    }
  }
};

// Servicios para chatbot
export const chatbotService = {
  // Enviar consulta al chatbot
  query: async (queryData) => {
    const startTime = performance.now();
    try {
      const response = await api.post('/chatbot/query', queryData);
      const duration = performance.now() - startTime;
      logger.apiCall('POST', '/chatbot/query', response.status, duration, { query: queryData.query });
      return { data: response.data?.data || response.data };
    } catch (error) {
      const duration = performance.now() - startTime;
      const status = error.response?.status || 0;
      if (status === 401 || status === 403) {
        logger.warn('Chatbot auth failed (posible API key inválida)', {
          event_type: 'chatbot_auth',
          status,
          message: error.response?.data?.message || error.message
        });
      }
      logger.apiCall('POST', '/chatbot/query', status, duration, { error: error.message });
      throw new Error(error.response?.data?.message || 'Error en consulta del chatbot');
    }
  },

  // Obtener sugerencias de consultas
  getSuggestions: async () => {
    const startTime = performance.now();
    try {
      const response = await api.get('/chatbot/suggestions');
      const duration = performance.now() - startTime;
      logger.apiCall('GET', '/chatbot/suggestions', response.status, duration, {});
      return { suggestions: response.data?.data || response.data };
    } catch (error) {
      const duration = performance.now() - startTime;
      const status = error.response?.status || 0;
      if (status === 401 || status === 403) {
        logger.warn('Chatbot suggestions auth failed (posible API key inválida)', {
          event_type: 'chatbot_auth',
          status,
          message: error.response?.data?.message || error.message
        });
      }
      logger.apiCall('GET', '/chatbot/suggestions', status, duration, { error: error.message });
      throw new Error(error.response?.data?.message || 'Error obteniendo sugerencias');
    }
  },

  // Obtener historial de una sesión
  getSessionHistory: async (sessionId) => {
    try {
      const response = await api.get(`/chatbot/session/${sessionId}/history`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error obteniendo historial');
    }
  },

  // Obtener estadísticas de uso del chatbot
  getStats: async () => {
    try {
      const response = await api.get('/chatbot/stats/usage');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error obteniendo estadísticas del chatbot');
    }
  }
};

// Servicios para recomendaciones
export const recomendacionesService = {
  // Obtener recomendaciones de un proceso
  getByProceso: async (procesoId) => {
    try {
      const response = await api.get(`/recomendaciones/${procesoId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error obteniendo recomendaciones');
    }
  },

  // Generar recomendaciones para un proceso
  generate: async (procesoId, forceRegenerate = false) => {
    try {
      const response = await api.post(`/recomendaciones/${procesoId}/generate`, null, {
        params: { force_regenerate: forceRegenerate }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error generando recomendaciones');
    }
  },

  // Obtener recomendación específica de MVP
  getMVP: async (procesoId) => {
    try {
      const response = await api.get(`/recomendaciones/${procesoId}/mvp`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error obteniendo MVP');
    }
  },

  // Obtener recomendación específica de Sprint 1
  getSprint1: async (procesoId) => {
    try {
      const response = await api.get(`/recomendaciones/${procesoId}/sprint1`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error obteniendo Sprint 1');
    }
  },

  // Obtener recomendación de stack tecnológico
  getStackTech: async (procesoId) => {
    try {
      const response = await api.get(`/recomendaciones/${procesoId}/stack-tech`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error obteniendo stack tecnológico');
    }
  },

  // Limpiar recomendaciones de un proceso
  clear: async (procesoId) => {
    try {
      const response = await api.delete(`/recomendaciones/${procesoId}/clear`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error limpiando recomendaciones');
    }
  }
};

// Servicios para dashboard
export const dashboardService = {
  // Obtener URL del dashboard Power BI
  getUrl: async () => {
    try {
      const response = await api.get('/dashboard/dashboard');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error obteniendo dashboard');
    }
  },

  // Obtener configuración del dashboard
  getConfig: async () => {
    try {
      const response = await api.get('/dashboard/dashboard/config');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error obteniendo configuración');
    }
  }
};

// Servicios de administración
export const adminService = {
  // Gestión de usuarios
  getUsers: async (params = {}) => {
    try {
      const response = await api.get('/admin/users', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error obteniendo usuarios');
    }
  },

  getUser: async (userId) => {
    try {
      const response = await api.get(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error obteniendo usuario');
    }
  },

  createUser: async (userData) => {
    try {
      const response = await api.post('/admin/users', userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error creando usuario');
    }
  },

  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(`/admin/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error actualizando usuario');
    }
  },

  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error eliminando usuario');
    }
  },

  // Gestión de configuración
  getConfigurations: async () => {
    try {
      const response = await api.get('/admin/config');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error obteniendo configuraciones');
    }
  },

  getConfiguration: async (clave) => {
    try {
      const response = await api.get(`/admin/config/${clave}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error obteniendo configuración');
    }
  },

  setConfiguration: async (configData) => {
    try {
      const response = await api.post('/admin/config', configData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error guardando configuración');
    }
  },

  deleteConfiguration: async (clave) => {
    try {
      const response = await api.delete(`/admin/config/${clave}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error eliminando configuración');
    }
  },

  // Estadísticas del sistema
  getSystemStats: async () => {
    try {
      const response = await api.get('/admin/stats/system');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error obteniendo estadísticas');
    }
  },

  // Mantenimiento
  cleanSystem: async (days = 30) => {
    try {
      const response = await api.post('/admin/maintenance/clean', null, {
        params: { days }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error en limpieza del sistema');
    }
  }
};

// Servicios de ETL
export const etlService = {
  // Iniciar scraping
  startScraping: async (params = {}) => {
    try {
      const response = await api.post('/etl/scraping/start', params);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error iniciando scraping');
    }
  },

  // Gestión de tareas de scraping
  getScrapingTasks: async (params = {}) => {
    try {
      const response = await api.get('/etl/scraping/tasks', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error obteniendo tareas');
    }
  },

  getScrapingTask: async (taskId) => {
    try {
      const response = await api.get(`/etl/scraping/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error obteniendo tarea');
    }
  },

  createScrapingTask: async (taskData) => {
    try {
      const response = await api.post('/etl/scraping/tasks', taskData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error creando tarea');
    }
  },

  updateScrapingTask: async (taskId, taskData) => {
    try {
      const response = await api.put(`/etl/scraping/tasks/${taskId}`, taskData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error actualizando tarea');
    }
  },

  // Logs de ETL
  getETLLogs: async (params = {}) => {
    try {
      const response = await api.get('/etl/logs', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error obteniendo logs');
    }
  },

  // Estadísticas de ETL
  getETLStats: async () => {
    try {
      const response = await api.get('/etl/stats');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error obteniendo estadísticas');
    }
  },

  // Sincronizar procesos
  syncProcesses: async (params = {}) => {
    try {
      const response = await api.post('/etl/sync', params);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error en sincronización');
    }
  },

  // Generar embeddings
  generateEmbeddings: async (params = {}) => {
    try {
      const response = await api.post('/etl/embeddings/generate', params);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error generando embeddings');
    }
  }
};

// Servicios de autenticación
export const authService = {
  // Obtener lista de usuarios
  getUsers: async () => {
    try {
      const response = await api.get('/auth/users');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error obteniendo usuarios');
    }
  },

  // Obtener perfil del usuario actual
  getProfile: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error obteniendo perfil');
    }
  },

  // Actualizar perfil
  updateProfile: async (userData) => {
    try {
      const response = await api.put('/auth/me', userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error actualizando perfil');
    }
  },

  // Cambiar contraseña
  changePassword: async (passwordData) => {
    try {
      const response = await api.put('/auth/me/password', passwordData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error cambiando contraseña');
    }
  },

  // Registrar usuario
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error registrando usuario');
    }
  },

  // Login
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error en login');
    }
  },

  // Logout
  logout: async () => {
    try {
      const response = await api.post('/auth/logout');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error en logout');
    }
  }
};

// Utilidades
export const utils = {
  // Formatear moneda peruana
  formatCurrency: (amount, currency = 'PEN') => {
    if (!amount) return 'No especificado';
    
    // Normalizar nombres de moneda de la BD a códigos ISO
    const currencyMap = {
      'Soles': 'PEN',
      'soles': 'PEN',
      'SOLES': 'PEN',
      'PEN': 'PEN',
      'S/': 'PEN',
      'Dólares': 'USD',
      'dolares': 'USD',
      'dólares': 'USD',
      'DÓLARES': 'USD',
      'USD': 'USD',
      'US$': 'USD',
      'Euros': 'EUR',
      'euros': 'EUR',
      'EUROS': 'EUR',
      'EUR': 'EUR',
      '€': 'EUR'
    };
    
    // Obtener código ISO de moneda, por defecto PEN
    const currencyCode = currencyMap[currency] || 'PEN';
    
    const formatter = new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2
    });
    
    return formatter.format(amount);
  },

  // Formatear fecha
  formatDate: (dateString) => {
    if (!dateString) return 'No especificado';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  },

  // Formatear fecha corta
  formatDateShort: (dateString) => {
    if (!dateString) return 'No especificado';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  },

  // Truncar texto
  truncateText: (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  },

  // Generar session ID para chatbot
  generateSessionId: () => {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  // Validar email
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Debounce para búsquedas
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
};
