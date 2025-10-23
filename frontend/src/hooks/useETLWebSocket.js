/**
 * Hook para manejar WebSocket ETL en tiempo real
 * Conecta con backend para recibir actualizaciones de progreso
 */
import { useState, useEffect, useRef, useCallback } from 'react';

const useETLWebSocket = () => {
  // Estados del WebSocket
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  // Estados de la sesión ETL
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [latestProject, setLatestProject] = useState(null);
  
  // Estados de progreso
  const [progress, setProgress] = useState({
    processed: 0,
    saved: 0,
    duplicates: 0,
    errors: 0,
    percentage: 0,
    phase: 'idle'
  });
  
  // Estados para errores específicos y estado del scraper
  const [scraperStatus, setScraperStatus] = useState({
    status: 'idle',
    message: '',
    details: {}
  });
  const [detailedError, setDetailedError] = useState(null);
  const [systemMessages, setSystemMessages] = useState([]);
  
  // Referencias
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000;
  
  // Configuración WebSocket
  const WS_URL = `ws://localhost:8001/api/v1/admin/etl/ws`;
  
  /**
   * Conectar WebSocket
   */
  const connect = useCallback(() => {
    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        return; // Ya conectado
      }
      
      console.log('🔌 Conectando WebSocket ETL...');
      wsRef.current = new WebSocket(WS_URL);
      
      wsRef.current.onopen = () => {
        console.log('✅ WebSocket ETL conectado');
        setIsConnected(true);
        setConnectionError(null);
        setReconnectAttempts(0);
        
        // Ping inicial para verificar conexión
        wsRef.current?.send('ping');
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (err) {
          // Manejar mensajes simples como "pong"
          if (event.data === 'pong') {
            console.log('🏓 WebSocket ETL activo (pong recibido)');
          } else if (event.data.startsWith('status:')) {
            const status = event.data.split(':')[1];
            console.log(`📊 Estado ETL: ${status}`);
          }
        }
      };
      
      wsRef.current.onclose = (event) => {
        console.log('🔌 WebSocket ETL desconectado:', event.code, event.reason);
        setIsConnected(false);
        
        // Reconexión automática si no fue cerrado intencionalmente
        if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
          const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts);
          console.log(`🔄 Reconectando WebSocket ETL en ${delay}ms (intento ${reconnectAttempts + 1}/${maxReconnectAttempts})...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, delay);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          setConnectionError('Máximo de intentos de reconexión alcanzado');
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('❌ Error WebSocket ETL:', error);
        setConnectionError('Error de conexión WebSocket');
      };
      
    } catch (error) {
      console.error('❌ Error creando WebSocket ETL:', error);
      setConnectionError('Error creando conexión WebSocket');
    }
  }, [reconnectAttempts]);
  
  /**
   * Procesar mensajes WebSocket
   */
  const handleWebSocketMessage = useCallback((data) => {
    console.log('📨 Mensaje WebSocket ETL recibido:', data);
    
    switch (data.type || data.action) {
      case 'session_start':
        setCurrentSession(data.session);
        setProgress({
          processed: 0,
          saved: 0,
          duplicates: 0,
          errors: 0,
          percentage: 0,
          phase: data.session.phase || 'initializing'
        });
        console.log('🚀 Sesión ETL iniciada:', data.session.session_id);
        break;
        
      case 'progress_update':
        if (data.session) {
          setCurrentSession(data.session);
          setProgress({
            processed: data.session.processed || 0,
            saved: data.session.saved || 0,
            duplicates: data.session.duplicates || 0,
            errors: data.session.errors || 0,
            percentage: data.session.progress_percentage || 0,
            phase: data.session.phase || 'processing'
          });
        }
        
        if (data.latest_project) {
          setLatestProject(data.latest_project);
        }
        break;
        
      case 'session_complete':
        if (data.session) {
          setCurrentSession(data.session);
          setProgress({
            processed: data.session.processed || 0,
            saved: data.session.saved || 0,
            duplicates: data.session.duplicates || 0,
            errors: data.session.errors || 0,
            percentage: 100,
            phase: 'completed'
          });
        }
        
        // Agregar a historial
        setSessionHistory(prev => {
          const newHistory = [data.session, ...prev];
          return newHistory.slice(0, 10); // Mantener últimas 10 sesiones
        });
        
        console.log('✅ Sesión ETL completada:', data.session.session_id);
        
        // Limpiar sesión actual después de 3 segundos
        setTimeout(() => {
          setCurrentSession(null);
          setLatestProject(null);
        }, 3000);
        break;
        
      case 'session_error':
        if (data.session) {
          setCurrentSession(data.session);
          setProgress(prev => ({
            ...prev,
            phase: 'error'
          }));
        }
        
        console.error('❌ Error en sesión ETL:', data.error);
        
        // Si hay información detallada del error, guardarla
        if (data.error_info) {
          setDetailedError(data.error_info);
        }
        
        // Agregar sesión con error al historial
        setSessionHistory(prev => {
          const newHistory = [data.session, ...prev];
          return newHistory.slice(0, 10);
        });
        
        // Limpiar sesión después de 5 segundos
        setTimeout(() => {
          setCurrentSession(null);
          setLatestProject(null);
        }, 5000);
        break;
        
      case 'scraper_status':
      case 'scraper_update':
        console.log('🤖 Estado del scraper:', data.status, '-', data.message);
        setScraperStatus({
          status: data.status,
          message: data.message,
          details: data.details || {}
        });
        
        // Agregar a mensajes del sistema
        setSystemMessages(prev => {
          const newMessage = {
            id: Date.now(),
            type: 'scraper_status',
            status: data.status,
            message: data.message,
            timestamp: data.timestamp,
            details: data.details || {}
          };
          return [newMessage, ...prev].slice(0, 20); // Mantener últimos 20 mensajes
        });
        break;
        
      case 'detailed_error':
        console.error('💥 Error detallado recibido:', data);
        setDetailedError({
          type: data.error_type,
          message: data.message,
          suggestion: data.suggestion,
          technical_details: data.technical_details || {},
          timestamp: data.timestamp
        });
        
        // Agregar a mensajes del sistema
        setSystemMessages(prev => {
          const newMessage = {
            id: Date.now(),
            type: 'detailed_error',
            error_type: data.error_type,
            message: data.message,
            suggestion: data.suggestion,
            timestamp: data.timestamp,
            technical_details: data.technical_details || {}
          };
          return [newMessage, ...prev].slice(0, 20);
        });
        break;
        
      case 'connection_established':
        console.log('✅ Conexión WebSocket confirmada:', data.message);
        setSystemMessages(prev => {
          const newMessage = {
            id: Date.now(),
            type: 'connection',
            message: data.message,
            timestamp: data.timestamp
          };
          return [newMessage, ...prev].slice(0, 20);
        });
        break;
        
      case 'session_status':
        if (data.session) {
          setCurrentSession(data.session);
          // Reconstruir progreso desde sesión existente
          setProgress({
            processed: data.session.processed || 0,
            saved: data.session.saved || 0,
            duplicates: data.session.duplicates || 0,
            errors: data.session.errors || 0,
            percentage: data.session.progress_percentage || 0,
            phase: data.session.phase || 'unknown'
          });
        }
        break;
        
      default:
        console.log('📨 Mensaje WebSocket ETL no reconocido:', data);
    }
  }, []);
  
  /**
   * Desconectar WebSocket
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Desconexión intencional');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionError(null);
    setReconnectAttempts(0);
    console.log('🔌 WebSocket ETL desconectado intencionalmente');
  }, []);
  
  /**
   * Enviar mensaje al WebSocket
   */
  const sendMessage = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof message === 'string' ? message : JSON.stringify(message));
      return true;
    }
    console.warn('⚠️ WebSocket ETL no conectado para enviar mensaje');
    return false;
  }, []);
  
  /**
   * Solicitar estado actual
   */
  const requestStatus = useCallback(() => {
    return sendMessage('get_status');
  }, [sendMessage]);
  
  /**
   * Efectos
   */
  
  // Conectar al montar
  useEffect(() => {
    connect();
    
    // Cleanup al desmontar
    return () => {
      disconnect();
    };
  }, []);
  
  // Ping periódico para mantener conexión activa
  useEffect(() => {
    if (!isConnected) return;
    
    const pingInterval = setInterval(() => {
      sendMessage('ping');
    }, 30000); // Ping cada 30 segundos
    
    return () => clearInterval(pingInterval);
  }, [isConnected, sendMessage]);
  
  /**
   * Estados calculados
   */
  const isSessionActive = currentSession && ['running', 'initializing', 'processing'].includes(currentSession.status);
  const canStartNewSession = !isSessionActive;
  
  const sessionStats = currentSession ? {
    duration: currentSession.start_time ? 
      Math.floor((new Date() - new Date(currentSession.start_time)) / 1000) : 0,
    totalExpected: currentSession.total_expected || 0,
    remainingProjects: Math.max(0, (currentSession.total_expected || 0) - progress.processed),
    estimatedTimeRemaining: progress.processed > 0 && currentSession.total_expected ? 
      ((new Date() - new Date(currentSession.start_time)) / progress.processed * 
       (currentSession.total_expected - progress.processed)) / 1000 : 0
  } : null;
  
  return {
    // Estados de conexión
    isConnected,
    connectionError,
    reconnectAttempts,
    
    // Estados de sesión
    currentSession,
    sessionHistory,
    isSessionActive,
    canStartNewSession,
    
    // Estados de progreso
    progress,
    latestProject,
    sessionStats,
    
    // Estados específicos de errores y scraper
    scraperStatus,
    detailedError,
    systemMessages,
    
    // Funciones para limpiar errores
    clearDetailedError: () => setDetailedError(null),
    clearSystemMessages: () => setSystemMessages([]),
    
    // Acciones
    connect,
    disconnect,
    sendMessage,
    requestStatus
  };
};

export default useETLWebSocket;