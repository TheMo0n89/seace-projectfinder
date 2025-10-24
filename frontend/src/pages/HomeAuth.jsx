import React from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { 
  ChartBarIcon, 
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export const Home = () => {
  const { user, isAdmin } = useAuth();

  const stats = [
    {
      name: 'Procesos Analizados',
      value: '1,247',
      change: '+12%',
      changeType: 'increase',
      icon: ChartBarIcon
    },
    {
      name: 'Oportunidades Activas', 
      value: '89',
      change: '+5%',
      changeType: 'increase',
      icon: ArrowTrendingUpIcon
    },
    {
      name: 'Consultas del Mes',
      value: '156',
      change: '+23%',
      changeType: 'increase',
      icon: ChatBubbleLeftRightIcon
    },
    {
      name: 'Tiempo Promedio',
      value: '2.4 min',
      change: '-8%',
      changeType: 'decrease',
      icon: ClockIcon
    }
  ];

  const recentOpportunities = [
    {
      id: 1,
      title: 'Sistema de Gestión Documental - MINSA',
      entity: 'Ministerio de Salud',
      value: 'S/ 850,000',
      deadline: '2025-11-15',
      relevance: 95
    },
    {
      id: 2,
      title: 'Plataforma E-learning - MINEDU',
      entity: 'Ministerio de Educación', 
      value: 'S/ 1,200,000',
      deadline: '2025-11-20',
      relevance: 92
    },
    {
      id: 3,
      title: 'App Móvil de Trámites - RENIEC',
      entity: 'Registro Nacional de Identificación',
      value: 'S/ 650,000',
      deadline: '2025-11-25',
      relevance: 89
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Bienvenido, {user?.full_name || user?.username}
                </h1>
                <p className="mt-1 text-gray-600">
                  {isAdmin() 
                    ? 'Panel de administración - Gestiona todo el sistema'
                    : 'Explora las mejores oportunidades de contratación pública'
                  }
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  isAdmin() 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {isAdmin() ? '👑 Administrador' : '👤 Usuario'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.name} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <stat.icon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Acciones Rápidas */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Acciones Rápidas
              </h3>
              <div className="space-y-4">
                {!isAdmin() && (
                  <>
                    <a
                      href="/catalog"
                      className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <MagnifyingGlassIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          Explorar Catálogo
                        </p>
                        <p className="text-sm text-gray-500">
                          Buscar nuevas oportunidades
                        </p>
                      </div>
                    </a>
                    
                    <a
                      href="/catalog?chatbot=open"
                      className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <div className="bg-green-100 p-2 rounded-lg">
                        <ChatBubbleLeftRightIcon className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          Consultar IA
                        </p>
                        <p className="text-sm text-gray-500">
                          Obtener recomendaciones
                        </p>
                      </div>
                    </a>
                  </>
                )}

                {isAdmin() && (
                  <>
                    <a
                      href="/admin"
                      className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <SparklesIcon className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          Panel Admin
                        </p>
                        <p className="text-sm text-gray-500">
                          Gestionar sistema completo
                        </p>
                      </div>
                    </a>

                    <a
                      href="/admin#etl"
                      className="flex items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                    >
                      <div className="bg-orange-100 p-2 rounded-lg">
                        <ChartBarIcon className="h-5 w-5 text-orange-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          ETL & Scraping
                        </p>
                        <p className="text-sm text-gray-500">
                          Gestionar extracción de datos
                        </p>
                      </div>
                    </a>
                  </>
                )}

                <a
                  href="/dashboard"
                  className="flex items-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <ChartBarIcon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      Ver Dashboard
                    </p>
                    <p className="text-sm text-gray-500">
                      Análisis y métricas
                    </p>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* Oportunidades Recientes */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isAdmin() ? 'Procesos Detectados Recientemente' : 'Oportunidades Recomendadas'}
                </h3>
                <a
                  href="/catalog"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Ver todas →
                </a>
              </div>
              
              <div className="space-y-4">
                {recentOpportunities.map((opportunity) => (
                  <div
                    key={opportunity.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">
                          {opportunity.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {opportunity.entity}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Valor: {opportunity.value}</span>
                          <span>Vence: {opportunity.deadline}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          opportunity.relevance >= 90 
                            ? 'bg-green-100 text-green-800'
                            : opportunity.relevance >= 80
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {opportunity.relevance}% relevante
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};