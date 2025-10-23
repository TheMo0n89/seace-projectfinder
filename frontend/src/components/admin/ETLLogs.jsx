import React from 'react';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { LoadingSpinner } from '../ui/Loading';
import { ErrorAlert } from '../ui/Alert';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  PlayIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const ETLLogs = ({ logs, loading, error, onRefresh }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorAlert 
        error={error}
        onRetry={onRefresh}
        onDismiss={() => {}}
      />
    );
  }

  // Función para formatear fechas
  const formatDate = (dateStr) => {
    try {
      return format(parseISO(dateStr), 'dd MMM yyyy, HH:mm:ss', { locale: es });
    } catch {
      return dateStr || 'N/A';
    }
  };

  // Función para obtener icono según estado
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'running':
        return <PlayIcon className="w-5 h-5 text-blue-500" />;
      case 'failed':
        return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  // Función para obtener color según estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-700 bg-green-50';
      case 'running':
        return 'text-blue-700 bg-blue-50';
      case 'failed':
        return 'text-red-700 bg-red-50';
      default:
        return 'text-gray-700 bg-gray-50';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ClockIcon className="w-6 h-6 text-seace-blue mr-3" />
            <h3 className="text-lg font-semibold">Historial de Operaciones ETL</h3>
          </div>
          <button 
            onClick={onRefresh}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-seace-blue hover:bg-seace-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-seace-blue"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar
          </button>
        </div>
      </CardHeader>
      <CardBody>
        {logs && logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mensaje
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Procesos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duración
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                        <span className="mr-1">{getStatusIcon(log.status)}</span>
                        {log.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.operation_type.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.message}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {log.process_count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.duration_ms ? `${(log.duration_ms / 1000).toFixed(2)}s` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(log.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay operaciones registradas</h3>
            <p className="mt-1 text-sm text-gray-500">
              No se encontraron registros de operaciones ETL.
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default ETLLogs;