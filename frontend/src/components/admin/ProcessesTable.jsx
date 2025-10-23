import React, { useState } from 'react';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { LoadingSpinner } from '../ui/Loading';
import { ErrorAlert } from '../ui/Alert';
import { 
  MagnifyingGlassIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon 
} from '@heroicons/react/24/outline';
import { utils } from '../../services/seaceService';

const ProcessesTable = ({ 
  processes, 
  loading, 
  error, 
  onRefresh,
  pagination,
  onChangePage
}) => {
  const [filters, setFilters] = useState({
    entidad: '',
    estado: '',
    fechaDesde: '',
    fechaHasta: ''
  });

  // Opciones para estado
  const estadoOptions = [
    { value: '', label: 'Todos' },
    { value: 'CONVOCADO', label: 'Convocado' },
    { value: 'ADJUDICADO', label: 'Adjudicado' },
    { value: 'DESIERTO', label: 'Desierto' },
    { value: 'CANCELADO', label: 'Cancelado' },
    { value: 'NULO', label: 'Nulo' }
  ];

  // Manejar cambios en filtros
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Aplicar filtros
  const handleApplyFilters = () => {
    onRefresh(filters);
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    setFilters({
      entidad: '',
      estado: '',
      fechaDesde: '',
      fechaHasta: ''
    });
    onRefresh({});
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <MagnifyingGlassIcon className="w-6 h-6 text-seace-blue mr-3" />
            <h3 className="text-lg font-semibold">Procesos Escaneados</h3>
          </div>
          <div className="text-sm text-gray-500">
            {pagination && `Total: ${pagination.total} procesos`}
          </div>
        </div>
      </CardHeader>
      <CardBody>
        {/* Filtros */}
        <div className="mb-6 p-4 bg-gray-50 rounded-md">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="entidad" className="block text-xs font-medium text-gray-700 mb-1">
                Entidad
              </label>
              <input
                type="text"
                id="entidad"
                name="entidad"
                value={filters.entidad}
                onChange={handleFilterChange}
                placeholder="Nombre de entidad"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-seace-blue focus:border-seace-blue"
              />
            </div>
            <div>
              <label htmlFor="estado" className="block text-xs font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                id="estado"
                name="estado"
                value={filters.estado}
                onChange={handleFilterChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-seace-blue focus:border-seace-blue"
              >
                {estadoOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="fechaDesde" className="block text-xs font-medium text-gray-700 mb-1">
                Fecha Desde
              </label>
              <input
                type="date"
                id="fechaDesde"
                name="fechaDesde"
                value={filters.fechaDesde}
                onChange={handleFilterChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-seace-blue focus:border-seace-blue"
              />
            </div>
            <div>
              <label htmlFor="fechaHasta" className="block text-xs font-medium text-gray-700 mb-1">
                Fecha Hasta
              </label>
              <input
                type="date"
                id="fechaHasta"
                name="fechaHasta"
                value={filters.fechaHasta}
                onChange={handleFilterChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-seace-blue focus:border-seace-blue"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-seace-blue"
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={handleApplyFilters}
              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-seace-blue hover:bg-seace-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-seace-blue"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>

        {/* Tabla de Procesos */}
        {processes && processes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proceso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Objeto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Pub.
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processes.map((process) => (
                  <tr key={process.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 hover:text-blue-800">
                      <a href={`/procesos/${process.id}`} target="_blank" rel="noopener noreferrer">
                        {process.numero_proceso}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-md truncate">
                        {utils.truncateText(process.objeto_contratacion, 60)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {utils.truncateText(process.entidad, 30)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        process.estado === 'ADJUDICADO'
                          ? 'bg-green-100 text-green-800'
                          : process.estado === 'CONVOCADO'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {process.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {process.monto_referencial 
                        ? utils.formatCurrency(process.monto_referencial, process.moneda)
                        : 'No especificado'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {process.fecha_publicacion
                        ? utils.formatDateShort(process.fecha_publicacion)
                        : 'No especificado'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay procesos</h3>
            <p className="mt-1 text-sm text-gray-500">
              No se encontraron procesos escaneados con los filtros actuales.
            </p>
          </div>
        )}

        {/* Paginación */}
        {pagination && pagination.pages > 0 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => onChangePage(pagination.page - 1)}
                disabled={pagination.page === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  pagination.page === 1
                    ? 'text-gray-300 bg-gray-100 cursor-not-allowed'
                    : 'text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                Anterior
              </button>
              <button
                onClick={() => onChangePage(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  pagination.page === pagination.pages
                    ? 'text-gray-300 bg-gray-100 cursor-not-allowed'
                    : 'text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> a{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  de <span className="font-medium">{pagination.total}</span> procesos
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => onChangePage(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      pagination.page === 1
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Anterior</span>
                    <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                  
                  {/* Mostrar número de página y total */}
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    Página {pagination.page} de {pagination.pages}
                  </span>
                  
                  <button
                    onClick={() => onChangePage(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      pagination.page === pagination.pages
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Siguiente</span>
                    <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default ProcessesTable;