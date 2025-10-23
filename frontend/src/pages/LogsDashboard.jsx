import React, { useState, useEffect } from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import { useLogger } from '../services/logger';

const LogsDashboard = () => {
  const logger = useLogger();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    level: '',
    source: '',
    limit: 100
  });
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);

  // Función para obtener logs
  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        logger.warn('No access token found for logs dashboard');
        return;
      }

      const params = new URLSearchParams();
      if (filters.level) params.append('level', filters.level);
      if (filters.source) params.append('source', filters.source);
      params.append('limit', filters.limit.toString());

      const response = await fetch(`/api/v1/logs/stream?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        logger.debug('Logs fetched successfully', { count: data.logs?.length || 0 });
      } else {
        logger.error('Failed to fetch logs', { status: response.status });
      }
    } catch (error) {
      logger.error('Error fetching logs', { error: error.message });
    }
  };

  // Función para obtener estadísticas
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/v1/logs/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      logger.error('Error fetching log stats', { error: error.message });
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchLogs(), fetchStats()]);
      setLoading(false);
    };

    loadData();
    logger.userAction('logs_dashboard_opened');
  }, [filters]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchLogs();
        fetchStats();
      }, 5000); // Refresh cada 5 segundos
      setRefreshInterval(interval);
      logger.userAction('logs_auto_refresh_enabled');
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
        logger.userAction('logs_auto_refresh_disabled');
      }
    }

    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [autoRefresh]);

  // Función para formatear timestamp
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Función para obtener color del nivel de log
  const getLevelColor = (level) => {
    const colors = {
      DEBUG: 'text-gray-600',
      INFO: 'text-blue-600',
      WARNING: 'text-yellow-600',
      ERROR: 'text-red-600',
      CRITICAL: 'text-red-800 font-bold'
    };
    return colors[level] || 'text-gray-600';
  };

  // Función para obtener logs locales
  const showLocalLogs = () => {
    const localLogs = logger.getLocalLogs();
    setLogs(localLogs);
    logger.userAction('logs_show_local');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando logs...</span>
      </div>
    );
  }

  return (
    <ErrorBoundary componentName="LogsDashboard" fallbackMessage="Error loading logs dashboard">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📊 Dashboard de Logs del Sistema
          </h1>
          <p className="text-gray-600">
            Monitoreo en tiempo real de la actividad del sistema y errores
          </p>
        </div>

        {/* Estadísticas */}
        {stats.total_logs !== undefined && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-800 mb-1">Total de Logs</h3>
              <p className="text-2xl font-bold text-blue-900">{stats.total_logs}</p>
              <p className="text-xs text-blue-600">Últimas {stats.period_hours}h</p>
            </div>

            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h3 className="text-sm font-medium text-red-800 mb-1">Tasa de Errores</h3>
              <p className="text-2xl font-bold text-red-900">{stats.error_rate}%</p>
              <p className="text-xs text-red-600">
                {stats.by_level?.ERROR + stats.by_level?.CRITICAL} errores
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-sm font-medium text-green-800 mb-1">Backend</h3>
              <p className="text-2xl font-bold text-green-900">{stats.by_source?.backend || 0}</p>
              <p className="text-xs text-green-600">logs del servidor</p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h3 className="text-sm font-medium text-purple-800 mb-1">Frontend</h3>
              <p className="text-2xl font-bold text-purple-900">{stats.by_source?.frontend || 0}</p>
              <p className="text-xs text-purple-600">logs del cliente</p>
            </div>
          </div>
        )}

        {/* Controles */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Filtro por nivel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nivel
              </label>
              <select 
                value={filters.level}
                onChange={(e) => setFilters({...filters, level: e.target.value})}
                className="border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="">Todos</option>
                <option value="DEBUG">DEBUG</option>
                <option value="INFO">INFO</option>
                <option value="WARNING">WARNING</option>
                <option value="ERROR">ERROR</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            {/* Filtro por fuente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fuente
              </label>
              <select 
                value={filters.source}
                onChange={(e) => setFilters({...filters, source: e.target.value})}
                className="border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="">Todas</option>
                <option value="backend">Backend</option>
                <option value="frontend">Frontend</option>
              </select>
            </div>

            {/* Límite */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Límite
              </label>
              <select 
                value={filters.limit}
                onChange={(e) => setFilters({...filters, limit: parseInt(e.target.value)})}
                className="border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={500}>500</option>
              </select>
            </div>

            {/* Auto-refresh */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="auto-refresh"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="auto-refresh" className="text-sm font-medium text-gray-700">
                Auto-refresh (5s)
              </label>
            </div>

            {/* Botones */}
            <div className="flex gap-2">
              <button
                onClick={() => { fetchLogs(); fetchStats(); }}
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                🔄 Actualizar
              </button>
              
              <button
                onClick={showLocalLogs}
                className="px-4 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
              >
                📱 Logs Locales
              </button>
            </div>
          </div>
        </div>

        {/* Lista de logs */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Logs Recientes ({logs.length})
            </h2>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No se encontraron logs con los filtros actuales
              </div>
            ) : (
              logs.map((log, index) => (
                <div 
                  key={index}
                  className="p-3 border-b border-gray-100 hover:bg-gray-50 font-mono text-sm"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-gray-500 whitespace-nowrap">
                      {formatTimestamp(log.timestamp)}
                    </span>
                    
                    <span className={`font-semibold whitespace-nowrap ${getLevelColor(log.level)}`}>
                      {log.level}
                    </span>

                    <span className="text-gray-600 whitespace-nowrap">
                      [{log.source || 'backend'}]
                    </span>

                    <span className="flex-1 break-words">
                      {log.message}
                    </span>

                    {log.request_id && (
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {log.request_id.slice(0, 8)}
                      </span>
                    )}
                  </div>

                  {/* Detalles extras */}
                  {log.extra && Object.keys(log.extra).length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer">
                        Ver detalles
                      </summary>
                      <pre className="mt-1 text-xs text-gray-600 bg-gray-50 p-2 rounded whitespace-pre-wrap">
                        {JSON.stringify(log.extra, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer con información adicional */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>
            Dashboard de logs actualizado automáticamente. 
            Los logs se almacenan con rotación automática y compresión.
          </p>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default LogsDashboard;