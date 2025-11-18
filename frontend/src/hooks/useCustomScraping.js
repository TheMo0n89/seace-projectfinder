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
        // keywords: descripcion del objeto (para usar en la búsqueda de texto)
        keywords: params.descripcion ? params.descripcion.split(' ') : ['software'],
        
        // Parámetros de formulario SEACE
        objetoContratacion: params.objetoContratacion || 'Servicio',
        anio: params.anio || new Date().getFullYear().toString(),
        
        // Filtros adicionales
        maxProcesses: params.maxProcesos || 100,
        entidad: params.entidad || null,
        tipoProceso: params.tipoProceso || null,
        useSelenium: params.useSelenium !== false
      };
      
      const response = await etlService.startScraping(scrapingParams);
      
      setResult(response.data || response);
      const opId = response.data?.operation_id || response.operation_id;
      setOperationId(opId);
      
      // Iniciar polling para verificar estado
      if (opId) {
        await pollOperationStatus(opId);
      }
      
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
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
  
  // Efecto para cargar logs al iniciar
  useEffect(() => {
    fetchEtlLogs();
    fetchScrapedProcesses();
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