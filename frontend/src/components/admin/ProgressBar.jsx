import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, ExclamationIcon } from '@heroicons/react/24/outline';
import { XCircleIcon } from '@heroicons/react/24/solid';

/**
 * Componente ProgressBar para mostrar el progreso en tiempo real de operaciones ETL
 * @param {string} operationId - ID de la operación a monitorear
 * @param {string} status - Estado actual de la operación (running, completed, failed)
 * @param {function} onComplete - Callback cuando la operación finaliza
 * @param {boolean} showLogs - Mostrar logs detallados (default: true)
 */
export const ProgressBar = ({ 
  operationId, 
  status: initialStatus = 'running',
  onComplete,
  showLogs = true
}) => {
  const [progress, setProgress] = useState({
    porcentaje: 0,
    paso_actual: 0,
    paso_total: 0,
    mensaje_actual: 'Inicializando...',
    status: initialStatus,
    inserted_count: 0,
    updated_count: 0,
    error_count: 0
  });

  const [isPolling, setIsPolling] = useState(true);
  const [pollCount, setPollCount] = useState(0);

  // Debug: Log cuando se monta el componente
  useEffect(() => {
    console.log(`[ProgressBar MOUNTED] operationId=${operationId}, status=${status}`);
    return () => {
      console.log(`[ProgressBar UNMOUNTED] operationId=${operationId}`);
    };
  }, []);

  useEffect(() => {
    if (!operationId || !isPolling) return;

    console.log(`[ProgressBar] Iniciando polling para operación: ${operationId}`);

    const pollInterval = setInterval(async () => {
      try {
        const token = localStorage.getItem('token');
        const url = `/api/v1/etl/operations/${operationId}/progress`;
        
        console.log(`[ProgressBar] Polling: ${url}`);
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const progressData = data.data;
          
          console.log(`[ProgressBar] Respuesta recibida:`, progressData);
          
          setProgress(progressData);
          setPollCount(prev => prev + 1);

          // Detener polling si la operación completó o falló
          if (progressData.status === 'completed' || progressData.status === 'failed') {
            console.log(`[ProgressBar] Operación ${progressData.status}, deteniendo polling`);
            setIsPolling(false);
            // Limpiar sessionStorage cuando operación termina
            sessionStorage.removeItem('current_operation_id');
            console.log('[ProgressBar] sessionStorage limpiado');
            if (onComplete) {
              onComplete(progressData.status);
            }
          }
        } else {
          console.warn(`[ProgressBar] Error en respuesta: ${response.status}`);
        }
      } catch (error) {
        console.error('[ProgressBar] Error polling progress:', error);
      }
    }, 1500); // Poll cada 1.5 segundos

    return () => {
      console.log(`[ProgressBar] Limpiando intervalo`);
      clearInterval(pollInterval);
    };
  }, [operationId, isPolling, onComplete]);

  const getStatusColor = () => {
    switch (progress.status) {
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'running':
        return 'bg-blue-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'completed':
        return <CheckCircleIcon className="w-6 h-6 text-green-600" />;
      case 'failed':
        return <XCircleIcon className="w-6 h-6 text-red-600" />;
      case 'running':
        return (
          <div className="w-6 h-6 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        );
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (progress.status) {
      case 'completed':
        return 'Completado';
      case 'failed':
        return 'Error';
      case 'running':
        return 'En progreso...';
      default:
        return 'Desconocido';
    }
  };

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h3 className="font-semibold text-gray-900">Operación ETL</h3>
            <p className="text-sm text-gray-500">{getStatusText()}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{progress.porcentaje}%</div>
          <div className="text-xs text-gray-500 mt-1">
            {progress.paso_actual} de {progress.paso_total} procesos
          </div>
        </div>
      </div>

      {/* Progress Bar Visual */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full ${getStatusColor()} transition-all duration-300 ease-out ${
              progress.status === 'running' ? 'animate-pulse' : ''
            }`}
            style={{ width: `${progress.porcentaje}%` }}
          />
        </div>
      </div>

      {/* Mensaje Actual */}
      {progress.mensaje_actual && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <span className="font-medium">Estado:</span> {progress.mensaje_actual}
          </p>
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="text-2xl font-bold text-green-600">
            {progress.inserted_count || 0}
          </div>
          <p className="text-xs text-green-700 mt-1">Insertados</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-600">
            {progress.updated_count || 0}
          </div>
          <p className="text-xs text-yellow-700 mt-1">Actualizados</p>
        </div>
        <div className={`rounded-lg p-4 border ${
          progress.error_count > 0 
            ? 'bg-red-50 border-red-200' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className={`text-2xl font-bold ${
            progress.error_count > 0 ? 'text-red-600' : 'text-gray-600'
          }`}>
            {progress.error_count || 0}
          </div>
          <p className={`text-xs mt-1 ${
            progress.error_count > 0 ? 'text-red-700' : 'text-gray-700'
          }`}>
            Errores
          </p>
        </div>
      </div>

      {/* Información Adicional */}
      <div className="border-t pt-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">ID Operación</p>
            <p className="font-mono text-xs text-gray-900 break-all mt-1">
              {operationId}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Estado Actual</p>
            <div className="mt-1">
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                progress.status === 'completed' ? 'bg-green-100 text-green-800' :
                progress.status === 'failed' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {getStatusText()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detalles técnicos (opcional) */}
      {showLogs && progress.status !== 'running' && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600">
            <strong>Resumen:</strong> Se procesaron{' '}
            <span className="text-green-600 font-semibold">
              {progress.inserted_count || 0} insertados
            </span>
            {', '}
            <span className="text-yellow-600 font-semibold">
              {progress.updated_count || 0} actualizados
            </span>
            {progress.error_count > 0 && (
              <>
                {', y '}
                <span className="text-red-600 font-semibold">
                  {progress.error_count || 0} errores
                </span>
              </>
            )}
            .
          </p>
        </div>
      )}

      {/* Spinner Info (solo mientras está en progreso) */}
      {progress.status === 'running' && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Actualizando cada 1.5 segundos...
          </p>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
