/**
 * Sistema centralizado de logging para el frontend
 * Maneja logs locales, envío al servidor y persistencia
 */

class Logger {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.userId = this.getUserId();
    this.logBuffer = [];
    this.maxBufferSize = 100;
    this.flushInterval = 30000; // 30 segundos
    this.apiUrl = '/api/v1/logs';
    
    this.setupLogCapture();
    this.startPeriodicFlush();
    
    // Log de inicio de sesión
    this.info('Frontend logger initialized', {
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    });
  }

  generateSessionId() {
    return 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  getUserId() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.id || 'anonymous';
    } catch {
      return 'anonymous';
    }
  }

  createLogEntry(level, message, extra = {}) {
    return {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      sessionId: this.sessionId,
      userId: this.userId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      source: 'frontend',
      extra: {
        ...extra,
        stack: level === 'error' ? new Error().stack : undefined
      }
    };
  }

  log(level, message, extra = {}) {
    const logEntry = this.createLogEntry(level, message, extra);
    
    // Log a consola en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console[level] ? console[level](message, extra) : console.log(message, extra);
    }

    // Agregar al buffer
    this.logBuffer.push(logEntry);

    // Flush si es crítico o buffer lleno
    if (level === 'error' || this.logBuffer.length >= this.maxBufferSize) {
      this.flush();
    }

    // Persistir localmente para errores críticos
    if (level === 'error') {
      this.persistLocally(logEntry);
    }
  }

  debug(message, extra = {}) {
    this.log('debug', message, extra);
  }

  info(message, extra = {}) {
    this.log('info', message, extra);
  }

  warn(message, extra = {}) {
    this.log('warn', message, extra);
  }

  error(message, extra = {}) {
    this.log('error', message, extra);
  }

  // Logging especializado para eventos de usuario
  userAction(action, details = {}) {
    this.info(`User action: ${action}`, {
      action_type: 'user_action',
      action,
      details,
      timestamp: new Date().toISOString()
    });
  }

  // Logging para navegación
  navigation(from, to) {
    this.info('Navigation', {
      event_type: 'navigation',
      from,
      to,
      timestamp: new Date().toISOString()
    });
  }

  // Logging para API calls
  apiCall(method, url, status, responseTime, data = {}) {
    const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
    
    this.log(level, `API ${method} ${url} - ${status}`, {
      event_type: 'api_call',
      method,
      url,
      status,
      response_time: responseTime,
      data
    });
  }

  // Logging para errores de componentes React
  componentError(componentName, error, errorInfo) {
    this.error(`Component error in ${componentName}`, {
      event_type: 'component_error',
      component: componentName,
      error_message: error.message,
      error_stack: error.stack,
      error_info: errorInfo,
      props: errorInfo.componentStack
    });
  }

  // Flush logs al servidor (TEMPORALMENTE SOLO localStorage)
  async flush() {
    if (this.logBuffer.length === 0) return;

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    // TEMPORALMENTE: Solo persistir localmente para evitar 404s
    // TODO: Rehabilitar envío al servidor cuando /api/v1/logs esté disponible
    try {
      logsToSend.forEach(log => {
        this.persistLocally(log);
      });
      console.log(`Logger: Persisted ${logsToSend.length} logs locally (server disabled)`);
    } catch (error) {
      console.error('Failed to persist logs locally:', error);
      // Reintroducir logs al buffer si falla el localStorage
      this.logBuffer.unshift(...logsToSend);
    }

    /* CÓDIGO ORIGINAL PARA CUANDO SE REHABILITE EL SERVIDOR:
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthToken()
        },
        body: JSON.stringify({
          logs: logsToSend,
          source: 'frontend'
        })
      });

      if (!response.ok) {
        throw new Error(`Logging API error: ${response.status}`);
      }
    } catch (error) {
      // En caso de error, reintroducir logs al buffer
      this.logBuffer.unshift(...logsToSend);
      
      // Log de error en localStorage como fallback
      this.persistLocally({
        level: 'ERROR',
        message: 'Failed to send logs to server',
        error: error.message,
        timestamp: new Date().toISOString(),
        failedLogs: logsToSend.length
      });
    }
    */
  }

  getAuthToken() {
    try {
      return localStorage.getItem('access_token') || '';
    } catch {
      return '';
    }
  }

  persistLocally(logEntry) {
    try {
      const existingLogs = JSON.parse(localStorage.getItem('frontend_logs') || '[]');
      existingLogs.push(logEntry);
      
      // Mantener solo los últimos 50 logs
      const recentLogs = existingLogs.slice(-50);
      localStorage.setItem('frontend_logs', JSON.stringify(recentLogs));
    } catch (error) {
      console.error('Failed to persist log locally:', error);
    }
  }

  startPeriodicFlush() {
    // TEMPORALMENTE DESHABILITADO: Evitar 404s hasta que el backend esté listo
    // TODO: Rehabilitar cuando /api/v1/logs esté implementado
    /*
    setInterval(() => {
      if (this.logBuffer.length > 0) {
        this.flush();
      }
    }, this.flushInterval);
    */
    console.log('Logger: Periodic flush disabled - logging to localStorage only');
  }

  setupLogCapture() {
    // Capturar errores globales
    window.addEventListener('error', (event) => {
      this.error('Global error', {
        event_type: 'global_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.message || event.message,
        stack: event.error?.stack
      });
    });

    // Capturar Promise rejections no manejadas
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled promise rejection', {
        event_type: 'unhandled_rejection',
        reason: event.reason,
        promise: event.promise
      });
    });

    // Capturar cambios de visibilidad para logging de sesión
    document.addEventListener('visibilitychange', () => {
      this.info(`Page visibility changed: ${document.visibilityState}`, {
        event_type: 'visibility_change',
        state: document.visibilityState
      });
    });

    // Log antes de cerrar la página
    window.addEventListener('beforeunload', () => {
      this.flush(); // Envío síncrono de logs pendientes
    });
  }

  // Obtener logs locales para debugging
  getLocalLogs() {
    try {
      return JSON.parse(localStorage.getItem('frontend_logs') || '[]');
    } catch {
      return [];
    }
  }

  // Limpiar logs locales
  clearLocalLogs() {
    localStorage.removeItem('frontend_logs');
  }

  // Performance monitoring
  startPerformanceMonitor(name) {
    const startTime = performance.now();
    
    return {
      end: () => {
        const duration = performance.now() - startTime;
        this.info(`Performance: ${name}`, {
          event_type: 'performance',
          operation: name,
          duration_ms: Math.round(duration)
        });
        return duration;
      }
    };
  }
}

// Crear instancia global
const logger = new Logger();

// Hook para React components
export const useLogger = () => {
  return logger;
};

// Export default
export default logger;