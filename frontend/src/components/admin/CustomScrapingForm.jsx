import React, { useState } from 'react';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { Alert, ErrorAlert } from '../ui/Alert';
import { LoadingSpinner } from '../ui/Loading';
import { ArrowPathIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import ProgressBar from './ProgressBar';

const CustomScrapingForm = ({ onSubmit, loading, error, result }) => {
  // Estado del formulario
  const [formValues, setFormValues] = useState({
    objetoContratacion: '',  // Vacío por defecto = Todos
    descripcion: '',
    anio: new Date().getFullYear().toString(),
    entidad: '',
    tipoProceso: '',
    maxProcesos: null,
    useSelenium: true
  });

  // Estado para mostrar/ocultar el ProgressBar
  const [showProgress, setShowProgress] = useState(false);
  const [operationId, setOperationId] = useState(null);

  // Opciones para Objeto de Contratación (coincide con SEACE)
  const objetoContratacionOptions = [
    { value: '', label: 'Todos' },
    { value: 'Bien', label: 'Bien' },
    { value: 'Servicio', label: 'Servicio' },
    { value: 'Obra', label: 'Obra' },
    { value: 'Consultoría de Obra', label: 'Consultoría de Obra' },
  ];

  // Opciones para años (últimos 5 años + próximo)
  const currentYear = new Date().getFullYear();
  const anioOptions = Array.from({ length: 6 }, (_, i) => {
    const year = currentYear - i + 1;
    return { value: year.toString(), label: year.toString() };
  });

  // Opciones para tipo de proceso
  const tipoProcesoOptions = [
    { value: '', label: 'Todos' },
    { value: 'ADJUDICACION SIMPLIFICADA', label: 'Adjudicación Simplificada' },
    { value: 'CONCURSO PUBLICO', label: 'Concurso Público' },
    { value: 'LICITACION PUBLICA', label: 'Licitación Pública' },
    { value: 'CONTRATACION DIRECTA', label: 'Contratación Directa' },
    { value: 'REGIMEN ESPECIAL', label: 'Régimen Especial' },
    { value: 'SUBASTA INVERSA ELECTRONICA', label: 'Subasta Inversa Electrónica' },
  ];

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: name === 'maxProcesos' ? (value === '' ? null : Number(value)) : value
    }));
  };

  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formValues);
  };

  // Manejar cuando se inicia una operación
  const handleOperationStart = (opId) => {
    setOperationId(opId);
    setShowProgress(true);
  };

  // Manejar cuando la operación completa
  const handleOperationComplete = (status) => {
    console.log(`Operación completada con estado: ${status}`);
    // Opcionalmente, puedes mantener visible el progreso o ocultarlo
    // setShowProgress(false); // Descomentar si quieres ocultarlo automáticamente
  };

  // Debug helper
  const debugLog = (message, data = null) => {
    console.log(`[CustomScrapingForm] ${message}`, data || '');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center">
          <MagnifyingGlassIcon className="w-6 h-6 text-seace-blue mr-3" />
          <h3 className="text-lg font-semibold">Extracción Específica de Procesos</h3>
        </div>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Objeto de Contratación */}
            <div>
              <label htmlFor="objetoContratacion" className="block text-sm font-medium text-gray-700">
                Objeto de Contratación
              </label>
              <select
                id="objetoContratacion"
                name="objetoContratacion"
                value={formValues.objetoContratacion}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-seace-blue focus:border-seace-blue"
              >
                {objetoContratacionOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Tipo de objeto según SEACE (vacío = Todos)
              </p>
            </div>

            {/* Descripción del Objeto */}
            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">
                Descripción del Objeto
              </label>
              <input
                type="text"
                id="descripcion"
                name="descripcion"
                value={formValues.descripcion}
                onChange={handleChange}
                placeholder="Ej: software, desarrollo, implementación"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-seace-blue focus:border-seace-blue"
              />
              <p className="mt-1 text-sm text-gray-500">
                Palabras clave para buscar en la descripción
              </p>
            </div>

            {/* Año de la Convocatoria */}
            <div>
              <label htmlFor="anio" className="block text-sm font-medium text-gray-700">
                Año de la Convocatoria
              </label>
              <select
                id="anio"
                name="anio"
                value={formValues.anio}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-seace-blue focus:border-seace-blue"
              >
                {anioOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Año de publicación del proceso (por defecto: {new Date().getFullYear()})
              </p>
            </div>

            {/* Entidad */}
            <div>
              <label htmlFor="entidad" className="block text-sm font-medium text-gray-700">
                Entidad Contratante
              </label>
              <input
                type="text"
                id="entidad"
                name="entidad"
                value={formValues.entidad}
                onChange={handleChange}
                placeholder="Ej: Ministerio, Municipalidad"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-seace-blue focus:border-seace-blue"
              />
            </div>

            {/* Tipo de Proceso */}
            <div>
              <label htmlFor="tipoProceso" className="block text-sm font-medium text-gray-700">
                Tipo de Proceso
              </label>
              <select
                id="tipoProceso"
                name="tipoProceso"
                value={formValues.tipoProceso}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-seace-blue focus:border-seace-blue"
              >
                {tipoProcesoOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Máximo de Procesos */}
            <div>
              <label htmlFor="maxProcesos" className="block text-sm font-medium text-gray-700">
                Máximo de Procesos NUEVOS a Insertar
              </label>
              <input
                type="number"
                id="maxProcesos"
                name="maxProcesos"
                value={formValues.maxProcesos || ''}
                onChange={handleChange}
                min="1"
                placeholder="Dejar vacío para extraer todos"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-seace-blue focus:border-seace-blue"
              />
              <p className="mt-1 text-sm text-gray-500">
                Solo cuenta procesos NUEVOS. Deja vacío para extraer sin límite.
              </p>
            </div>

            {/* Usar Selenium */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="useSelenium"
                name="useSelenium"
                checked={formValues.useSelenium}
                onChange={(e) => setFormValues(prev => ({ ...prev, useSelenium: e.target.checked }))}
                className="h-4 w-4 text-seace-blue focus:ring-seace-blue border-gray-300 rounded"
              />
              <label htmlFor="useSelenium" className="ml-2 block text-sm text-gray-700">
                Usar Selenium (navegación avanzada)
              </label>
              <div className="ml-2 text-xs text-gray-500">
                <span className="group relative inline-block">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-48">
                    Activa esta opción para una extracción más completa usando navegación automatizada con Selenium. La extracción será más lenta pero más precisa.
                  </span>
                </span>
              </div>
            </div>

            {/* Botón de envío */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={loading}
                loading={loading}
                className="flex items-center"
              >
                <ArrowPathIcon className="w-4 h-4 mr-2" />
                {loading ? 'Procesando...' : 'Iniciar Extracción'}
              </Button>
            </div>
          </div>
        </form>

        {/* Mensajes de error */}
        {error && (
          <div className="mt-4">
            <ErrorAlert 
              error={error}
              onDismiss={() => {}}
            />
          </div>
        )}

        {/* Resultados */}
        {result && !loading && !error && (
          <div className="mt-4">
            {debugLog('Renderizando resultado:', result) || null}
            <Alert
              type="success"
              title="Extracción iniciada correctamente"
              message={`Operación ID: ${result.operation_id}. Estado: ${result.status}`}
            />
            {/* Mostrar ProgressBar cuando se inicia la operación */}
            {result.operation_id ? (
              <div className="mt-6">
                {debugLog('Renderizando ProgressBar con operationId:', result.operation_id) || null}
                <ProgressBar 
                  operationId={result.operation_id}
                  status={result.status}
                  onComplete={handleOperationComplete}
                  showLogs={true}
                />
              </div>
            ) : (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">⚠️ No se recibió operation_id en el resultado</p>
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default CustomScrapingForm;