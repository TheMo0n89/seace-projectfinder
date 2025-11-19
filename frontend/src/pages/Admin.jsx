import React, { useState } from 'react';
import { 
  CogIcon, 
  PlayIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  SparklesIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  UsersIcon,
  UserIcon,
  XMarkIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { useETLOperations, useUsers } from '../hooks/useAdmin';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/Loading';
import { ErrorAlert, Alert } from '../components/ui/Alert';
import UserProfileAnalytics from '../components/admin/UserProfileAnalytics';

export const Admin = () => {
  const [activeTab, setActiveTab] = useState('etl');
  
  const { operations, runDailySync, runFullSync, runTISync, generateEmbeddings } = useETLOperations();
  const { users, loading: usersLoading, error: usersError } = useUsers();

  const tabs = [
    { id: 'etl', name: 'Operaciones ETL', icon: ArrowPathIcon },
    { id: 'users', name: 'Gestión de Usuarios', icon: UsersIcon }
  ];
  
  // Redireccionar a la página de ETL específica
  const navigateToETLPage = () => {
    window.location.href = '/admin/etl';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <CogIcon className="w-8 h-8 text-seace-blue mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">
            Panel de Administración
          </h1>
        </div>
        <p className="text-gray-600">
          Gestión y monitoreo del sistema SEACE ProjectFinder
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-seace-blue text-seace-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'etl' && (
        <div className="space-y-6">
          <ETLOperations operations={operations} actions={{
            runDailySync,
            runFullSync,
            runTISync,
            generateEmbeddings
          }} />
          
          {/* Sección para ETL avanzado */}
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <DocumentTextIcon className="w-6 h-6 text-seace-blue mr-3" />
                <h3 className="text-lg font-semibold">Extracción Específica de Procesos</h3>
              </div>
            </CardHeader>
            <CardBody>
              <p className="text-gray-600 mb-4">
                Utiliza la herramienta avanzada de extracción para configurar parámetros específicos,
                visualizar el historial de operaciones y gestionar los procesos extraídos.
              </p>
              <Button onClick={navigateToETLPage} className="w-full sm:w-auto">
                Ir a Herramienta ETL Avanzada
              </Button>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'users' && (
        <UserManagement 
          users={users} 
          loading={usersLoading} 
          error={usersError} 
        />
      )}
    </div>
  );
};



const ETLOperations = ({ operations, actions }) => {
  const [fullSyncDays, setFullSyncDays] = useState(365);
  const [embeddingsBatchSize, setEmbeddingsBatchSize] = useState(50);

  const operationsList = [
    {
      id: 'dailySync',
      title: 'Sincronización Diaria',
      description: 'Sincroniza los procesos de las últimas 24 horas',
      action: actions.runDailySync,
      icon: ClockIcon
    },
    {
      id: 'fullSync',
      title: 'Sincronización Completa',
      description: 'Sincroniza todos los procesos del período especificado',
      action: () => actions.runFullSync(fullSyncDays),
      icon: ArrowPathIcon,
      hasOptions: true
    },
    {
      id: 'tiSync',
      title: 'Sincronización TI',
      description: 'Sincroniza específicamente procesos de TI',
      action: actions.runTISync,
      icon: DocumentTextIcon
    },
    {
      id: 'generateEmbeddings',
      title: 'Generar Embeddings',
      description: 'Genera embeddings para búsqueda semántica',
      action: () => actions.generateEmbeddings(embeddingsBatchSize),
      icon: SparklesIcon,
      hasOptions: true
    }
  ];

  return (
    <div className="space-y-6">
      {operationsList.map((operation) => {
        const Icon = operation.icon;
        const operationState = operations[operation.id];
        
        return (
          <Card key={operation.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Icon className="w-6 h-6 text-seace-blue mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold">{operation.title}</h3>
                    <p className="text-gray-600 text-sm">{operation.description}</p>
                  </div>
                </div>
                <Button
                  onClick={operation.action}
                  loading={operationState?.loading}
                  disabled={operationState?.loading}
                  className="flex items-center"
                >
                  <PlayIcon className="w-4 h-4 mr-2" />
                  Ejecutar
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              {/* Options */}
              {operation.hasOptions && (
                <div className="mb-4">
                  {operation.id === 'fullSync' && (
                    <div className="flex items-center space-x-4">
                      <label className="text-sm font-medium text-gray-700">
                        Días hacia atrás:
                      </label>
                      <input
                        type="number"
                        value={fullSyncDays}
                        onChange={(e) => setFullSyncDays(Number(e.target.value))}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        min="1"
                        max="3650"
                      />
                    </div>
                  )}
                  {operation.id === 'generateEmbeddings' && (
                    <div className="flex items-center space-x-4">
                      <label className="text-sm font-medium text-gray-700">
                        Tamaño del lote:
                      </label>
                      <input
                        type="number"
                        value={embeddingsBatchSize}
                        onChange={(e) => setEmbeddingsBatchSize(Number(e.target.value))}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        min="1"
                        max="100"
                      />
                    </div>
                  )}
                </div>
              )}
              
              {/* Status */}
              {operationState?.loading && (
                <Alert
                  type="info"
                  title="Operación en progreso"
                  message="Esta operación puede tomar varios minutos. No cierres esta página."
                />
              )}
              
              {operationState?.error && (
                <ErrorAlert
                  error={operationState.error}
                  onDismiss={() => {}}
                />
              )}
              
              {operationState?.result && (
                <Alert
                  type="success"
                  title="Operación completada"
                  message={JSON.stringify(operationState.result, null, 2)}
                />
              )}
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
};

const UserManagement = ({ users, loading, error }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);

  const openUserDetail = (user) => {
    setSelectedUser(user);
    setShowUserDetailModal(true);
  };

  const closeUserDetail = () => {
    setShowUserDetailModal(false);
    setSelectedUser(null);
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
        onDismiss={() => {}}
      />
    );
  }

  // Calcular estadísticas de usuarios
  const totalUsers = users?.length || 0;
  const activeUsers = users?.filter(u => u.is_active)?.length || 0;
  const adminUsers = users?.filter(u => u.role === 'admin')?.length || 0;
  const usersWithProfile = users?.filter(u => u.profile_completed)?.length || 0;
  const usersWithRecommendations = users?.filter(u => u.recommendations_count > 0)?.length || 0;

  return (
    <div className="space-y-6">
      {/* Estadísticas de Usuarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Usuarios</p>
                <p className="text-2xl font-bold text-blue-900">{totalUsers}</p>
              </div>
              <UsersIcon className="w-8 h-8 text-blue-400" />
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Activos</p>
                <p className="text-2xl font-bold text-green-900">{activeUsers}</p>
              </div>
              <CheckCircleIcon className="w-8 h-8 text-green-400" />
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Admins</p>
                <p className="text-2xl font-bold text-red-900">{adminUsers}</p>
              </div>
              <CogIcon className="w-8 h-8 text-red-400" />
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Con Perfil</p>
                <p className="text-2xl font-bold text-purple-900">{usersWithProfile}</p>
              </div>
              <UserIcon className="w-8 h-8 text-purple-400" />
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-indigo-600 font-medium">Con Recomendaciones</p>
                <p className="text-2xl font-bold text-indigo-900">{usersWithRecommendations}</p>
              </div>
              <SparklesIcon className="w-8 h-8 text-indigo-400" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Tabla de Usuarios */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Lista de Usuarios</h3>
            <div className="text-sm text-gray-500">
              {totalUsers} usuario{totalUsers !== 1 ? 's' : ''} registrado{totalUsers !== 1 ? 's' : ''}
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {users && users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Perfil
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recomendaciones
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Último Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              user.role === 'admin' ? 'bg-red-500' : 'bg-seace-blue'
                            }`}>
                              <span className="text-sm font-medium text-white">
                                {user.full_name?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.full_name || user.username}
                            </div>
                            <div className="text-sm text-gray-500">
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.profile_completed 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.profile_completed ? 'Completo' : 'Incompleto'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="inline-flex items-center px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                          {user.recommendations_count || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.last_login ? (
                          <div>
                            <div>{new Date(user.last_login).toLocaleDateString('es-PE')}</div>
                            <div className="text-xs text-gray-400">
                              {new Date(user.last_login).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Nunca</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.created_at ? (
                          <div>
                            <div>{new Date(user.created_at).toLocaleDateString('es-PE')}</div>
                            <div className="text-xs text-gray-400">
                              {new Date(user.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openUserDetail(user)}
                          className="inline-flex items-center px-3 py-1.5 bg-seace-blue text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          <ChartBarIcon className="w-4 h-4 mr-1" />
                          Ver Detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay usuarios</h3>
              <p className="mt-1 text-sm text-gray-500">
                No se encontraron usuarios registrados en el sistema.
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal de Detalle de Usuario */}
      {showUserDetailModal && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              aria-hidden="true"
              onClick={closeUserDetail}
            ></div>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
              <div className="bg-white">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center text-white">
                    <UserIcon className="w-6 h-6 mr-3" />
                    <h3 className="text-xl font-semibold" id="modal-title">
                      Detalle de Usuario
                    </h3>
                  </div>
                  <button
                    onClick={closeUserDetail}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* Body con scroll */}
                <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-6 py-6">
                  <UserProfileAnalytics 
                    userId={selectedUser.id} 
                    userName={selectedUser.full_name || selectedUser.username}
                    userEmail={selectedUser.email}
                    userRole={selectedUser.role}
                    lastLogin={selectedUser.last_login}
                    createdAt={selectedUser.created_at}
                  />
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end">
                  <button
                    onClick={closeUserDetail}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


