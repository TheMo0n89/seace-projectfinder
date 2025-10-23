/**
 * Dashboard de progreso ETL con tracking en tiempo real
 * Componente para mostrar barras de progreso, contadores y feed de proyectos
 */
import React from 'react';
import { 
  ChartBarIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ClockIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

const ETLProgressDashboard = ({ 
  currentSession, 
  progress, 
  latestProject, 
  sessionStats, 
  isConnected 
}) => {
  
  if (!currentSession) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <ArrowPathIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Sin sesión ETL activa
        </h3>
        <p className="text-gray-600">
          Haz clic en "Sincronización Diaria" para iniciar una nueva sesión de tracking
        </p>
        <div className="mt-4 flex items-center justify-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className="text-sm text-gray-500">
            WebSocket {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
      </div>
    );
  }

  const { processed, saved, duplicates, errors, percentage, phase } = progress;
  const isCompleted = phase === 'completed';
  const isError = phase === 'error';
  const isRunning = ['running', 'processing', 'initializing'].includes(phase);

  return (
    <div className="space-y-6">
      
      {/* Header de sesión */}
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-seace-blue">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Sesión ETL en Curso
            </h3>
            <p className="text-sm text-gray-600">
              ID: {currentSession.session_id} • 
              Fase: <span className={`capitalize font-medium ${
                isError ? 'text-red-600' : 
                isCompleted ? 'text-green-600' : 
                'text-seace-blue'
              }`}>
                {phase === 'initializing' ? 'Inicializando' :
                 phase === 'processing' ? 'Procesando' :
                 phase === 'completed' ? 'Completado' :
                 phase === 'error' ? 'Error' : phase}
              </span>
            </p>
          </div>
          
          <div className="text-right">
            <div className="flex items-center mb-1">
              <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-sm text-gray-500">
                WebSocket {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            {sessionStats && (
              <p className="text-sm text-gray-600">
                Duración: {Math.floor(sessionStats.duration / 60)}:{(sessionStats.duration % 60).toString().padStart(2, '0')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Barra de progreso principal */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium text-gray-900">Progreso General</h4>
          <span className="text-2xl font-bold text-seace-blue">
            {percentage.toFixed(1)}%
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
          <div 
            className={`h-4 rounded-full transition-all duration-300 ${
              isError ? 'bg-red-500' : 
              isCompleted ? 'bg-green-500' : 
              'bg-seace-blue'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          >
            {percentage > 5 && (
              <div className="h-full flex items-center justify-center">
                <span className="text-xs font-medium text-white">
                  {percentage.toFixed(0)}%
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-between text-sm text-gray-600">
          <span>
            {processed} / {currentSession.total_expected || 0} proyectos procesados
          </span>
          {sessionStats && sessionStats.remainingProjects > 0 && (
            <span>
              Restantes: {sessionStats.remainingProjects}
            </span>
          )}
        </div>
      </div>

      {/* Contadores de resultados */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Proyectos guardados */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <CheckCircleIcon className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Guardados</p>
              <p className="text-2xl font-bold text-green-600">{saved}</p>
            </div>
          </div>
        </div>

        {/* Duplicados */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <DocumentDuplicateIcon className="w-8 h-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Duplicados</p>
              <p className="text-2xl font-bold text-yellow-600">{duplicates}</p>
            </div>
          </div>
        </div>

        {/* Errores */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Errores</p>
              <p className="text-2xl font-bold text-red-600">{errors}</p>
            </div>
          </div>
        </div>

        {/* Total procesado */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <ChartBarIcon className="w-8 h-8 text-seace-blue mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Procesados</p>
              <p className="text-2xl font-bold text-seace-blue">{processed}</p>
            </div>
          </div>
        </div>

      </div>

      {/* Proyecto más reciente */}
      {latestProject && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <BuildingOfficeIcon className="w-5 h-5 text-seace-blue mr-2" />
            Proyecto Más Reciente
          </h4>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Número de Proceso</p>
                <p className="text-gray-900 font-mono text-sm">{latestProject.numero_proceso}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700">Estado</p>
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                  {latestProject.estado}
                </span>
              </div>
              
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-700 mb-1">Entidad</p>
                <p className="text-gray-900 text-sm">{latestProject.entidad}</p>
              </div>
              
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-700 mb-1">Objeto de Contratación</p>
                <p className="text-gray-900 text-sm">{latestProject.objeto}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700">Valor Referencial</p>
                <p className="text-gray-900 font-semibold">
                  {latestProject.moneda} {latestProject.valor}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700">Fecha de Publicación</p>
                <p className="text-gray-900">{latestProject.fecha}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-3 flex justify-end">
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              Actualizado hace pocos segundos
            </span>
          </div>
        </div>
      )}

      {/* Información adicional */}
      {sessionStats && isRunning && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <ClockIcon className="w-5 h-5 text-seace-blue mr-2" />
            Estadísticas de Sesión
          </h4>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {sessionStats.totalExpected}
              </p>
              <p className="text-sm text-gray-600">Total Esperado</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {sessionStats.remainingProjects}
              </p>
              <p className="text-sm text-gray-600">Restantes</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {Math.floor(sessionStats.duration / 60)}m {sessionStats.duration % 60}s
              </p>
              <p className="text-sm text-gray-600">Tiempo Transcurrido</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {sessionStats.estimatedTimeRemaining > 0 ? 
                  `${Math.floor(sessionStats.estimatedTimeRemaining / 60)}m` : 
                  '--'
                }
              </p>
              <p className="text-sm text-gray-600">Tiempo Estimado</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ETLProgressDashboard;