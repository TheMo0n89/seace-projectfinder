import React, { useState } from 'react';
import CustomScrapingForm from '../components/admin/CustomScrapingForm';
import ETLLogs from '../components/admin/ETLLogs';
import ProcessesTable from '../components/admin/ProcessesTable';
import { useCustomScraping } from '../hooks/useCustomScraping';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Tab } from '@headlessui/react';
import { 
  MagnifyingGlassIcon, 
  ClockIcon, 
  TableCellsIcon 
} from '@heroicons/react/24/outline';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export const ETLAdmin = () => {
  const {
    loading,
    error,
    result,
    runCustomScraping,
    etlLogs,
    logsLoading,
    logsError,
    fetchEtlLogs,
    scrapedProcesses,
    processesLoading,
    processesError,
    pagination,
    fetchScrapedProcesses,
    changePage
  } = useCustomScraping();

  const handleScrapingSubmit = (formValues) => {
    runCustomScraping(formValues);
  };

  const categories = [
    { id: 'scraping', name: 'Extracción de Procesos', icon: MagnifyingGlassIcon },
    { id: 'logs', name: 'Historial de Operaciones', icon: ClockIcon },
    { id: 'processes', name: 'Procesos Escaneados', icon: TableCellsIcon }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <MagnifyingGlassIcon className="w-8 h-8 text-seace-blue mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">
            Operaciones ETL
          </h1>
        </div>
        <p className="text-gray-600">
          Gestiona la extracción, transformación y carga de datos desde el portal SEACE
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="w-full">
        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-xl bg-blue-50 p-1">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Tab
                  key={category.id}
                  className={({ selected }) =>
                    classNames(
                      'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                      'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                      selected
                        ? 'bg-white shadow text-seace-blue'
                        : 'text-blue-700 hover:bg-white/[0.12] hover:text-blue-900'
                    )
                  }
                >
                  <div className="flex items-center justify-center">
                    <Icon className="w-5 h-5 mr-2" />
                    {category.name}
                  </div>
                </Tab>
              );
            })}
          </Tab.List>
          <Tab.Panels className="mt-2">
            {/* Extracción de Procesos */}
            <Tab.Panel className="rounded-xl bg-white p-3">
              <div className="space-y-4">
                <CustomScrapingForm
                  onSubmit={handleScrapingSubmit}
                  loading={loading}
                  error={error}
                  result={result}
                />
                
                {/* Instrucciones */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Instrucciones de Uso</h3>
                  </CardHeader>
                  <CardBody>
                    <div className="prose prose-sm max-w-none">
                      <p>
                        Esta herramienta permite extraer procesos específicos del portal SEACE utilizando parámetros de filtrado.
                        Para obtener mejores resultados, siga estas recomendaciones:
                      </p>
                      <ul>
                        <li>
                          <strong>Objeto de Contratación:</strong> Incluya palabras clave relacionadas con TI como "software", "sistema", "desarrollo", "implementación", etc.
                        </li>
                        <li>
                          <strong>Entidad:</strong> Puede filtrar por una entidad específica como "Ministerio de Educación" o una palabra común como "Municipalidad".
                        </li>
                        <li>
                          <strong>Tipo de Proceso:</strong> Seleccione el tipo específico o deje en "Todos" para una búsqueda más amplia.
                        </li>
                        <li>
                          <strong>Máximo de Procesos:</strong> Limite la cantidad para evitar sobrecargar el sistema. Valores recomendados entre 50 y 200.
                        </li>
                      </ul>
                      <p>
                        <strong>Nota:</strong> El proceso de extracción puede tomar varios minutos dependiendo de la cantidad de resultados.
                        Puede revisar el progreso en la pestaña "Historial de Operaciones".
                      </p>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </Tab.Panel>

            {/* Historial de Operaciones */}
            <Tab.Panel className="rounded-xl bg-white p-3">
              <ETLLogs 
                logs={etlLogs}
                loading={logsLoading}
                error={logsError}
                onRefresh={fetchEtlLogs}
              />
            </Tab.Panel>

            {/* Procesos Escaneados */}
            <Tab.Panel className="rounded-xl bg-white p-3">
              <ProcessesTable 
                processes={scrapedProcesses}
                loading={processesLoading}
                error={processesError}
                onRefresh={fetchScrapedProcesses}
                pagination={pagination}
                onChangePage={changePage}
              />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

export default ETLAdmin;