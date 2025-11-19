import { useState, useEffect } from 'react';
import { etlService, procesosService } from '../services/seaceService';

export const useCustomScraping = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [operationId, setOperationId] = useState(null);
  
  // Estado para logs
  const [etlLogs, setEtlLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState(null);
  
  // Estado para procesos escaneados
  const [scrapedProcesses, setScrapedProcesses] = useState([]);
  const [processesLoading, setProcessesLoading] = useState(false);
  const [processesError, setProcessesError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  // Ejecutar scraping personalizado
  const runCustomScraping = async (params) => {
    try {
      setLoading(true);
      setError(null);
      
      // Mapear parámetros del formulario a los esperados por el backend
      const scrapingParams = {
        anio: params.anio || new Date().getFullYear().toString(),
        maxProcesses: params.maxProcesos || 100,
        useSelenium: params.useSelenium !== false
      };
      
      // Solo agregar parámetros si fueron especificados (no vacíos)
      if (params.descripcion && params.descripcion.trim().length > 0) {
        scrapingParams.keywords = params.descripcion.split(/[,\s]+/).filter(k => k.trim().length > 0);
      }
      
      if (params.objetoContratacion && params.objetoContratacion.trim().length > 0) {
        scrapingParams.objetoContratacion = params.objetoContratacion;
      }
      
      if (params.entidad && params.entidad.trim().length > 0) {
        scrapingParams.entidad = params.entidad;
      }
      
      if (params.tipoProceso && params.tipoProceso.trim().length > 0) {
        scrapingParams.tipoProceso = params.tipoProceso;
      }
      
      const response = await etlService.startScraping(scrapingParams);
      
      // Extraer operation_id de la respuesta
      const opId = response.data?.operation_id || response.operation_id;
      setOperationId(opId);
      
      // Guardar operation_id en sessionStorage para recuperar después de refresh
      if (opId) {
        sessionStorage.setItem('current_operation_id', opId);
        console.log('[useCustomScraping] Operación guardada en sessionStorage:', opId);
      }
      
      // IMPORTANTE: Setear result INMEDIATAMENTE para que ProgressBar se monte
      setResult(response.data || response);
      
      // Desactivar loading para permitir que ProgressBar se muestre
      setLoading(false);
      
      // Iniciar polling en background (sin await para no bloquear)
      if (opId) {
        pollOperationStatus(opId).catch(err => {
          console.error('Error en polling background:', err);
        });
      }
      
      return response;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };
  
  // Polling para verificar estado de la operación
  const pollOperationStatus = async (opId) => {
    try {
      let completed = false;
      let attempts = 0;
      const maxAttempts = 120; // 2 minutos máximo (con 1 segundo entre intentos)
      
      while (!completed && attempts < maxAttempts) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
        
        const logs = await fetchLogsByOperation(opId);
        // logs ya es un array de items
        if (logs && logs.length > 0) {
          const latestLog = logs[0];
          if (latestLog.status === 'completed' || latestLog.status === 'failed') {
            completed = true;
            // Limpiar sessionStorage cuando operación termina
            sessionStorage.removeItem('current_operation_id');
            console.log('[useCustomScraping] Operación terminada, sessionStorage limpiado');
            // Recargar la lista de logs para mostrar el estado actualizado
            await fetchEtlLogs();
          }
        }
      }
      
      // Actualizar lista de procesos cuando se completa
      await fetchScrapedProcesses();
      
    } catch (err) {
      console.error('Error durante polling:', err);
    }
  };

  // Obtener logs de ETL
  const fetchEtlLogs = async () => {
    try {
      setLogsLoading(true);
      setLogsError(null);
      
      const response = await etlService.getETLLogs({ size: 50 });
      
      // etlService.getETLLogs retorna response.data, que contiene { data: { items, total, etc } }
      const logs = response.data?.items || response.items || [];
      setEtlLogs(logs);
      return logs;
    } catch (err) {
      setLogsError(err.message);
    } finally {
      setLogsLoading(false);
    }
  };
  
  // Obtener logs por operación específica
  const fetchLogsByOperation = async (opId) => {
    if (!opId) return null;
    
    try {
      const response = await etlService.getETLLogs({ 
        operation_id: opId,
        size: 10 
      });
      // Retornar los items correctamente
      return response.data?.items || response.items || [];
    } catch (err) {
      console.error('Error obteniendo logs por operación:', err);
      return null;
    }
  };
  
  // Obtener procesos escaneados con filtros y paginación
  const fetchScrapedProcesses = async (params = {}) => {
    try {
      setProcessesLoading(true);
      setProcessesError(null);
      
      const response = await procesosService.getList({
        page: pagination.page,
        size: pagination.limit,
        sort_by: 'fecha_publicacion',
        sort_order: 'desc',
        ...params
      });
      
      // La respuesta YA viene desenvuelta (sin response.data) porque procesosService.getList retorna response.data directamente
      const processes = response.items || [];
      setScrapedProcesses(processes);
      
      // Actualizar paginación con los datos directos (no dentro de response.data)
      setPagination({
        page: response.page || pagination.page,
        limit: response.size || pagination.limit,
        total: response.total || 0,
        pages: response.pages || 0
      });
      
      return response;
    } catch (err) {
      setProcessesError(err.message);
    } finally {
      setProcessesLoading(false);
    }
  };
  
  // Cambiar página
  const changePage = async (newPage) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
    
    await fetchScrapedProcesses({ page: newPage });
  };
  
  // Efecto para cargar logs al iniciar Y recuperar operación en curso
  useEffect(() => {
    const initializeData = async () => {
      // Cargar logs y procesos
      await fetchEtlLogs();
      await fetchScrapedProcesses();
      
      // Verificar si hay una operación en curso guardada en sessionStorage
      const savedOperationId = sessionStorage.getItem('current_operation_id');
      if (savedOperationId) {
        console.log('[useCustomScraping] Recuperando operación desde sessionStorage:', savedOperationId);
        
        // Verificar el estado de la operación en el backend
        try {
          const logs = await fetchLogsByOperation(savedOperationId);
          if (logs && logs.length > 0) {
            const latestLog = logs[0];
            
            // Si la operación está corriendo, restaurar el estado
            if (latestLog.status === 'running' || latestLog.status === 'started') {
              console.log('[useCustomScraping] Operación activa encontrada, restaurando estado');
              setOperationId(savedOperationId);
              setResult({
                operation_id: savedOperationId,
                status: latestLog.status,
                message: 'Operación recuperada después de refresh'
              });
            } else {
              // Operación ya terminó, limpiar sessionStorage
              console.log('[useCustomScraping] Operación ya completada, limpiando sessionStorage');
              sessionStorage.removeItem('current_operation_id');
            }
          } else {
            // No se encontró la operación, limpiar
            sessionStorage.removeItem('current_operation_id');
          }
        } catch (err) {
          console.error('[useCustomScraping] Error verificando operación guardada:', err);
          sessionStorage.removeItem('current_operation_id');
        }
      }
    };
    
    initializeData();
  }, []);
  
  return {
    // Scraping personalizado
    loading,
    error,
    result,
    operationId,
    runCustomScraping,
    
    // Logs
    etlLogs,
    logsLoading,
    logsError,
    fetchEtlLogs,
    fetchLogsByOperation,
    
    // Procesos escaneados
    scrapedProcesses,
    processesLoading,
    processesError,
    pagination,
    fetchScrapedProcesses,
    changePage
  };
};