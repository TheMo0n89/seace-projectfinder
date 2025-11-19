import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { 
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { LoadingSpinner } from '../ui/Loading';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const ETLOperationDetail = ({ isOpen, onClose, operationId }) => {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('nuevos'); // 'nuevos', 'actualizados', 'errores'

  useEffect(() => {
    if (isOpen && operationId) {
      fetchOperationDetails();
    }
  }, [isOpen, operationId]);

  const fetchOperationDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/etl/operations/${operationId}/details`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDetails(response.data.data);
    } catch (err) {
      setError('Error al cargar los detalles de la operación');
      console.error('Error fetching operation details:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderProcessList = (processes, type) => {
    if (!processes || processes.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <InformationCircleIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>No hay procesos en esta categoría</p>
        </div>
      );
    }

    const getIcon = () => {
      switch(type) {
        case 'nuevos': return '✨';
        case 'actualizados': return '🔄';
        case 'errores': return '❌';
        default: return '📄';
      }
    };

    const getColor = () => {
      switch(type) {
        case 'nuevos': return 'bg-green-50 border-green-200';
        case 'actualizados': return 'bg-blue-50 border-blue-200';
        case 'errores': return 'bg-red-50 border-red-200';
        default: return 'bg-gray-50 border-gray-200';
      }
    };

    return (
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {processes.map((proceso, index) => (
          <div 
            key={index} 
            className={`p-4 rounded-lg border-2 ${getColor()} hover:shadow-md transition-all`}
          >
            <div className="flex items-start">
              <span className="text-2xl mr-3 flex-shrink-0">{getIcon()}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1 min-w-0 mr-2">
                    <p className="text-xs text-gray-500 mb-1">ID del Proceso</p>
                    <span className="font-mono font-bold text-gray-900 text-sm break-all">
                      {proceso.id_proceso || 'ID no disponible'}
                    </span>
                  </div>
                  {proceso.monto_referencial && (
                    <span className="text-xs font-semibold text-gray-700 bg-white px-2 py-1 rounded">
                      S/ {Number(proceso.monto_referencial).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  {proceso.objeto_contratacion || 'Sin tipo'}
                </p>
                {proceso.descripcion && (
                  <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                    {proceso.descripcion}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {proceso.nombre_entidad && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white text-gray-700">
                      🏛️ {proceso.nombre_entidad}
                    </span>
                  )}
                  {proceso.estado_proceso && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white text-gray-700">
                      📊 {proceso.estado_proceso}
                    </span>
                  )}
                  {proceso.departamento && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white text-gray-700">
                      📍 {proceso.departamento}
                    </span>
                  )}
                </div>
                {type === 'errores' && proceso.error_message && (
                  <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-800">
                    <strong>Error:</strong> {proceso.error_message}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex-1">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900 mb-1"
                    >
                      Detalle de Operación ETL
                    </Dialog.Title>
                    {details && (
                      <p className="text-sm text-gray-500 font-mono">
                        ID: {details.operation_id}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* Loading State */}
                {loading && (
                  <div className="flex justify-center items-center py-12">
                    <LoadingSpinner size="lg" />
                  </div>
                )}

                {/* Error State */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex">
                      <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">{error}</h3>
                      </div>
                    </div>
                  </div>
                )}

                {/* Content */}
                {!loading && !error && details && (
                  <div>
                    {/* Operation Info */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                        <InformationCircleIcon className="w-5 h-5 mr-2 text-blue-600" />
                        Parámetros de Extracción
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {details.search_params?.keywords && (
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <p className="text-xs text-gray-500 mb-1">🔍 Palabras Clave</p>
                            <p className="text-sm font-medium text-gray-900">
                              {Array.isArray(details.search_params.keywords) 
                                ? details.search_params.keywords.join(', ') 
                                : details.search_params.keywords}
                            </p>
                          </div>
                        )}
                        {details.search_params?.objetoContratacion && (
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <p className="text-xs text-gray-500 mb-1">📦 Objeto</p>
                            <p className="text-sm font-medium text-gray-900">
                              {details.search_params.objetoContratacion}
                            </p>
                          </div>
                        )}
                        {details.search_params?.anio && (
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <p className="text-xs text-gray-500 mb-1">📅 Año</p>
                            <p className="text-sm font-medium text-gray-900">
                              {details.search_params.anio}
                            </p>
                          </div>
                        )}
                        {details.search_params?.maxProcesses && (
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <p className="text-xs text-gray-500 mb-1">🎯 Max Procesos</p>
                            <p className="text-sm font-medium text-gray-900">
                              {details.search_params.maxProcesses}
                            </p>
                          </div>
                        )}
                        {details.search_params?.entidad && (
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <p className="text-xs text-gray-500 mb-1">🏛️ Entidad</p>
                            <p className="text-sm font-medium text-gray-900 truncate" title={details.search_params.entidad}>
                              {details.search_params.entidad}
                            </p>
                          </div>
                        )}
                        {details.search_params?.tipoProceso && (
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <p className="text-xs text-gray-500 mb-1">📋 Tipo</p>
                            <p className="text-sm font-medium text-gray-900">
                              {details.search_params.tipoProceso}
                            </p>
                          </div>
                        )}
                        {details.search_params?.departamento && (
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <p className="text-xs text-gray-500 mb-1">📍 Departamento</p>
                            <p className="text-sm font-medium text-gray-900">
                              {details.search_params.departamento}
                            </p>
                          </div>
                        )}
                        {details.search_params?.estadoProceso && (
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <p className="text-xs text-gray-500 mb-1">📊 Estado</p>
                            <p className="text-sm font-medium text-gray-900">
                              {details.search_params.estadoProceso}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-green-600 font-medium">Nuevos</p>
                            <p className="text-2xl font-bold text-green-700">
                              {details.inserted_count || 0}
                            </p>
                          </div>
                          <CheckCircleIcon className="w-8 h-8 text-green-500" />
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-blue-600 font-medium">Actualizados</p>
                            <p className="text-2xl font-bold text-blue-700">
                              {details.updated_count || 0}
                            </p>
                          </div>
                          <ArrowPathIcon className="w-8 h-8 text-blue-500" />
                        </div>
                      </div>

                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-red-600 font-medium">Errores</p>
                            <p className="text-2xl font-bold text-red-700">
                              {details.error_count || 0}
                            </p>
                          </div>
                          <ExclamationCircleIcon className="w-8 h-8 text-red-500" />
                        </div>
                      </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200 mb-4">
                      <nav className="-mb-px flex space-x-8">
                        <button
                          onClick={() => setActiveTab('nuevos')}
                          className={`${
                            activeTab === 'nuevos'
                              ? 'border-green-500 text-green-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                          ✨ Procesos Nuevos ({details.inserted_count || 0})
                        </button>
                        <button
                          onClick={() => setActiveTab('actualizados')}
                          className={`${
                            activeTab === 'actualizados'
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                          🔄 Actualizados ({details.updated_count || 0})
                        </button>
                        <button
                          onClick={() => setActiveTab('errores')}
                          className={`${
                            activeTab === 'errores'
                              ? 'border-red-500 text-red-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                          ❌ Errores ({details.error_count || 0})
                        </button>
                      </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="mt-4">
                      {activeTab === 'nuevos' && renderProcessList(details.inserted_processes, 'nuevos')}
                      {activeTab === 'actualizados' && renderProcessList(details.updated_processes, 'actualizados')}
                      {activeTab === 'errores' && renderProcessList(details.error_processes, 'errores')}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-seace-blue px-4 py-2 text-sm font-medium text-white hover:bg-seace-blue-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    Cerrar
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ETLOperationDetail;
